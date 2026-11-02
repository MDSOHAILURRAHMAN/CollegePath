import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { AdminColleges } from "@/components/admin-colleges";
import { CollegeCsvImporter } from "@/components/college-csv-importer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "College data management", robots: { index: false, follow: false } };
export default async function AdminCollegesPage() { await requireAdmin(); return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">DATA STEWARDSHIP</span><h1>College records</h1><p>New records remain drafts until an administrator completes source review.</p></div></div><div className="admin-college-stack"><AdminColleges /><CollegeCsvImporter /></div></section>; }