import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { response: NextResponse.json({ error: "Administrator access is required." }, { status: 403 }) };
  return { session };
}

const sourceUrlSchema = z.string().trim().url().refine(value => new URL(value).protocol === "https:", "Use an official HTTPS source URL.");
const amountSchema = z.number().finite().min(0).max(100_000_000).nullable();
const feeSchema = z.object({
  academicYear: z.string().trim().regex(/^20\d{2}(?:-\d{2})?$/),
  tuitionInr: amountSchema,
  compulsoryFeesInr: amountSchema,
  hostelInr: amountSchema,
}).refine(fee => fee.tuitionInr !== null || fee.compulsoryFeesInr !== null || fee.hostelInr !== null, "Enter at least one published fee amount.");
const createSchema = z.object({
  name: z.string().trim().min(2).max(180),
  degreeLevel: z.enum(["CERTIFICATE", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE", "DOCTORAL"]),
  durationYears: z.number().int().min(1).max(12).nullable().optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  categorySlugs: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  verificationStatus: z.enum(["DRAFT", "PENDING_REVIEW", "VERIFIED"]),
  sourceName: z.string().trim().min(2).max(180),
  sourceUrl: sourceUrlSchema,
  fee: feeSchema.nullable().optional(),
});
const reviewSchema = z.object({
  recordType: z.enum(["PROGRAM", "FEE"]),
  recordId: z.string().min(1).max(80),
  verificationStatus: z.enum(["DRAFT", "PENDING_REVIEW", "VERIFIED", "NEEDS_UPDATE", "ARCHIVED"]),
  sourceName: z.string().trim().max(180).optional().or(z.literal("")),
  sourceUrl: sourceUrlSchema.optional().or(z.literal("")),
  reviewerNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function GET(request: Request, { params }: { params: Promise<{ collegeId: string }> }) {
  const access = await requireAdmin(request);
  if (access.response) return access.response;
  const { collegeId } = await params;
  try {
    const [college, categories, programs] = await Promise.all([
      prisma.college.findUnique({ where: { id: collegeId }, select: { id: true } }),
      prisma.courseCategory.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
      prisma.program.findMany({ where: { collegeId }, orderBy: { name: "asc" }, include: {
        categories: { include: { category: { select: { slug: true, name: true } } } },
        source: { select: { name: true, url: true, reviewerNotes: true } },
        feeRecords: { orderBy: { academicYear: "desc" }, include: { source: { select: { name: true, url: true, reviewerNotes: true } } } },
      } }),
    ]);
    if (!college) return NextResponse.json({ error: "College not found." }, { status: 404 });
    return NextResponse.json({ categories, programs });
  } catch {
    return NextResponse.json({ error: "Program data is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ collegeId: string }> }) {
  const access = await requireAdmin(request);
  if (access.response) return access.response;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the program, source, and fee fields.", issues: parsed.error.flatten() }, { status: 400 });
  const { collegeId } = await params;
  try {
    const result = await prisma.$transaction(async transaction => {
      const college = await transaction.college.findUnique({ where: { id: collegeId }, select: { id: true, demoRecord: true } });
      if (!college || college.demoRecord) throw new Error("COLLEGE_NOT_AVAILABLE");
      const categoryRows = await transaction.courseCategory.findMany({ where: { slug: { in: parsed.data.categorySlugs } }, select: { id: true, slug: true } });
      if (categoryRows.length !== new Set(parsed.data.categorySlugs).size) throw new Error("CATEGORY_NOT_FOUND");
      const now = new Date();
      const isVerified = parsed.data.verificationStatus === "VERIFIED";
      const source = await transaction.dataSource.create({ data: {
        name: parsed.data.sourceName,
        sourceType: "OFFICIAL_WEBSITE",
        url: parsed.data.sourceUrl,
        verificationStatus: isVerified ? "VERIFIED" : "PENDING_REVIEW",
        checkedAt: isVerified ? now : null,
        reviewerNotes: parsed.data.description || null,
      } });
      const program = await transaction.program.create({ data: {
        collegeId,
        name: parsed.data.name,
        degreeLevel: parsed.data.degreeLevel,
        durationYears: parsed.data.durationYears ?? null,
        description: parsed.data.description || null,
        sourceId: source.id,
        verificationStatus: parsed.data.verificationStatus,
        lastVerifiedAt: isVerified ? now : null,
        ...(categoryRows.length ? { categories: { create: categoryRows.map(category => ({ categoryId: category.id })) } } : {}),
      }, select: { id: true, name: true, degreeLevel: true, verificationStatus: true } });
      if (parsed.data.fee) {
        await transaction.feeRecord.create({ data: {
          collegeId,
          programId: program.id,
          academicYear: parsed.data.fee.academicYear,
          tuitionInr: parsed.data.fee.tuitionInr === null ? null : new Prisma.Decimal(parsed.data.fee.tuitionInr),
          compulsoryFeesInr: parsed.data.fee.compulsoryFeesInr === null ? null : new Prisma.Decimal(parsed.data.fee.compulsoryFeesInr),
          hostelInr: parsed.data.fee.hostelInr === null ? null : new Prisma.Decimal(parsed.data.fee.hostelInr),
          methodology: "Published amount entered by an administrator; check the source and academic year.",
          sourceId: source.id,
          verificationStatus: parsed.data.verificationStatus,
          lastVerifiedAt: isVerified ? now : null,
        } });
      }
      await transaction.auditLog.create({ data: { actorId: access.session.user.id, action: "COLLEGE_PROGRAM_CREATED", entityType: "Program", entityId: program.id, metadata: { collegeId, status: parsed.data.verificationStatus, feeIncluded: Boolean(parsed.data.fee) } } });
      return program;
    });
    return NextResponse.json({ program: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "COLLEGE_NOT_AVAILABLE") return NextResponse.json({ error: "A real college record is required; demo records cannot be edited." }, { status: 404 });
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") return NextResponse.json({ error: "One or more course categories do not exist." }, { status: 400 });
    return NextResponse.json({ error: "Program record could not be created." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ collegeId: string }> }) {
  const access = await requireAdmin(request);
  if (access.response) return access.response;
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid record status and source." }, { status: 400 });
  if (parsed.data.verificationStatus === "VERIFIED" && !parsed.data.sourceUrl) return NextResponse.json({ error: "A source URL is required before verification." }, { status: 400 });
  const { collegeId } = await params;
  try {
    const result = await prisma.$transaction(async transaction => {
      const now = new Date();
      const source = parsed.data.sourceUrl ? await transaction.dataSource.create({ data: {
        name: parsed.data.sourceName || "Official program or fee source",
        sourceType: "OFFICIAL_WEBSITE",
        url: parsed.data.sourceUrl,
        verificationStatus: parsed.data.verificationStatus === "VERIFIED" ? "VERIFIED" : "PENDING_REVIEW",
        checkedAt: parsed.data.verificationStatus === "VERIFIED" ? now : null,
        reviewerNotes: parsed.data.reviewerNotes || null,
      } }) : null;
      if (parsed.data.recordType === "PROGRAM") {
        const existing = await transaction.program.findFirst({ where: { id: parsed.data.recordId, collegeId }, select: { id: true, sourceId: true } });
        if (!existing) return null;
        if (parsed.data.verificationStatus === "VERIFIED" && !source && !existing.sourceId) throw new Error("SOURCE_REQUIRED");
        if (parsed.data.verificationStatus === "VERIFIED" && existing.sourceId && !source) {
          await transaction.dataSource.update({ where: { id: existing.sourceId }, data: { verificationStatus: "VERIFIED", checkedAt: now, ...(parsed.data.reviewerNotes ? { reviewerNotes: parsed.data.reviewerNotes } : {}) } });
        }
        return transaction.program.update({ where: { id: existing.id }, data: {
          verificationStatus: parsed.data.verificationStatus,
          ...(source ? { sourceId: source.id } : {}),
          lastVerifiedAt: parsed.data.verificationStatus === "VERIFIED" ? now : undefined,
        }, select: { id: true, verificationStatus: true, lastVerifiedAt: true } });
      }
      const existing = await transaction.feeRecord.findFirst({ where: { id: parsed.data.recordId, collegeId }, select: { id: true, sourceId: true } });
      if (!existing) return null;
      if (parsed.data.verificationStatus === "VERIFIED" && !source && !existing.sourceId) throw new Error("SOURCE_REQUIRED");
      if (parsed.data.verificationStatus === "VERIFIED" && existing.sourceId && !source) {
        await transaction.dataSource.update({ where: { id: existing.sourceId }, data: { verificationStatus: "VERIFIED", checkedAt: now, ...(parsed.data.reviewerNotes ? { reviewerNotes: parsed.data.reviewerNotes } : {}) } });
      }
      return transaction.feeRecord.update({ where: { id: existing.id }, data: {
        verificationStatus: parsed.data.verificationStatus,
        ...(source ? { sourceId: source.id } : {}),
        lastVerifiedAt: parsed.data.verificationStatus === "VERIFIED" ? now : undefined,
      }, select: { id: true, verificationStatus: true, lastVerifiedAt: true } });
    });
    if (!result) return NextResponse.json({ error: "Program or fee record was not found for this college." }, { status: 404 });
    await prisma.auditLog.create({ data: { actorId: access.session.user.id, action: "COLLEGE_PROGRAM_DATA_REVIEWED", entityType: parsed.data.recordType, entityId: parsed.data.recordId, metadata: { collegeId, newStatus: parsed.data.verificationStatus } } });
    return NextResponse.json({ record: result });
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_REQUIRED") return NextResponse.json({ error: "A source URL is required before verification." }, { status: 400 });
    return NextResponse.json({ error: "Program or fee review could not be saved." }, { status: 503 });
  }
}
