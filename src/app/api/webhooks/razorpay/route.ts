import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RazorpayEvent = {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string } } };
};

export async function POST(request: Request) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Payment webhooks are not configured." }, { status: 503 });
  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();
  if (!signature) return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  let event: RazorpayEvent;
  try { event = JSON.parse(rawBody) as RazorpayEvent; } catch { return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 }); }
  if (!["payment.captured", "payment.failed"].includes(event.event ?? "")) return NextResponse.json({ received: true, ignored: true });
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id || !entity.id || !Number.isFinite(entity.amount)) return NextResponse.json({ error: "Payment details are incomplete." }, { status: 400 });
  const eventId = request.headers.get("x-razorpay-event-id") ?? createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    await prisma.$transaction(async transaction => {
      const payment = await transaction.payment.findUnique({ where: { providerOrderId: entity.order_id } });
      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      if (payment.webhookEventIds.includes(eventId)) return;
      const expectedPaise = payment.amountInr.mul(100).toNumber();
      if (entity.amount !== expectedPaise || entity.currency !== payment.currency) throw new Error("AMOUNT_MISMATCH");
      const captured = event.event === "payment.captured";
      const status = captured ? "PAID" : "FAILED";
      if (payment.status === "PAID" && !captured) return;
      await transaction.payment.update({ where: { id: payment.id }, data: { status, providerPaymentId: entity.id, webhookEventIds: { push: eventId } } });
      if (captured) await transaction.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
    if (error instanceof Error && error.message === "AMOUNT_MISMATCH") return NextResponse.json({ error: "Payment amount or currency does not match the stored order." }, { status: 400 });
    return NextResponse.json({ error: "Payment event could not be processed." }, { status: 503 });
  }
}
