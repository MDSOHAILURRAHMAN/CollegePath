import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const updateSchema = z.object({ status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"]).optional(), note: z.string().trim().min(2).max(2000).optional(), followUpAt: z.iso.datetime().nullable().optional() }).refine(data => data.status !== undefined || data.note !== undefined || data.followUpAt !== undefined);

export async function PATCH(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!["COUNSELLOR", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid status, note, or follow-up date." }, { status: 400 });
  const { leadId } = await params;
  try {
    const lead = await prisma.$transaction(async transaction => {
      const found = await transaction.lead.findUnique({ where: { id: leadId }, select: { id: true } });
      if (!found) return null;
      if (parsed.data.note) await transaction.leadNote.create({ data: { leadId, authorId: session.user.id, note: parsed.data.note } });
      return transaction.lead.update({ where: { id: leadId }, data: { ...(parsed.data.status ? { status: parsed.data.status } : {}), ...(parsed.data.followUpAt !== undefined ? { followUpAt: parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null } : {}) }, select: { id: true, status: true, followUpAt: true } });
    });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: "LEAD_UPDATED", entityType: "Lead", entityId: leadId, metadata: { status: parsed.data.status ?? null, noteAdded: Boolean(parsed.data.note) } } });
    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json({ error: "Lead update failed." }, { status: 503 });
  }
}