import type { Metadata } from "next";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const token = Array.isArray(raw.token) ? raw.token[0] : raw.token;
  return <section className="auth-page"><PasswordRecoveryForm mode="reset" token={token ?? ""} emailEnabled={Boolean(process.env.RESEND_API_KEY)} developmentMailbox={false} /></section>;
}
