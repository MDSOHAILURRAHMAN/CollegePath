import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const serviceSchema = z.object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), name: z.string().trim().min(3).max(160), description: z.string().trim().min(10).max(2000), durationMinutes: z.number().int().min(15).max(240), priceInr: z.number().finite().min(0).max(500_000).nullable(), deliverables: z.array(z.string().trim().min(3).max(180)).min(1).max(10), cancellationPolicy: z.string().trim().min(10).max(2000), active: z.boolean() });

async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { response: NextResponse.json({ error: "Administrator access is required." }, { status: 403 }) };
  return { session };
}

export async function GET(request: Request) {
  const access = await requireAdmin(request);
  if (access.response) return access.response;
  try {
    const [services, counsellors] = await Promise.all([
      prisma.counsellingService.findMany({ orderBy: { name: "asc" }, select: { id: true, slug: true, name: true, description: true, durationMinutes: true, priceInr: true, deliverables: true, cancellationPolicy: true, active: true } }),
      prisma.user.findMany({ where: { role: "COUNSELLOR" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    ]);
    return NextResponse.json({ services, counsellors });
  } catch { return NextResponse.json({ error: "Counselling configuration is unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const access = await requireAdmin(request);
  if (access.response) return access.response;
  const parsed = serviceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the service fields and policy." }, { status: 400 });
  if (parsed.data.active && (!parsed.data.priceInr || !parsed.data.cancellationPolicy || !parsed.data.deliverables.length)) return NextResponse.json({ error: "An active service requires a price, cancellation policy, and deliverables." }, { status: 400 });
  try {
    const service = await prisma.counsellingService.create({ data: { ...parsed.data, priceInr: parsed.data.priceInr === null ? null : new Prisma.Decimal(parsed.data.priceInr) }, select: { id: true, slug: true, name: true, active: true } });
    await prisma.auditLog.create({ data: { actorId: access.session.user.id, action: "COUNSELLING_SERVICE_CREATED", entityType: "CounsellingService", entityId: service.id } });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That service slug already exists." }, { status: 409 });
    return NextResponse.json({ error: "Service could not be created." }, { status: 503 });
  }
}