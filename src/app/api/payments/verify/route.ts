import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  bookingId: z.string().min(1).max(80),
  orderId: z.string().regex(/^order_[A-Za-z0-9]+$/),
  paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  signature: z.string().regex(/^[a-f\d]{64}$/i),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to verify this payment." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Payment confirmation details are invalid." }, { status: 400 });
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });

  const expected = createHmac("sha256", keySecret).update(`${parsed.data.orderId}|${parsed.data.paymentId}`).digest();
  const received = Buffer.from(parsed.data.signature, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 401 });

  try {
    const payment = await prisma.payment.findFirst({
      where: { bookingId: parsed.data.bookingId, providerOrderId: parsed.data.orderId, booking: { studentId: session.user.id } },
      select: { id: true, status: true, providerPaymentId: true, amountInr: true, currency: true, bookingId: true },
    });
    if (!payment) return NextResponse.json({ error: "Payment order was not found for this account." }, { status: 404 });
    if (payment.status === "PAID" && payment.providerPaymentId === parsed.data.paymentId) return NextResponse.json({ verified: true, status: "PAID" });

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const providerPayment = await razorpay.payments.fetch(parsed.data.paymentId);
    if (providerPayment.order_id !== parsed.data.orderId || providerPayment.currency !== payment.currency || providerPayment.amount !== payment.amountInr.mul(100).toNumber()) {
      return NextResponse.json({ error: "Payment details do not match this booking." }, { status: 409 });
    }
    if (providerPayment.status !== "captured") return NextResponse.json({ verified: false, status: providerPayment.status }, { status: 409 });

    await prisma.$transaction(async transaction => {
      const current = await transaction.payment.findUnique({ where: { id: payment.id }, select: { status: true, providerPaymentId: true } });
      if (!current) throw new Error("PAYMENT_NOT_FOUND");
      if (current.status === "PAID" && current.providerPaymentId === parsed.data.paymentId) return;
      if (current.status === "PAID" || (current.providerPaymentId && current.providerPaymentId !== parsed.data.paymentId)) throw new Error("PAYMENT_STATE_CONFLICT");
      await transaction.payment.update({ where: { id: payment.id }, data: { status: "PAID", providerPaymentId: parsed.data.paymentId } });
      await transaction.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } });
    });
    return NextResponse.json({ verified: true, status: "PAID" });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_STATE_CONFLICT") return NextResponse.json({ error: "This booking has a different verified payment state. Contact support before retrying." }, { status: 409 });
    return NextResponse.json({ error: "Payment confirmation is pending. Your booking status will update after provider verification." }, { status: 503 });
  }
}
