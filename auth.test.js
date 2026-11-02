const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { after, test } = require("node:test");

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "collegepath-auth-"));
const databasePath = path.join(temporaryDirectory, "test.sqlite");
const serverPath = path.join(__dirname, "server.js");
let serverProcess;
let baseUrl;

async function unusedPort() {
  const socket = net.createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const { port } = socket.address();
  await new Promise(resolve => socket.close(resolve));
  return port;
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/session`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error("The auth test server did not start.");
}

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill();
    await once(serverProcess, "exit");
  }
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("registration, saved colleges, enquiries, sessions, and role authorization", async () => {
  const port = await unusedPort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["--experimental-sqlite", serverPath], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", COLLEGEPATH_DB: databasePath },
    stdio: "ignore"
  });
  await waitUntilReady();
  assert.equal((await fetch(`${baseUrl}/server.js`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/auth.test.js`)).status, 404);

  const call = (endpoint, { cookie, ...options } = {}) => fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...options.headers }
  });
  const firstEmail = "student@example.test";
  const firstPassword = "CorrectHorseBattery2026!";
  const register = await call("/api/register", { method: "POST", body: JSON.stringify({ name: "Student One", email: firstEmail, password: firstPassword, role: "admin" }) });
  assert.equal(register.status, 201);
  const firstCookie = register.headers.get("set-cookie").split(";")[0];
  const student = (await register.json()).user;
  assert.equal(student.role, "student", "signup cannot assign a privileged role");
  assert.equal((await (await call("/api/session", { cookie: firstCookie })).json()).user.email, firstEmail);

  assert.equal((await call("/api/enquiries", { cookie: firstCookie })).status, 403);
  assert.equal((await call("/api/admin/users", { cookie: firstCookie })).status, 403);
  assert.equal((await call("/api/saved-colleges", { method: "POST", cookie: firstCookie, body: JSON.stringify({ collegeId: "iit-delhi" }) })).status, 201);
  assert.equal((await (await call("/api/saved-colleges", { cookie: firstCookie })).json()).saved.length, 1);
  assert.equal((await call("/api/saved-colleges", { method: "POST", cookie: firstCookie, headers: { Origin: "http://attacker.example" }, body: JSON.stringify({ collegeId: "bits-pilani" }) })).status, 403);

  const enquiry = await call("/api/enquiries", { method: "POST", body: JSON.stringify({ name: "Parent One", email: "parent@example.test", phone: "5551234567", year: "2027", message: "College shortlist guidance" }) });
  assert.equal(enquiry.status, 201);
  assert.equal((await call("/api/enquiries", { cookie: firstCookie })).status, 403);

  const secondRegister = await call("/api/register", { method: "POST", body: JSON.stringify({ name: "Student Two", email: "student-two@example.test", password: firstPassword }) });
  assert.equal(secondRegister.status, 201);
  const secondStudent = (await secondRegister.json()).user;
  const secondCookie = secondRegister.headers.get("set-cookie").split(";")[0];
  assert.equal((await (await call("/api/saved-colleges", { cookie: secondCookie })).json()).saved.length, 0, "student data is isolated by owner");
  assert.equal((await call("/api/login", { method: "POST", body: JSON.stringify({ email: firstEmail, password: "not-the-password" }) })).status, 401);
  assert.equal((await call("/api/register", { method: "POST", body: JSON.stringify({ name: "Duplicate", email: firstEmail, password: firstPassword }) })).status, 409);

  const promotion = spawnSync(process.execPath, ["--experimental-sqlite", serverPath, "promote", firstEmail, "admin"], {
    env: { ...process.env, COLLEGEPATH_DB: databasePath },
    encoding: "utf8"
  });
  assert.equal(promotion.status, 0, promotion.stderr);
  assert.equal((await call("/api/enquiries", { cookie: firstCookie })).status, 200);
  assert.equal((await call("/api/admin/users", { cookie: firstCookie })).status, 200);

  const downgrade = await call(`/api/admin/users/${secondStudent.id}/role`, { method: "PATCH", cookie: firstCookie, body: JSON.stringify({ role: "counsellor" }) });
  assert.equal(downgrade.status, 200);
  assert.equal((await (await call("/api/session", { cookie: secondCookie })).json()).user.role, "counsellor");
  assert.equal((await call("/api/enquiries", { cookie: secondCookie })).status, 200);
  assert.equal((await call("/api/admin/users", { cookie: secondCookie })).status, 403);

  assert.equal((await call("/api/logout", { method: "POST", cookie: firstCookie })).status, 200);
  assert.equal((await (await call("/api/session", { cookie: firstCookie })).json()).user, null);
});