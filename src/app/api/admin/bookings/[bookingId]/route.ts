import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransitionBooking, type BookingState } from "@/lib/booking-state";

export const dynamic = "force-dynamic";
const statusSchema = z.object({ status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "REFUND_PENDING", "REFUNDED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!["COUNSELLOR", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid booking status." }, { status: 400 });
  const { bookingId } = await params;
  try {
    const updated = await prisma.$transaction(async transaction => {
      const booking = await transaction.booking.findUnique({ where: { id: bookingId }, include: { payment: true, availability: true } });
      if (!booking) return null;
      if (!canTransitionBooking(booking.status as BookingState, parsed.data.status as BookingState)) throw new Error("INVALID_TRANSITION");
      if (parsed.data.status === "CONFIRMED" && booking.payment && booking.payment.status !== "PAID") throw new Error("UNPAID");
      const result = await transaction.booking.update({ where: { id: booking.id }, data: { status: parsed.data.status }, select: { id: true, status: true } });
      if (parsed.data.status === "CANCELLED" && booking.availability) await transaction.counsellorAvailability.update({ where: { id: booking.availability.id }, data: { isAvailable: true } });
      await transaction.auditLog.create({ data: { actorId: session.user.id, action: "BOOKING_STATUS_CHANGED", entityType: "Booking", entityId: bookingId, metadata: { oldStatus: booking.status, newStatus: parsed.data.status } } });
      return result;
    });
    if (!updated) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    return NextResponse.json({ booking: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TRANSITION") return NextResponse.json({ error: "That booking status transition is not allowed." }, { status: 409 });
    if (error instanceof Error && error.message === "UNPAID") return NextResponse.json({ error: "A booking cannot be confirmed before server-verified payment." }, { status: 409 });
    return NextResponse.json({ error: "Booking update failed." }, { status: 503 });
  }
}