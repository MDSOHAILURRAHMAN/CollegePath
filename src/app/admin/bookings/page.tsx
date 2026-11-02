import type { Metadata } from "next";
import { requireStaff } from "@/lib/permissions";
import { AdminBookings } from "@/components/admin-bookings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking management", robots: { index: false, follow: false } };
export default async function AdminBookingsPage() { await requireStaff(); return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">COUNSELLOR WORKSPACE</span><h1>Bookings</h1><p>Payment status is displayed from server-verified records.</p></div></div><AdminBookings /></section>; }