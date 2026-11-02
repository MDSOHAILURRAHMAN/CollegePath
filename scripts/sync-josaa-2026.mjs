import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexUrl = "https://josaa.admissions.nic.in/applicant/seatmatrix/instituteview.aspx";
const academicYear = "2026-27";
const output = resolve(root, "prisma/seed-data/josaa-2026.json");
const headers = { "User-Agent": "CollegePath public-data sync" };
const execFileAsync = promisify(execFile);

function decodeHtml(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"', rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—" };
  return value
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === "x" ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function htmlText(value) {
  return decodeHtml(value
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<br\b[^>]*>|<\/p\s*>|<\/tr\s*>|<\/li\s*>|<\/h[1-6]\s*>/gi, "\n")
    .replace(/<\/(?:td|th)\s*>/gi, "\t")
    .replace(/<[^>]+>/g, " "))
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map(line => line.replace(/[\t ]+/g, " ").replace(/\s+\t/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function htmlCells(row) {
  return [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td\s*>/gi)].map(match => htmlText(match[1]));
}

async function fetchHtml(url) {
  if (process.platform === "win32") {
    const command = `$ProgressPreference='SilentlyContinue'; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false); $response=Invoke-WebRequest -Uri '${url}' -UseBasicParsing -TimeoutSec 35 -UserAgent '${headers["User-Agent"]}'; if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) { throw "HTTP $($response.StatusCode)" }; [Console]::Write($response.Content)`;
    let lastError;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
        return stdout;
      } catch (error) {
        lastError = error;
        await new Promise(resolveDelay => setTimeout(resolveDelay, 1000 * (attempt + 1)));
      }
    }
    throw lastError;
  }
  const { stdout } = await execFileAsync(process.platform === "win32" ? "curl.exe" : "curl", [
    "--fail", "--silent", "--show-error", "--location", "--max-time", "35",
    "--user-agent", headers["User-Agent"], url,
  ], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

function parseInstitutions(html) {
  const institutions = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)) {
    const row = match[1];
    const link = row.match(/href="InstProfile\.aspx\?instcd=(\d+)"/i);
    if (!link) continue;
    const cells = htmlCells(row);
    const code = Number(link[1]);
    const nameCell = (cells[2] ?? "").split(/\s*\n\s*/).map(value => value.trim()).filter(Boolean);
    const name = nameCell.find(value => !new RegExp(`^${code}\\s*$`).test(value));
    if (!name) throw new Error(`JoSAA directory row ${code} did not contain an institution name.`);
    const website = cells[4]?.match(/Website:\s*(\S+)/i)?.[1] ?? null;
    const sourceUrl = new URL(`InstProfile.aspx?instcd=${code}`, indexUrl).toString();
    institutions.push({ code, name, address: cells[3] ?? null, website: website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : null, sourceUrl });
  }
  const unique = [...new Map(institutions.map(item => [item.code, item])).values()];
  if (unique.length !== 138) throw new Error(`Expected 138 JoSAA 2026 institutes, found ${unique.length}; refusing to publish an incomplete snapshot.`);
  return unique;
}

function parseProgramRows(html) {
  const programs = [];
  const pattern = /<span\b[^>]*id="([^"]*gvSeatViewTab_ctl\d+_lblAcademicProgram)"[^>]*>([\s\S]*?)<\/span\s*>/gi;
  for (const match of html.matchAll(pattern)) {
    const suffix = match[1].match(/_ctl(\d+)_lblAcademicProgram$/i)?.[1];
    const name = htmlText(match[2]).replace(/\s+/g, " ").trim();
    const codeMatch = suffix && html.match(new RegExp(`<span\\b[^>]*id="[^"]*gvSeatViewTab_ctl${suffix}_lblAcademicProgramCode"[^>]*>([\\s\\S]*?)<\\/span\\s*>`, "i"));
    const code = codeMatch ? htmlText(codeMatch[1]).trim() : "";
    if (name && code) programs.push({ code, name });
  }
  return [...new Map(programs.map(program => [`${program.code}:${program.name}`, program])).values()];
}

function extractFeeText(html, sourceUrl) {
  const open = /<div\b[^>]*id="[^"]*pnlFeeStructure"[^>]*>/i.exec(html);
  if (!open || open.index === undefined) return null;
  const contentStart = open.index + open[0].length;
  let depth = 1;
  let contentEnd = -1;
  for (const tag of html.slice(contentStart).matchAll(/<\/?div\b[^>]*>/gi)) {
    const token = tag[0];
    if (/^<\/div/i.test(token)) depth--;
    else if (!/\/\s*>$/.test(token)) depth++;
    if (depth === 0) { contentEnd = contentStart + (tag.index ?? 0); break; }
  }
  if (contentEnd < contentStart) return null;
  const feeHtml = html.slice(contentStart, contentEnd).replace(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>/gi, (_anchor, _quote, rawHref, label) => {
    const href = decodeHtml(rawHref).trim();
    if (!/^(?:https?:\/\/|\/|\.{1,2}\/|#)/i.test(href)) return label;
    try { return `${label}\nOfficial link: ${new URL(href, sourceUrl).toString()}\n`; } catch { return label; }
  });
  const text = htmlText(feeHtml);
  if (!/2026\s*[-–/]\s*(?:2027|27)(?!\d)/i.test(text)) return null;
  return text.length > 40000 ? `${text.slice(0, 40000)}\n[Source text truncated; open the official profile for the complete schedule.]` : text;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
      await new Promise(resolveDelay => setTimeout(resolveDelay, 120));
    }
  }));
  return results;
}

const directoryHtml = await fetchHtml(indexUrl);
const institutions = parseInstitutions(directoryHtml);
let fetchedProfiles = 0;
const snapshot = await mapLimit(institutions, 2, async institution => {
  const html = await fetchHtml(institution.sourceUrl);
  const header = htmlText((html.match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]\s*>/gi) ?? []).join("\n"));
  if (!header.includes("Academic Year 2026-27")) throw new Error(`Profile ${institution.code} is not the 2026-27 session.`);
  const programs = parseProgramRows(html);
  const codeInProfile = new RegExp(`id="[^"]*gvSeatViewTab_ctl\\d+_lblInstCode"[^>]*>\\s*${institution.code}\\s*<\\/span`, "i").test(html);
  if (programs.length && !codeInProfile) throw new Error(`Profile ${institution.code} returned programs without its matching institute code.`);
  fetchedProfiles++;
  if (fetchedProfiles % 10 === 0 || fetchedProfiles === institutions.length) console.info(`Fetched ${fetchedProfiles}/${institutions.length} official institute profiles.`);
  return { ...institution, profileAvailable: codeInProfile, programs, feeScheduleText: programs.length ? extractFeeText(html, institution.sourceUrl) : null };
});

const programCount = snapshot.reduce((sum, institution) => sum + institution.programs.length, 0);
const feeScheduleCount = snapshot.filter(institution => institution.feeScheduleText).length;
if (programCount < 900) throw new Error(`Expected at least 900 programs, found ${programCount}; refusing to publish an incomplete snapshot.`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ source: indexUrl, academicYear, fetchedAt: new Date().toISOString(), institutionCount: snapshot.length, programCount, feeScheduleCount, institutions: snapshot }, null, 2)}\n`, "utf8");
console.info(`Saved ${snapshot.length} official institutes (${snapshot.filter(item => item.profileAvailable).length} with live profile rows), ${programCount} programs, and ${feeScheduleCount} fee schedules for ${academicYear} to ${output}`);
