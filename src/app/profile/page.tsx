import Link from "next/link";
import type { Metadata } from "next";
import { requireStudent } from "@/lib/permissions";
import { ProfileEditor } from "@/components/profile-editor";
import { AccountPrivacyActions } from "@/components/account-privacy-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Student profile", robots: { index: false, follow: false } };
export default async function StudentProfilePage() {
  const session = await requireStudent();
  return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">YOUR INFORMATION</span><h1>Student profile</h1><p>Share only the details that improve your college search.</p></div><Link className="btn-secondary" href="/dashboard">Back to dashboard</Link></div><div className="surface dashboard-content"><ProfileEditor name={session.user.name} /><hr className="section-divider" /><h2>Account data and privacy</h2><AccountPrivacyActions /></div></section>;
}
