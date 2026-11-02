"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({ email: z.email("Enter a valid email address."), password: z.string().min(1, "Enter your password.") });
const registerSchema = z.object({ name: z.string().trim().min(2, "Enter your name.").max(80), email: z.email("Enter a valid email address."), password: z.string().min(10, "Use at least 10 characters.").max(128), communicationsConsent: z.boolean() });
type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

export function AuthPanel({ mode = "login", returnTo = "/dashboard", emailEnabled = false }: { mode?: "login" | "register"; returnTo?: string; emailEnabled?: boolean }) {
  const [view, setView] = useState(mode);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const login = useForm<LoginFields>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const register = useForm<RegisterFields>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "", communicationsConsent: false } });

  async function submitLogin(values: LoginFields) {
    setPending(true); setMessage(""); setSuccess(false);
    try {
      const result = await authClient.signIn.email({ ...values, callbackURL: returnTo });
      if (result.error) { setMessage(result.error.message ?? "Sign in failed. Check your details."); return; }
      router.push(returnTo); router.refresh();
    } catch {
      setMessage("We couldn’t reach the sign-in service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function submitRegister(values: RegisterFields) {
    setPending(true); setMessage(""); setSuccess(false);
    try {
      const result = await authClient.signUp.email({ name: values.name, email: values.email, password: values.password, callbackURL: returnTo });
      if (result.error) { setMessage(result.error.message ?? "Account creation failed."); return; }
      if (emailEnabled) { router.push(`/verify-email?email=${encodeURIComponent(values.email)}`); return; }
      if (values.communicationsConsent) {
        await fetch("/api/student/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketing: true }) }).catch(() => undefined);
      }
      router.push(returnTo); router.refresh();
    } catch {
      setMessage("We couldn’t reach the account service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return <section className="auth-card" aria-labelledby="auth-heading">
    <div className="auth-tabs" role="tablist" aria-label="Account access">
      <button type="button" role="tab" aria-selected={view === "login"} className={`auth-tab${view === "login" ? " active" : ""}`} onClick={() => { setView("login"); setMessage(""); }}>Sign in</button>
      <button type="button" role="tab" aria-selected={view === "register"} className={`auth-tab${view === "register" ? " active" : ""}`} onClick={() => { setView("register"); setMessage(""); }}>Create account</button>
    </div>
    {message && <p className={success ? "auth-success" : "auth-error"} role="alert">{message}</p>}
    {view === "login" ? <form className="auth-form" onSubmit={login.handleSubmit(submitLogin)} noValidate>
      <span className="eyebrow">WELCOME BACK</span><h1 id="auth-heading">Sign in to continue.</h1><p>Your saved colleges and comparisons are private to your account.</p>
      <div><label className="field-label" htmlFor="login-email">Email address</label><input className="field-control" id="login-email" type="email" autoComplete="email" {...login.register("email")} aria-invalid={Boolean(login.formState.errors.email)} />{login.formState.errors.email && <small className="form-error">{login.formState.errors.email.message}</small>}</div>
      <div><label className="field-label" htmlFor="login-password">Password</label><input className="field-control" id="login-password" type="password" autoComplete="current-password" {...login.register("password")} aria-invalid={Boolean(login.formState.errors.password)} />{login.formState.errors.password && <small className="form-error">{login.formState.errors.password.message}</small>}</div>
      <button className="btn-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={15} /> : null}Sign in <ArrowRight size={15} /></button>
      <div className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></div>
    </form> : <form className="auth-form" onSubmit={register.handleSubmit(submitRegister)} noValidate>
      <span className="eyebrow">YOUR COLLEGEPATH ACCOUNT</span><h1 id="auth-heading">Create your account.</h1><p>Save colleges and keep your search organised. Registration creates a student account.</p>
      <div><label className="field-label" htmlFor="register-name">Full name</label><input className="field-control" id="register-name" autoComplete="name" {...register.register("name")} aria-invalid={Boolean(register.formState.errors.name)} />{register.formState.errors.name && <small className="form-error">{register.formState.errors.name.message}</small>}</div>
      <div><label className="field-label" htmlFor="register-email">Email address</label><input className="field-control" id="register-email" type="email" autoComplete="email" {...register.register("email")} aria-invalid={Boolean(register.formState.errors.email)} />{register.formState.errors.email && <small className="form-error">{register.formState.errors.email.message}</small>}</div>
      <div><label className="field-label" htmlFor="register-password">Password</label><input className="field-control" id="register-password" type="password" autoComplete="new-password" {...register.register("password")} aria-invalid={Boolean(register.formState.errors.password)} />{register.formState.errors.password && <small className="form-error">{register.formState.errors.password.message}</small>}</div>
      <label className="consent-row"><input type="checkbox" {...register.register("communicationsConsent")} /> <span>I agree to receive optional CollegePath updates. This is not required to create an account.</span></label>
      <button className="btn-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={15} /> : null}Create account <ArrowRight size={15} /></button>
      {!emailEnabled && <p className="data-note">Email verification is disabled until an email provider is configured.</p>}
      <div className="auth-switch">Already registered? <button type="button" onClick={() => { setView("login"); setMessage(""); }}>Sign in</button></div>
    </form>}
  </section>;
}
