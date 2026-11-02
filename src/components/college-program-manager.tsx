"use client";

import { useState } from "react";

type Props = { collegeId: string; disabled: boolean };
type Source = { name: string; url: string | null; reviewerNotes: string | null } | null;
type Fee = { id: string; academicYear: string; tuitionInr: string | null; compulsoryFeesInr: string | null; hostelInr: string | null; verificationStatus: string; source: Source };
type Program = { id: string; name: string; degreeLevel: string; durationYears: number | null; description: string | null; verificationStatus: string; source: Source; categories: { category: { slug: string; name: string } }[]; feeRecords: Fee[] };
type Category = { slug: string; name: string };

const statuses = ["DRAFT", "PENDING_REVIEW", "VERIFIED", "NEEDS_UPDATE", "ARCHIVED"];
function human(value: string) { return value.toLowerCase().replaceAll("_", " "); }
function money(value: string | null) { return value === null ? "Not published" : `₹${Number(value).toLocaleString("en-IN")}`; }

export function CollegeProgramManager({ collegeId, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function load() {
    const response = await fetch(`/api/admin/colleges/${collegeId}/programs`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Program records could not be loaded.");
    setPrograms(result.programs); setCategories(result.categories); setLoaded(true);
  }
  async function show() {
    setOpen(value => !value);
    if (!loaded) { try { await load(); } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Program records could not be loaded."); } }
  }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError(false);
    const form = new FormData(event.currentTarget);
    const feeIncluded = form.get("feeIncluded") === "on";
    const body = { name: form.get("name"), degreeLevel: form.get("degreeLevel"), durationYears: form.get("durationYears") ? Number(form.get("durationYears")) : null, description: form.get("description"), categorySlugs: form.getAll("categorySlugs"), verificationStatus: form.get("verificationStatus"), sourceName: form.get("sourceName"), sourceUrl: form.get("sourceUrl"), fee: feeIncluded ? { academicYear: form.get("academicYear"), tuitionInr: form.get("tuitionInr") ? Number(form.get("tuitionInr")) : null, compulsoryFeesInr: form.get("compulsoryFeesInr") ? Number(form.get("compulsoryFeesInr")) : null, hostelInr: form.get("hostelInr") ? Number(form.get("hostelInr")) : null } : null };
    try {
      const response = await fetch(`/api/admin/colleges/${collegeId}/programs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Program could not be saved.");
      event.currentTarget.reset(); setMessage("Program record added."); await load();
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Program could not be saved."); }
    setBusy(false);
  }
  async function review(recordType: "PROGRAM" | "FEE", recordId: string, form: HTMLFormElement) {
    setBusy(true); setMessage(""); setError(false); const data = new FormData(form);
    try {
      const response = await fetch(`/api/admin/colleges/${collegeId}/programs`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordType, recordId, verificationStatus: data.get("status"), sourceName: data.get("sourceName"), sourceUrl: data.get("sourceUrl"), reviewerNotes: data.get("reviewerNotes") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Review could not be saved.");
      setMessage("Review status saved."); await load();
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Review could not be saved."); }
    setBusy(false);
  }

  return <section className="program-manager">
    <button type="button" className="btn-secondary" onClick={() => void show()} disabled={disabled}>{open ? "Hide programs and fees" : "Manage programs and fees"}</button>
    {open && <div className="program-manager-body">
      {message && <p className={error ? "auth-error" : "auth-success"} role={error ? "alert" : "status"}>{message}</p>}
      {programs.map(program => <article className="surface admin-program-record" key={program.id}>
        <div className="admin-college-heading"><strong>{program.name}</strong><span className="status-badge">{human(program.verificationStatus)}</span></div>
        <p className="data-note">{human(program.degreeLevel)}{program.durationYears ? ` · ${program.durationYears} years` : ""}{program.categories.length ? ` · ${program.categories.map(item => item.category.name).join(", ")}` : ""}</p>
        <p className="data-note">Source: {program.source?.url ? <a href={program.source.url} target="_blank" rel="noreferrer">{program.source.name}</a> : "not attached"}</p>
        <ReviewForm key={`${program.id}-${program.verificationStatus}`} initialStatus={program.verificationStatus} source={program.source} disabled={busy} onSave={form => review("PROGRAM", program.id, form)} />
        {program.feeRecords.map(fee => <div className="admin-fee-record" key={fee.id}><strong>{fee.academicYear} fee record</strong><p className="data-note">Tuition {money(fee.tuitionInr)} · Compulsory fees {money(fee.compulsoryFeesInr)} · Hostel {money(fee.hostelInr)}</p><ReviewForm initialStatus={fee.verificationStatus} source={fee.source} disabled={busy} onSave={form => review("FEE", fee.id, form)} /></div>)}
      </article>)}
      {!programs.length && loaded && <p className="data-note">No program records yet. Add an official source before entering course facts.</p>}
      <form className="surface form-grid admin-program-create" onSubmit={create}>
        <h3 className="form-wide">Add a sourced program</h3>
        <div><label className="field-label">Program name</label><input className="field-control" name="name" required minLength={2} maxLength={180} /></div>
        <div><label className="field-label">Degree level</label><select className="field-control" name="degreeLevel"><option value="UNDERGRADUATE">Undergraduate</option><option value="POSTGRADUATE">Postgraduate</option><option value="DOCTORAL">Doctoral</option><option value="DIPLOMA">Diploma</option><option value="CERTIFICATE">Certificate</option></select></div>
        <div><label className="field-label">Duration (years)</label><input className="field-control" name="durationYears" type="number" min="1" max="12" /></div>
        <fieldset className="form-wide category-picker"><legend className="field-label">Course categories</legend>{categories.map(category => <label key={category.slug}><input type="checkbox" name="categorySlugs" value={category.slug} /> {category.name}</label>)}</fieldset>
        <div className="form-wide"><label className="field-label">Description</label><textarea className="field-control" name="description" rows={2} maxLength={2000} /></div>
        <div><label className="field-label">Source name</label><input className="field-control" name="sourceName" required minLength={2} maxLength={180} placeholder="Official program page" /></div>
        <div><label className="field-label">Source URL (HTTPS)</label><input className="field-control" name="sourceUrl" type="url" required placeholder="https://..." /></div>
        <div><label className="field-label">Initial review status</label><select className="field-control" name="verificationStatus"><option value="PENDING_REVIEW">Pending review</option><option value="DRAFT">Draft</option><option value="VERIFIED">Verified after source review</option></select></div>
        <label className="form-wide"><input type="checkbox" name="feeIncluded" /> Add a fee record from this source</label>
        <div><label className="field-label">Academic year</label><input className="field-control" name="academicYear" defaultValue="2026-27" /></div>
        <div><label className="field-label">Tuition (INR)</label><input className="field-control" name="tuitionInr" type="number" min="0" step="0.01" /></div>
        <div><label className="field-label">Compulsory fees (INR)</label><input className="field-control" name="compulsoryFeesInr" type="number" min="0" step="0.01" /></div>
        <div><label className="field-label">Hostel (INR)</label><input className="field-control" name="hostelInr" type="number" min="0" step="0.01" /></div>
        <button className="btn-primary form-wide" type="submit" disabled={busy}>{busy ? "Saving…" : "Add program record"}</button>
      </form>
    </div>}
  </section>;
}

function ReviewForm({ initialStatus, source, disabled, onSave }: { initialStatus: string; source: Source; disabled: boolean; onSave: (form: HTMLFormElement) => void }) {
  return <form className="admin-review-form" onSubmit={event => { event.preventDefault(); onSave(event.currentTarget); }}>
    <select className="field-control" name="status" defaultValue={initialStatus} aria-label="Review status">{statuses.map(status => <option key={status} value={status}>{human(status)}</option>)}</select>
    <input className="field-control" name="sourceName" placeholder="Source name" defaultValue={source?.name ?? ""} />
    <input className="field-control" name="sourceUrl" type="url" placeholder="HTTPS source URL" defaultValue={source?.url ?? ""} />
    <input className="field-control" name="reviewerNotes" placeholder="Reviewer notes" defaultValue={source?.reviewerNotes ?? ""} />
    <button className="btn-secondary" type="submit" disabled={disabled}>Save review</button>
  </form>;
}
