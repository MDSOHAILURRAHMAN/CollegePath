import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const slotSchema = z.object({ counsellorId: z.string().min(1).max(80), startsAt: z.iso.datetime(), endsAt: z.iso.datetime() }).refine(data => new Date(data.endsAt) > new Date(data.startsAt), { message: "End time must be after start time." });

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  try {
    const slots = await prisma.counsellorAvailability.findMany({ where: { startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 100, select: { id: true, startsAt: true, endsAt: true, isAvailable: true, counsellor: { select: { name: true, email: true } }, booking: { select: { status: true } } } });
    return NextResponse.json({ slots });
  } catch { return NextResponse.json({ error: "Availability is unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  const parsed = slotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Date(parsed.data?.startsAt ?? 0) <= new Date()) return NextResponse.json({ error: "Choose a valid future time slot." }, { status: 400 });
  try {
    const counsellor = await prisma.user.findFirst({ where: { id: parsed.data.counsellorId, role: "COUNSELLOR" }, select: { id: true } });
    if (!counsellor) return NextResponse.json({ error: "Select an account with the counsellor role." }, { status: 400 });
    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);
    const slot = await prisma.$transaction(async transaction => {
      const overlap = await transaction.counsellorAvailability.findFirst({ where: { counsellorId: counsellor.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { id: true } });
      if (overlap) throw new Error("SLOT_OVERLAP");
      return transaction.counsellorAvailability.create({ data: { counsellorId: counsellor.id, startsAt, endsAt }, select: { id: true, startsAt: true, endsAt: true } });
    }, { isolationLevel: "Serializable" });
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: "COUNSELLOR_AVAILABILITY_CREATED", entityType: "CounsellorAvailability", entityId: slot.id } });
    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_OVERLAP") return NextResponse.json({ error: "That time overlaps an existing counsellor slot." }, { status: 409 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That counsellor already has a slot at this start time." }, { status: 409 });
    return NextResponse.json({ error: "Availability could not be added." }, { status: 503 });
  }
}