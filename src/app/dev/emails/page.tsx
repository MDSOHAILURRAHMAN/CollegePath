import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevEmailMailbox } from "@/components/dev-email-mailbox";

export const metadata: Metadata = { title: "Local development mailbox", robots: { index: false, follow: false } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DevelopmentMailboxPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const raw = await searchParams;
  const email = Array.isArray(raw.email) ? raw.email[0] : raw.email;
  return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">LOCAL DEVELOPMENT ONLY</span><h1>Email preview</h1><p>Messages are stored on this development machine so password recovery can be tried without a mail provider.</p></div></div><DevEmailMailbox initialEmail={email ?? ""} /></section>;
}
