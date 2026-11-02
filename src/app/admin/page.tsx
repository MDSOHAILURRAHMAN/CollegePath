import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export default async function AdminDashboardPage() {
  const session = await requireStaff();
  if (session.user.role !== "ADMIN") redirect("/admin/leads");
  let stats: { colleges: number; programs: number; leads: number; newLeads: number; bookings: number; payments: number } | null = null;
  try {
    const [colleges, programs, leads, newLeads, bookings, payments] = await Promise.all([
      prisma.college.count(), prisma.program.count(), prisma.lead.count(), prisma.lead.count({ where: { status: "NEW" } }), prisma.booking.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "CONFIRMED"] } } }), prisma.payment.count({ where: { status: { in: ["CREATED", "PENDING", "REFUND_PENDING"] } } }),
    ]);
    stats = { colleges, programs, leads, newLeads, bookings, payments };
  } catch {}
  return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">ADMINISTRATION</span><h1>Operations overview</h1><p>Internal information is visible only to authorised administrators.</p></div></div>{stats ? <><div className="admin-stat-grid">{[["College records", stats.colleges], ["Programs", stats.programs], ["New enquiries", stats.newLeads], ["All enquiries", stats.leads], ["Open bookings", stats.bookings], ["Unsettled payments", stats.payments]].map(([label, value]) => <article className="surface admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><div className="admin-links"><Link className="surface" href="/admin/leads"><strong>Manage enquiries</strong><small>Update lead status, add notes, set follow-ups.</small></Link><Link className="surface" href="/admin/users"><strong>Manage access</strong><small>Assign counsellor and admin roles.</small></Link><Link className="surface" href="/admin/colleges"><strong>College records</strong><small>Review verification status and sources.</small></Link><Link className="surface" href="/admin/bookings"><strong>Bookings</strong><small>Review requests and service availability.</small></Link></div></> : <div className="error-state"><h2>Admin data is unavailable</h2><p>Connect PostgreSQL and apply migrations.</p></div>}</section>;
}