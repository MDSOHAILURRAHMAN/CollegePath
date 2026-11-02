"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, LoaderCircle } from "lucide-react";

const formSchema = z.object({ name: z.string().trim().min(2, "Enter your name.").max(80), email: z.email("Enter a valid email.").max(254), phone: z.string().trim().min(7, "Enter a valid phone number.").max(30), admissionYear: z.string().max(20), message: z.string().trim().min(10, "Tell us a little more.").max(2000), marketingConsent: z.boolean() });
type FormFields = z.infer<typeof formSchema>;

export function ContactForm({ college = "" }: { college?: string }) {
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);
  const form = useForm<FormFields>({ resolver: zodResolver(formSchema), defaultValues: { name: "", email: "", phone: "", admissionYear: "", message: college ? `I would like guidance about ${college}.` : "", marketingConsent: false } });

  async function submit(values: FormFields) {
    setNotice(""); setSuccess(false);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setNotice(result.error ?? "Your request could not be submitted."); return; }
      setSuccess(true); setNotice("Your enquiry has been saved. The team will follow up using the contact details you provided."); form.reset();
    } catch {
      setNotice("We couldn’t reach the server. Check your connection and try again.");
    }
  }

  return <form className="contact-form" onSubmit={form.handleSubmit(submit)} noValidate>
    {notice && <p className={success ? "auth-success" : "auth-error"} role={success ? "status" : "alert"}>{notice}</p>}
    <div className="form-grid">
      <div><label className="field-label" htmlFor="lead-name">Your name</label><input className="field-control" id="lead-name" autoComplete="name" {...form.register("name")} />{form.formState.errors.name && <small className="form-error">{form.formState.errors.name.message}</small>}</div>
      <div><label className="field-label" htmlFor="lead-email">Email address</label><input className="field-control" id="lead-email" type="email" autoComplete="email" {...form.register("email")} />{form.formState.errors.email && <small className="form-error">{form.formState.errors.email.message}</small>}</div>
      <div><label className="field-label" htmlFor="lead-phone">Phone number</label><input className="field-control" id="lead-phone" type="tel" autoComplete="tel" {...form.register("phone")} />{form.formState.errors.phone && <small className="form-error">{form.formState.errors.phone.message}</small>}</div>
      <div><label className="field-label" htmlFor="lead-year">Expected admission year</label><select className="field-control" id="lead-year" {...form.register("admissionYear")}><option value="">Choose if known</option><option>2026</option><option>2027</option><option>2028</option><option>Exploring options</option></select></div>
      <div className="form-wide"><label className="field-label" htmlFor="lead-message">What would you like help with?</label><textarea className="field-control" id="lead-message" rows={4} {...form.register("message")} placeholder="College search, course choice, applications…" />{form.formState.errors.message && <small className="form-error">{form.formState.errors.message.message}</small>}</div>
      <label className="consent-row form-wide"><input type="checkbox" {...form.register("marketingConsent")} /><span>I agree to optional CollegePath updates. This is not required to submit an enquiry.</span></label>
      <div className="form-wide"><button className="btn-primary" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <LoaderCircle className="spin" size={15} />}Send enquiry <ArrowRight size={15} /></button></div>
    </div>
  </form>;
}
