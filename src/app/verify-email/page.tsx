import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false, follow: false } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const email = Array.isArray(raw.email) ? raw.email[0] : raw.email;
  return <section className="auth-page"><div className="auth-card"><span className="eyebrow">CHECK YOUR INBOX</span><h1>Verify your email.</h1><p>{email ? `A verification link was requested for ${email}.` : "Open the verification link sent to your email address."}</p><p className="notice">Email delivery only works when a provider is configured. If you are setting up a local install without email credentials, sign in with the account you just created.</p><Link className="btn-primary" href="/login">Continue to sign in</Link></div></section>;
}