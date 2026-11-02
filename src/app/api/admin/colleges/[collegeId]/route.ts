import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const updateSchema = z.object({ verificationStatus: z.enum(["DRAFT", "PENDING_REVIEW", "VERIFIED", "NEEDS_UPDATE", "ARCHIVED"]), sourceName: z.string().trim().max(180).optional().or(z.literal("")), sourceUrl: z.string().trim().url().refine(value => new URL(value).protocol === "https:", "Use an HTTPS source URL.").optional().or(z.literal("")), reviewerNotes: z.string().trim().max(2000).optional().or(z.literal("")) });

export async function PATCH(request: Request, { params }: { params: Promise<{ collegeId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid status and source." }, { status: 400 });
  if (parsed.data.verificationStatus === "VERIFIED" && !parsed.data.sourceUrl) return NextResponse.json({ error: "A source URL is required before verifying a record." }, { status: 400 });
  const { collegeId } = await params;
  try {
    const result = await prisma.$transaction(async transaction => {
      const existing = await transaction.college.findUnique({ where: { id: collegeId }, select: { id: true, verificationStatus: true, sourceId: true } });
      if (!existing) return null;
      let sourceId = existing.sourceId;
      if (parsed.data.sourceUrl) {
        const source = await transaction.dataSource.create({ data: { name: parsed.data.sourceName || "Official institutional source", sourceType: "OFFICIAL_WEBSITE", url: parsed.data.sourceUrl, verificationStatus: "VERIFIED", checkedAt: parsed.data.verificationStatus === "VERIFIED" ? new Date() : null, reviewerNotes: parsed.data.reviewerNotes || null } });
        sourceId = source.id;
      }
      const college = await transaction.college.update({ where: { id: collegeId }, data: { verificationStatus: parsed.data.verificationStatus, sourceId, lastVerifiedAt: parsed.data.verificationStatus === "VERIFIED" ? new Date() : undefined }, select: { id: true, name: true, slug: true, verificationStatus: true, lastVerifiedAt: true } });
      await transaction.auditLog.create({ data: { actorId: session.user.id, action: "COLLEGE_VERIFICATION_UPDATED", entityType: "College", entityId: collegeId, metadata: { oldStatus: existing.verificationStatus, newStatus: parsed.data.verificationStatus, sourceAdded: Boolean(parsed.data.sourceUrl) } } });
      return college;
    });
    if (!result) return NextResponse.json({ error: "College not found." }, { status: 404 });
    return NextResponse.json({ college: result });
  } catch { return NextResponse.json({ error: "College status could not be updated." }, { status: 503 }); }
}