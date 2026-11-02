import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const bookingSchema = z.object({ serviceId: z.string().min(1).max(80), availabilityId: z.string().min(1).max(80), studentNotes: z.string().trim().max(2000).optional() });

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to view bookings." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  try {
    const bookings = await prisma.booking.findMany({ where: { studentId: session.user.id }, orderBy: { createdAt: "desc" }, select: { id: true, status: true, createdAt: true, service: { select: { name: true, durationMinutes: true } }, availability: { select: { startsAt: true, endsAt: true } }, payment: { select: { status: true, currency: true, amountInr: true } } } });
    return NextResponse.json({ bookings });
  } catch { return NextResponse.json({ error: "Bookings are temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to request a session." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  const parsed = bookingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid service and available time." }, { status: 400 });
  try {
    const booking = await prisma.$transaction(async transaction => {
      const service = await transaction.counsellingService.findFirst({ where: { id: parsed.data.serviceId, active: true } });
      const slot = await transaction.counsellorAvailability.findUnique({ where: { id: parsed.data.availabilityId }, include: { counsellor: { select: { role: true } } } });
      if (!service) throw new Error("SERVICE_UNAVAILABLE");
      if (!service.priceInr) throw new Error("SERVICE_PRICE_MISSING");
      if (!slot || !slot.isAvailable || slot.startsAt <= new Date() || slot.counsellor.role !== "COUNSELLOR") throw new Error("SLOT_UNAVAILABLE");
      const reserved = await transaction.counsellorAvailability.updateMany({ where: { id: slot.id, isAvailable: true }, data: { isAvailable: false } });
      if (!reserved.count) throw new Error("SLOT_UNAVAILABLE");
      return transaction.booking.create({
        data: {
          studentId: session.user.id,
          serviceId: service.id,
          availabilityId: slot.id,
          studentNotes: parsed.data.studentNotes || null,
          status: "AWAITING_PAYMENT",
          payment: { create: { amountInr: service.priceInr!, currency: "INR", status: "CREATED" } },
        },
        select: { id: true, status: true, createdAt: true, service: { select: { name: true } }, availability: { select: { startsAt: true, endsAt: true } } },
      });
    });
    return NextResponse.json({ booking, paymentSetup: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SERVICE_UNAVAILABLE") return NextResponse.json({ error: "This counselling service is not currently bookable." }, { status: 404 });
    if (message === "SERVICE_PRICE_MISSING") return NextResponse.json({ error: "This service has no published price and cannot be booked yet." }, { status: 409 });
    if (message === "SLOT_UNAVAILABLE" || (error instanceof Error && "code" in error && error.code === "P2002")) return NextResponse.json({ error: "That time is no longer available. Choose another slot." }, { status: 409 });
    return NextResponse.json({ error: "Booking could not be created." }, { status: 503 });
  }
}
