import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const updateSchema = z.object({ name: z.string().trim().min(3).max(160).optional(), description: z.string().trim().min(10).max(2000).optional(), durationMinutes: z.number().int().min(15).max(240).optional(), priceInr: z.number().finite().min(0).max(500_000).nullable().optional(), deliverables: z.array(z.string().trim().min(3).max(180)).min(1).max(10).optional(), cancellationPolicy: z.string().trim().min(10).max(2000).optional(), active: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ serviceId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid service update." }, { status: 400 });
  const { serviceId } = await params;
  try {
    const current = await prisma.counsellingService.findUnique({ where: { id: serviceId }, select: { id: true, active: true, priceInr: true, deliverables: true, cancellationPolicy: true } });
    if (!current) return NextResponse.json({ error: "Service not found." }, { status: 404 });
    const active = parsed.data.active ?? current.active;
    const price = parsed.data.priceInr === undefined ? current.priceInr : parsed.data.priceInr === null ? null : new Prisma.Decimal(parsed.data.priceInr);
    const deliverables = parsed.data.deliverables ?? current.deliverables;
    const policy = parsed.data.cancellationPolicy ?? current.cancellationPolicy;
    if (active && (!price || !deliverables.length || !policy)) return NextResponse.json({ error: "An active service requires a price, cancellation policy, and deliverables." }, { status: 400 });
    const service = await prisma.counsellingService.update({ where: { id: serviceId }, data: { ...parsed.data, ...(parsed.data.priceInr !== undefined ? { priceInr: price } : {}) }, select: { id: true, slug: true, name: true, active: true, priceInr: true } });
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: "COUNSELLING_SERVICE_UPDATED", entityType: "CounsellingService", entityId: serviceId, metadata: { active: service.active } } });
    return NextResponse.json({ service });
  } catch { return NextResponse.json({ error: "Service update failed." }, { status: 503 }); }
}