import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const requested = Array.isArray(raw.returnTo) ? raw.returnTo[0] : raw.returnTo;
  const returnTo = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
  return <section className="auth-page"><div className="auth-layout"><aside className="auth-aside"><span className="eyebrow">A CLEARER WAY FORWARD</span><h2>Your next step<br /><em>starts here.</em></h2><p>Explore colleges at your pace. Save options and keep your search in one private place.</p><span className="auth-aside-foot">COLLEGEPATH · FIND YOUR COLLEGE. PLAN YOUR FUTURE.</span></aside><AuthPanel mode="login" returnTo={returnTo} emailEnabled={Boolean(process.env.RESEND_API_KEY)} /></div></section>;
}