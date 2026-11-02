import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { collegeSearchAliases } from "@/lib/college-search";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const httpsUrl = z.string().trim().url().refine(value => new URL(value).protocol === "https:", "Use an official HTTPS source URL.").optional().or(z.literal(""));
const collegeSchema = z.object({ name: z.string().trim().min(3).max(180), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), description: z.string().trim().max(4000).optional().or(z.literal("")), institutionType: z.enum(["GOVERNMENT", "PRIVATE", "DEEMED", "AUTONOMOUS", "OTHER"]), city: z.string().trim().max(80).optional().or(z.literal("")), state: z.string().trim().max(80).optional().or(z.literal("")), officialWebsite: httpsUrl, officialAdmissionUrl: httpsUrl, sourceName: z.string().trim().max(180).optional().or(z.literal("")), sourceUrl: httpsUrl });

async function admin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { response: NextResponse.json({ error: "Administrator access is required." }, { status: 403 }) };
  return { session };
}

export async function GET(request: Request) {
  const access = await admin(request);
  if (access.response) return access.response;
  try {
    const colleges = await prisma.college.findMany({ orderBy: { updatedAt: "desc" }, take: 150, select: { id: true, name: true, slug: true, institutionType: true, verificationStatus: true, demoRecord: true, lastVerifiedAt: true, source: { select: { name: true, url: true } }, campuses: { select: { city: true, state: true } } } });
    return NextResponse.json({ colleges });
  } catch { return NextResponse.json({ error: "College records are unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const access = await admin(request);
  if (access.response) return access.response;
  const parsed = collegeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the college fields and source URL.", issues: parsed.error.flatten() }, { status: 400 });
  try {
    const created = await prisma.$transaction(async transaction => {
      const source = parsed.data.sourceUrl ? await transaction.dataSource.create({ data: { name: parsed.data.sourceName || "Official institutional source", sourceType: "OFFICIAL_WEBSITE", url: parsed.data.sourceUrl, verificationStatus: "PENDING_REVIEW" } }) : null;
      const college = await transaction.college.create({ data: { name: parsed.data.name, slug: parsed.data.slug, searchAliases: collegeSearchAliases(parsed.data.name), description: parsed.data.description || null, institutionType: parsed.data.institutionType, officialWebsite: parsed.data.officialWebsite || null, officialAdmissionUrl: parsed.data.officialAdmissionUrl || null, verificationStatus: "DRAFT", demoRecord: false, ...(source ? { sourceId: source.id } : {}), ...(parsed.data.city && parsed.data.state ? { campuses: { create: { city: parsed.data.city, state: parsed.data.state } } } : {}) }, select: { id: true, name: true, slug: true, verificationStatus: true } });
      await transaction.auditLog.create({ data: { actorId: access.session.user.id, action: "COLLEGE_CREATED", entityType: "College", entityId: college.id } });
      return college;
    });
    return NextResponse.json({ college: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That college slug is already in use." }, { status: 409 });
    return NextResponse.json({ error: "College record could not be created." }, { status: 503 });
  }
}
