"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type ProfileFields = {
  name: string;
  phone: string;
  currentEducation: string;
  intendedCourse: string;
  preferredStates: string[];
  annualBudgetInr: number | null;
  accommodationNeeded: boolean | null;
  careerInterests: string[];
  marketingConsent: boolean;
};
const profileFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().max(30),
  currentEducation: z.string().max(80),
  intendedCourse: z.string().max(100),
  preferredStates: z.array(z.string().min(2).max(60)).max(8),
  annualBudgetInr: z.number().finite().min(0).max(100_000_000).nullable(),
  accommodationNeeded: z.boolean().nullable(),
  careerInterests: z.array(z.string().min(2).max(80)).max(10),
  marketingConsent: z.boolean(),
});

const initial: ProfileFields = { name: "", phone: "", currentEducation: "", intendedCourse: "", preferredStates: [], annualBudgetInr: null, accommodationNeeded: null, careerInterests: [], marketingConsent: false };

export function ProfileEditor({ name }: { name: string }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const form = useForm<ProfileFields>({ resolver: zodResolver(profileFormSchema), defaultValues: { ...initial, name } });

  useEffect(() => {
    fetch("/api/student/profile").then(response => response.ok ? response.json() : null).then(result => {
      if (!result?.profile) return;
      form.reset({ ...initial, ...result.profile, name: result.profile.name || name, annualBudgetInr: result.profile.annualBudgetInr ?? null });
    }).catch(() => setMessage("Your saved profile could not be loaded."));
  }, [form, name]);

  async function submit(values: ProfileFields) {
    setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/student/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, annualBudgetInr: values.annualBudgetInr === null || values.annualBudgetInr === undefined ? null : Number(values.annualBudgetInr) }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(result.error ?? "Profile could not be saved."); return; }
      setSuccess(true); setMessage("Profile saved.");
    } catch {
      setMessage("We couldn’t reach the server. Your profile was not saved; please try again.");
    }
  }

  return <form className="profile-form" onSubmit={form.handleSubmit(submit)} noValidate>
    {message && <p className={success ? "auth-success" : "auth-error"} role={success ? "status" : "alert"}>{message}</p>}
    <div className="form-grid">
      <div><label className="field-label" htmlFor="profile-name">Full name</label><input id="profile-name" className="field-control" autoComplete="name" {...form.register("name")} /></div>
      <div><label className="field-label" htmlFor="profile-phone">Phone (optional)</label><input id="profile-phone" className="field-control" autoComplete="tel" {...form.register("phone")} /></div>
      <div><label className="field-label" htmlFor="profile-education">Current education (optional)</label><input id="profile-education" className="field-control" placeholder="e.g. Class 12" {...form.register("currentEducation")} /></div>
      <div><label className="field-label" htmlFor="profile-course">Intended course (optional)</label><input id="profile-course" className="field-control" placeholder="e.g. B.Tech" {...form.register("intendedCourse")} /></div>
      <div><label className="field-label" htmlFor="profile-budget">Annual budget in INR (optional)</label><input id="profile-budget" className="field-control" type="number" min="0" step="10000" {...form.register("annualBudgetInr", { setValueAs: value => value === "" ? null : Number(value) })} /></div>
      <div><label className="field-label" htmlFor="profile-states">Preferred states (optional)</label><input id="profile-states" className="field-control" placeholder="Comma-separated" value={form.watch("preferredStates").join(", ")} onChange={event => form.setValue("preferredStates", event.target.value.split(",").map(item => item.trim()).filter(Boolean))} /></div>
      <div><label className="field-label" htmlFor="profile-accommodation">Accommodation preference</label><select id="profile-accommodation" className="field-control" value={form.watch("accommodationNeeded") === null ? "" : String(form.watch("accommodationNeeded"))} onChange={event => form.setValue("accommodationNeeded", event.target.value === "" ? null : event.target.value === "true")}><option value="">Not specified</option><option value="true">Hostel needed</option><option value="false">No preference</option></select></div>
      <div><label className="field-label" htmlFor="profile-interests">Career interests (optional)</label><input id="profile-interests" className="field-control" placeholder="Comma-separated" value={form.watch("careerInterests").join(", ")} onChange={event => form.setValue("careerInterests", event.target.value.split(",").map(item => item.trim()).filter(Boolean))} /></div>
      <label className="consent-row form-wide"><input type="checkbox" {...form.register("marketingConsent")} /><span>Receive optional CollegePath updates. You can change this later.</span></label>
      <div className="form-wide"><button className="btn-primary" type="submit" disabled={form.formState.isSubmitting}>Save profile</button></div>
    </div>
  </form>;
}
