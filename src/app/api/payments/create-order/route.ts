import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const bodySchema = z.object({ bookingId: z.string().min(1).max(80) });

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid booking is required." }, { status: 400 });
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay is not configured. Your booking request remains saved; no payment was taken." }, { status: 503 });

  try {
    const payment = await prisma.payment.findFirst({ where: { bookingId: parsed.data.bookingId, booking: { studentId: session.user.id, status: "AWAITING_PAYMENT" } } });
    if (!payment) return NextResponse.json({ error: "No payable booking was found for this account." }, { status: 404 });
    if (["PAID", "REFUNDED", "REFUND_PENDING"].includes(payment.status)) return NextResponse.json({ error: "This payment cannot be charged again." }, { status: 409 });
    if (payment.providerOrderId) return NextResponse.json({ orderId: payment.providerOrderId, keyId, amount: payment.amountInr.mul(100).toNumber(), currency: payment.currency });
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({ amount: payment.amountInr.mul(100).toNumber(), currency: "INR", receipt: payment.bookingId.slice(0, 40), notes: { bookingId: payment.bookingId } });
    const updated = await prisma.payment.updateMany({ where: { id: payment.id, providerOrderId: null }, data: { providerOrderId: order.id, status: "PENDING" } });
    if (!updated.count) return NextResponse.json({ error: "A payment order was already created. Refresh your booking." }, { status: 409 });
    return NextResponse.json({ orderId: order.id, keyId, amount: order.amount, currency: order.currency });
  } catch {
    return NextResponse.json({ error: "Razorpay could not create an order. The booking remains unpaid." }, { status: 502 });
  }
}
