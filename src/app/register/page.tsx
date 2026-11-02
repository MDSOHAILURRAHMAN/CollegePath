import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";

export const metadata: Metadata = { title: "Create your account", robots: { index: false, follow: false } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const requested = Array.isArray(raw.returnTo) ? raw.returnTo[0] : raw.returnTo;
  const returnTo = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
  return <section className="auth-page"><div className="auth-layout"><aside className="auth-aside"><span className="eyebrow">MAKE YOUR SEARCH YOURS</span><h2>A good plan<br /><em>starts with you.</em></h2><p>Create a private student account to save colleges, comparisons, and the priorities that matter.</p><span className="auth-aside-foot">Student accounts · No payment required</span></aside><AuthPanel mode="register" returnTo={returnTo} emailEnabled={Boolean(process.env.RESEND_API_KEY)} /></div></section>;
}