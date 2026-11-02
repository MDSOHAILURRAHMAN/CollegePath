import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";
import { requireStudent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bookings", robots: { index: false, follow: false } };
const bookingSummaryInclude = { service: { select: { name: true } }, payment: { select: { amountInr: true, currency: true, status: true } }, availability: { select: { startsAt: true, endsAt: true } } } satisfies Prisma.BookingInclude;
type BookingSummary = Prisma.BookingGetPayload<{ include: typeof bookingSummaryInclude }>;

export default async function StudentBookingsPage() {
  const session = await requireStudent();
  let bookings: BookingSummary[] = [];
  let unavailable = false;
  try { bookings = await prisma.booking.findMany({ where: { studentId: session.user.id }, orderBy: { createdAt: "desc" }, include: bookingSummaryInclude }); } catch { unavailable = true; }
  return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">YOUR COUNSELLING</span><h1>Bookings & sessions</h1><p>Private to your account.</p></div><Link className="btn-secondary" href="/guidance">View available services</Link></div>{unavailable ? <div className="error-state"><h2>Bookings are unavailable</h2><p>Connect PostgreSQL and try again.</p></div> : bookings.length ? <div className="dashboard-card-list">{bookings.map(booking => <article className="surface dashboard-record" key={booking.id}><div><strong>{booking.service.name}</strong><small>{booking.status.replaceAll("_", " ")} · {booking.createdAt.toLocaleDateString("en-IN")}{booking.availability ? ` · ${booking.availability.startsAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : " · Time not scheduled"}</small></div><span className="college-tag">{booking.payment ? `${booking.payment.status.replaceAll("_", " ")} · ${booking.payment.currency} ${booking.payment.amountInr.toString()}` : "Payment not requested"}</span></article>)}</div> : <div className="empty-state"><h2>No bookings yet</h2><p>Sessions only appear here once the team enables services and availability.</p><Link className="btn-secondary" href="/guidance">View counselling services</Link></div>}</section>;
}