import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { AdminServices } from "@/components/admin-services";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Counselling services", robots: { index: false, follow: false } };
export default async function AdminServicesPage() { await requireAdmin(); return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">COUNSELLING OPERATIONS</span><h1>Services & availability</h1><p>Publish only after service terms, price, and counsellor times are ready.</p></div></div><AdminServices /></section>; }