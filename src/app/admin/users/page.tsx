import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { AdminUsers } from "@/components/admin-users";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account access", robots: { index: false, follow: false } };
export default async function AdminUsersPage() { await requireAdmin(); return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">ADMINISTRATION</span><h1>Account access</h1><p>Grant staff roles only to people you trust.</p></div></div><AdminUsers /></section>; }