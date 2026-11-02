import { parse } from "csv-parse/sync";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { collegeImportRowSchema } from "@/lib/college-import";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type RowError = { row: number; message: string };

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  if (!checkRateLimit(request, "college-csv-import", 3)) return NextResponse.json({ error: "Import limit reached. Try again later." }, { status: 429 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_000_000) return NextResponse.json({ error: "CSV files must be smaller than 2 MB." }, { status: 413 });
  const csv = await request.text();
  if (Buffer.byteLength(csv, "utf8") > 2_000_000) return NextResponse.json({ error: "CSV files must be smaller than 2 MB." }, { status: 413 });

  let rows: Record<string, unknown>[];
  try {
    rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true, bom: true, max_record_size: 12_000, relax_column_count: false }) as Record<string, unknown>[];
  } catch {
    return NextResponse.json({ error: "CSV could not be parsed. Check quotes, commas, and the header row." }, { status: 400 });
  }
  if (!rows.length) return NextResponse.json({ error: "The CSV contains no data rows." }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Import at most 500 college rows at a time." }, { status: 413 });
  const errors: RowError[] = [];
  const seen = new Set<string>();
  const valid: { index: number; row: ReturnType<typeof collegeImportRowSchema.parse> }[] = [];
  rows.forEach((row, index) => {
    const parsed = collegeImportRowSchema.safeParse(row);
    if (!parsed.success) {
      errors.push({ row: index + 2, message: parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
      return;
    }
    if (seen.has(parsed.data.slug)) {
      errors.push({ row: index + 2, message: `Duplicate slug in this file: ${parsed.data.slug}` });
      return;
    }
    seen.add(parsed.data.slug);
    valid.push({ index: index + 2, row: parsed.data });
  });

  const existing = await prisma.college.findMany({ where: { slug: { in: valid.map(item => item.row.slug) } }, select: { slug: true } }).catch(() => null);
  if (!existing) return NextResponse.json({ error: "College database is unavailable; no rows were imported.", errors }, { status: 503 });
  const existingSlugs = new Set(existing.map(college => college.slug));
  for (let index = valid.length - 1; index >= 0; index -= 1) {
    const item = valid[index];
    if (existingSlugs.has(item.row.slug)) {
      errors.push({ row: item.index, message: `Slug already exists: ${item.row.slug}` });
      valid.splice(index, 1);
    }
  }

  let imported = 0;
  for (const item of valid) {
    try {
      await prisma.$transaction(async transaction => {
        const source = await transaction.dataSource.create({ data: { name: item.row.sourceName || "CSV import source", sourceType: "CSV_IMPORT", url: item.row.sourceUrl || null, verificationStatus: "PENDING_REVIEW" } });
        const college = await transaction.college.create({ data: { name: item.row.name, slug: item.row.slug, description: item.row.description || null, institutionType: item.row.institutionType, officialWebsite: item.row.officialWebsite || null, officialAdmissionUrl: item.row.officialAdmissionUrl || null, sourceId: source.id, verificationStatus: "DRAFT", demoRecord: false, ...(item.row.city && item.row.state ? { campuses: { create: { city: item.row.city, state: item.row.state } } } : {}) } });
        await transaction.auditLog.create({ data: { actorId: session.user.id, action: "COLLEGE_CSV_IMPORTED", entityType: "College", entityId: college.id, metadata: { row: item.index } } });
      });
      imported += 1;
    } catch {
      errors.push({ row: item.index, message: `Could not save ${item.row.slug}; verify uniqueness and database constraints.` });
    }
  }
  return NextResponse.json({ imported, errors, note: "Imported rows remain drafts and are not visible publicly until reviewed." }, { status: errors.length ? 207 : 201 });
}