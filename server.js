const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { DatabaseSync } = require("node:sqlite");

const scrypt = promisify(crypto.scrypt);
const root = __dirname;
const dataDirectory = path.join(root, "data");
fs.mkdirSync(dataDirectory, { recursive: true });
const databasePath = path.resolve(process.env.COLLEGEPATH_DB || path.join(dataDirectory, "collegepath.sqlite"));
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_salt BLOB NOT NULL,
    password_hash BLOB NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'counsellor', 'admin')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saved_colleges (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id TEXT NOT NULL,
    college_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, college_id)
  );
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    admission_year TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'resolved')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const colleges = [
  ["iit-delhi", "Indian Institute of Technology Delhi"],
  ["mit-manipal", "Manipal Institute of Technology"],
  ["vit-vellore", "Vellore Institute of Technology"],
  ["nit-trichy", "NIT Tiruchirappalli"],
  ["bits-pilani", "BITS Pilani"],
  ["srm-chennai", "SRM Institute of Science and Technology"],
  ["jadavpur", "Jadavpur University"],
  ["pes-bengaluru", "PES University"]
];
const collegeNames = new Map(colleges);
const sessionLifetime = 1000 * 60 * 60 * 24 * 7;
const requestCounts = new Map();
const mimeTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  response.end(JSON.stringify(value));
}

function readCookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").map(cookie => {
    const separator = cookie.indexOf("=");
    return separator < 0 ? null : [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1).trim())];
  }).filter(Boolean));
}

function sessionCookie(token, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `collegepath_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function getUser(request) {
  const token = readCookies(request).collegepath_session;
  if (!token) return null;
  const session = database.prepare(`SELECT users.id, users.name, users.email, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?`).get(crypto.createHash("sha256").update(token).digest("hex"), Date.now());
  return session || null;
}

function requireRole(user, roles) {
  if (!user) throw new HttpError(401, "Sign in to continue.");
  if (!roles.includes(user.role)) throw new HttpError(403, "Your account does not have access to this area.");
}

function checkSameOrigin(request) {
  const origin = request.headers.origin;
  if (origin && new URL(origin).host !== request.headers.host) throw new HttpError(403, "Cross-origin requests are not allowed.");
}

function rateLimit(request, key, limit = 12) {
  const now = Date.now();
  const bucketKey = `${request.socket.remoteAddress}:${key}`;
  const current = requestCounts.get(bucketKey);
  if (!current || now - current.start > 60_000) requestCounts.set(bucketKey, { start: now, count: 1 });
  else if (++current.count > limit) throw new HttpError(429, "Too many attempts. Please wait a minute and try again.");
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw new HttpError(413, "Request is too large.");
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

function requireText(value, label, min, max) {
  if (typeof value !== "string") throw new HttpError(400, `${label} is required.`);
  const text = value.trim();
  if (text.length < min || text.length > max) throw new HttpError(400, `${label} must be between ${min} and ${max} characters.`);
  return text;
}

async function createSession(response, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionLifetime;
  database.prepare("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?, ?, ?)").run(crypto.createHash("sha256").update(token).digest("hex"), userId, expiresAt);
  response.setHeader("Set-Cookie", sessionCookie(token, Math.floor(sessionLifetime / 1000)));
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function handleApi(request, response, url) {
  const route = `${request.method} ${url.pathname}`;
  const user = getUser(request);
  if (["POST", "PATCH", "DELETE"].includes(request.method)) checkSameOrigin(request);

  if (route === "GET /api/session") return sendJson(response, 200, { user: user ? publicUser(user) : null });

  if (route === "POST /api/register") {
    rateLimit(request, "register", 5);
    const body = await readBody(request);
    const name = requireText(body.name, "Name", 2, 80);
    const email = requireText(body.email, "Email", 3, 254).toLowerCase();
    const password = requireText(body.password, "Password", 10, 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
    const salt = crypto.randomBytes(16);
    const passwordHash = await scrypt(password, salt, 64);
    let result;
    try {
      result = database.prepare("INSERT INTO users(name, email, password_salt, password_hash) VALUES(?, ?, ?, ?)").run(name, email, salt, passwordHash);
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) throw new HttpError(409, "An account with this email already exists.");
      throw error;
    }
    await createSession(response, Number(result.lastInsertRowid));
    const newUser = database.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(Number(result.lastInsertRowid));
    return sendJson(response, 201, { user: publicUser(newUser) });
  }

  if (route === "POST /api/login") {
    rateLimit(request, "login", 10);
    const body = await readBody(request);
    const email = requireText(body.email, "Email", 3, 254).toLowerCase();
    const password = requireText(body.password, "Password", 1, 200);
    const record = database.prepare("SELECT id, name, email, role, password_salt, password_hash FROM users WHERE email = ?").get(email);
    const salt = record ? record.password_salt : Buffer.alloc(16);
    const expectedHash = record ? record.password_hash : Buffer.alloc(64);
    const actualHash = await scrypt(password, salt, 64);
    if (!record || !crypto.timingSafeEqual(expectedHash, actualHash)) throw new HttpError(401, "Email or password is incorrect.");
    await createSession(response, record.id);
    return sendJson(response, 200, { user: publicUser(record) });
  }

  if (route === "POST /api/logout") {
    const token = readCookies(request).collegepath_session;
    if (token) database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(crypto.createHash("sha256").update(token).digest("hex"));
    return sendJson(response, 200, { ok: true }, { "Set-Cookie": sessionCookie("", 0) });
  }

  if (route === "GET /api/saved-colleges") {
    requireRole(user, ["student"]);
    const saved = database.prepare("SELECT college_id AS id, college_name AS name, created_at FROM saved_colleges WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
    return sendJson(response, 200, { saved });
  }

  if (route === "POST /api/saved-colleges") {
    requireRole(user, ["student"]);
    const body = await readBody(request);
    const collegeId = requireText(body.collegeId, "College", 1, 50);
    const collegeName = collegeNames.get(collegeId);
    if (!collegeName) throw new HttpError(400, "Choose a college from the college finder.");
    database.prepare("INSERT OR IGNORE INTO saved_colleges(user_id, college_id, college_name) VALUES(?, ?, ?)").run(user.id, collegeId, collegeName);
    return sendJson(response, 201, { ok: true });
  }

  if (route === "DELETE /api/saved-colleges") {
    requireRole(user, ["student"]);
    const collegeId = url.searchParams.get("collegeId");
    if (!collegeId) throw new HttpError(400, "A college ID is required.");
    database.prepare("DELETE FROM saved_colleges WHERE user_id = ? AND college_id = ?").run(user.id, collegeId);
    return sendJson(response, 200, { ok: true });
  }

  if (route === "POST /api/enquiries") {
    rateLimit(request, "enquiry", 5);
    const body = await readBody(request);
    const name = requireText(body.name, "Name", 2, 80);
    const email = requireText(body.email, "Email", 3, 254).toLowerCase();
    const phone = requireText(body.phone, "Phone", 7, 30);
    const admissionYear = requireText(body.year, "Admission year", 4, 30);
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
    const result = database.prepare("INSERT INTO enquiries(name, email, phone, admission_year, message) VALUES(?, ?, ?, ?, ?)").run(name, email, phone, admissionYear, message);
    return sendJson(response, 201, { ok: true, id: Number(result.lastInsertRowid) });
  }

  if (route === "GET /api/enquiries") {
    requireRole(user, ["counsellor", "admin"]);
    const enquiries = database.prepare("SELECT id, name, email, phone, admission_year AS year, message, status, created_at FROM enquiries ORDER BY created_at DESC, id DESC").all();
    return sendJson(response, 200, { enquiries });
  }

  const enquiryStatusMatch = url.pathname.match(/^\/api\/enquiries\/(\d+)$/);
  if (enquiryStatusMatch && request.method === "PATCH") {
    requireRole(user, ["counsellor", "admin"]);
    const body = await readBody(request);
    if (!["new", "contacted", "resolved"].includes(body.status)) throw new HttpError(400, "Choose a valid enquiry status.");
    const result = database.prepare("UPDATE enquiries SET status = ? WHERE id = ?").run(body.status, Number(enquiryStatusMatch[1]));
    if (!result.changes) throw new HttpError(404, "Enquiry not found.");
    return sendJson(response, 200, { ok: true });
  }

  if (route === "GET /api/admin/users") {
    requireRole(user, ["admin"]);
    return sendJson(response, 200, { users: database.prepare("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC, id DESC").all() });
  }

  const roleMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  if (roleMatch && request.method === "PATCH") {
    requireRole(user, ["admin"]);
    const body = await readBody(request);
    if (!["student", "counsellor", "admin"].includes(body.role)) throw new HttpError(400, "Choose a valid account role.");
    if (Number(roleMatch[1]) === user.id && body.role !== "admin") throw new HttpError(400, "You cannot remove your own admin role.");
    const result = database.prepare("UPDATE users SET role = ? WHERE id = ?").run(body.role, Number(roleMatch[1]));
    if (!result.changes) throw new HttpError(404, "User not found.");
    return sendJson(response, 200, { ok: true });
  }

  throw new HttpError(404, "API route not found.");
}

function serveStatic(request, response, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(`${root}${path.sep}`) || ["server.js", "auth.test.js", "package.json", "package-lock.json"].includes(path.basename(filePath)) || filePath.includes(`${path.sep}data${path.sep}`)) {
    response.writeHead(404).end("Not found");
    return;
  }
  const contentType = mimeTypes[path.extname(filePath).toLowerCase()];
  if (!contentType || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Cache-Control": "no-cache"
  });
  fs.createReadStream(filePath).pipe(response);
}

async function promoteUser(email, role) {
  if (!email || !["student", "counsellor", "admin"].includes(role)) {
    console.error("Usage: node --experimental-sqlite server.js promote <email> <student|counsellor|admin>");
    process.exitCode = 1;
    return;
  }
  const result = database.prepare("UPDATE users SET role = ? WHERE email = ? COLLATE NOCASE").run(role, email.trim().toLowerCase());
  if (!result.changes) {
    console.error("No account found with that email. Create it through the registration page first.");
    process.exitCode = 1;
    return;
  }
  console.log(`Updated ${email} to ${role}.`);
}

if (process.argv[2] === "promote") {
  promoteUser(process.argv[3], process.argv[4]).finally(() => database.close());
} else {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    try {
      if (url.pathname.startsWith("/api/")) await handleApi(request, response, url);
      else if (request.method === "GET" || request.method === "HEAD") serveStatic(request, response, url);
      else sendJson(response, 405, { error: "Method not allowed." });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) console.error(error);
      if (!response.headersSent) sendJson(response, status, { error: status === 500 ? "An unexpected server error occurred." : error.message });
      else response.destroy();
    }
  });
  const port = Number(process.env.PORT || 4173);
  server.listen(port, process.env.HOST || "127.0.0.1", () => console.log(`CollegePath is available at http://${process.env.HOST || "127.0.0.1"}:${port}`));
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => { database.close(); process.exit(0); }));
}