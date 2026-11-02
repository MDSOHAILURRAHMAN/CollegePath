import type { Metadata } from "next";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <section className="auth-page"><PasswordRecoveryForm mode="request" emailEnabled={Boolean(process.env.RESEND_API_KEY)} /></section>; }