import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!["COUNSELLOR", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, status: true, createdAt: true, service: { select: { name: true } }, student: { select: { name: true, email: true } }, availability: { select: { startsAt: true, endsAt: true } }, payment: { select: { status: true, currency: true, amountInr: true } } } });
    return NextResponse.json({ bookings });
  } catch { return NextResponse.json({ error: "Booking data is temporarily unavailable." }, { status: 503 }); }
}