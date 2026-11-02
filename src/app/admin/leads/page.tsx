import type { Metadata } from "next";
import { requireStaff } from "@/lib/permissions";
import { AdminLeads } from "@/components/admin-leads";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Enquiry management", robots: { index: false, follow: false } };
export default async function AdminLeadsPage() { await requireStaff(); return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">COUNSELLOR WORKSPACE</span><h1>Student enquiries</h1><p>Lead details are available only to authorised counsellors and admins.</p></div></div><AdminLeads /></section>; }