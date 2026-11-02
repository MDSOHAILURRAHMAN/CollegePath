"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const requestSchema = z.object({ email: z.email("Enter a valid email.") });
const resetSchema = z.object({ password: z.string().min(10, "Use at least 10 characters.").max(128) });

export function PasswordRecoveryForm({ mode, token = "", emailEnabled }: { mode: "request" | "reset"; token?: string; emailEnabled: boolean }) {
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);
  const request = useForm<z.infer<typeof requestSchema>>({ resolver: zodResolver(requestSchema) });
  const reset = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  async function requestReset(values: z.infer<typeof requestSchema>) {
    setNotice("");
    if (!emailEnabled) { setNotice("Password recovery email is not configured on this installation."); return; }
    const result = await authClient.requestPasswordReset({ email: values.email, redirectTo: "/reset-password" });
    if (result.error) { setNotice(result.error.message ?? "The reset request could not be completed."); return; }
    setSuccess(true); setNotice("If this address belongs to an account, a reset link will be sent.");
  }

  async function setPassword(values: z.infer<typeof resetSchema>) {
    if (!token) { setNotice("This reset link is missing or invalid. Request a new link."); return; }
    const result = await authClient.resetPassword({ newPassword: values.password, token });
    if (result.error) { setNotice(result.error.message ?? "The password could not be changed."); return; }
    setSuccess(true); setNotice("Password updated. You can now sign in.");
  }

  return <section className="auth-card"><span className="eyebrow">ACCOUNT SECURITY</span><h1>{mode === "request" ? "Reset your password." : "Choose a new password."}</h1><p>{mode === "request" ? "We’ll only send a reset email when delivery is configured." : "Use at least ten characters."}</p>
    {notice && <p className={success ? "auth-success" : "auth-error"} role={success ? "status" : "alert"}>{notice}</p>}
    {mode === "request" ? <form className="auth-form" onSubmit={request.handleSubmit(requestReset)}><div><label className="field-label" htmlFor="reset-email">Account email</label><input className="field-control" id="reset-email" type="email" autoComplete="email" {...request.register("email")} />{request.formState.errors.email && <small className="form-error">{request.formState.errors.email.message}</small>}</div><button className="btn-primary" type="submit" disabled={!emailEnabled || request.formState.isSubmitting}>Request reset link</button></form> : <form className="auth-form" onSubmit={reset.handleSubmit(setPassword)}><div><label className="field-label" htmlFor="new-password">New password</label><input className="field-control" id="new-password" type="password" autoComplete="new-password" {...reset.register("password")} />{reset.formState.errors.password && <small className="form-error">{reset.formState.errors.password.message}</small>}</div><button className="btn-primary" type="submit" disabled={reset.formState.isSubmitting || !token}>Update password</button></form>}
    <div className="auth-switch"><Link href="/login">Back to sign in</Link></div>
  </section>;
}