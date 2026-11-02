import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookSession } from "@/components/book-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Personalised counselling" };

export default async function GuidancePage() {
  let services: Awaited<ReturnType<typeof prisma.counsellingService.findMany>> = [];
  let slots: { id: string; serviceTime: string; endsAt: string; counsellorName: string }[] = [];
  try {
    const results = await Promise.all([
      prisma.counsellingService.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.counsellorAvailability.findMany({ where: { isAvailable: true, startsAt: { gt: new Date() }, counsellor: { role: "COUNSELLOR" } }, orderBy: { startsAt: "asc" }, take: 30, select: { id: true, startsAt: true, endsAt: true, counsellor: { select: { name: true } } } }),
    ]);
    services = results[0];
    slots = results[1].map(slot => ({ id: slot.id, serviceTime: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString(), counsellorName: slot.counsellor.name }));
  } catch {}
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const paymentEnabled = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">PERSONALISED GUIDANCE</span><h1>A conversation, not a promise.</h1><p>Talk through course, college, and application questions with a counsellor. Only published services with real pricing and available times can be booked.</p></div></section><section className="page-container section-pad">{services.length ? <div className="guidance-grid">{services.map(service => <article className="resource-card guidance-card" key={service.id}><CalendarClock size={20} color="#0d9488" /><h2 style={{ margin: "13px 0 6px", fontSize: 15 }}>{service.name}</h2><p>{service.description}</p><div className="detail-list"><div><span>Session duration</span><strong>{service.durationMinutes} minutes</strong></div><div><span>Price</span><strong>{service.priceInr ? inr.format(Number(service.priceInr)) : "Not configured"}</strong></div></div><h3>Deliverables</h3>{service.deliverables.length ? <ul>{service.deliverables.map(item => <li key={item}>{item}</li>)}</ul> : <p className="data-note">Deliverables are not configured.</p>}<p className="data-note">{service.cancellationPolicy ?? "Cancellation policy not configured."}</p><BookSession serviceId={service.id} slots={slots.map(slot => ({ id: slot.id, startsAt: slot.serviceTime, endsAt: slot.endsAt, counsellorName: slot.counsellorName }))} paymentEnabled={paymentEnabled} /></article>)}</div> : <div className="empty-state"><CalendarClock size={25} color="#0d9488" /><h2>Sessions aren’t open yet</h2><p>Booking availability and pricing have not been configured. We won’t take payment or imply a session is booked.</p><Link className="btn-secondary" href="/contact">Send a no-obligation enquiry</Link></div>}<p className="notice" style={{ marginTop: 18 }}>Email and SMS reminders are not sent unless a delivery provider is configured. Bookings and status changes remain in the database.</p></section></>;
}