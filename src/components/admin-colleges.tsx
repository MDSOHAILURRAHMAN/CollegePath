"use client";

import { useEffect, useState } from "react";
import { Building2, LoaderCircle } from "lucide-react";

type CollegeRecord = { id: string; name: string; slug: string; institutionType: string; verificationStatus: string; demoRecord: boolean; lastVerifiedAt: string | null; source: { name: string; url: string | null } | null; campuses: { city: string; state: string }[] };
export function AdminColleges() {
  const [colleges, setColleges] = useState<CollegeRecord[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  async function load() {
    const response = await fetch("/api/admin/colleges", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "College data is unavailable.");
    setColleges(result.colleges);
  }
  useEffect(() => { load().catch(error => { setIsError(true); setMessage(error instanceof Error ? error.message : "College data is unavailable."); }); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setIsError(false);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/admin/colleges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setIsError(true); setMessage(result.error ?? "College could not be added."); }
    else { setMessage("Draft college record created. Add a source and complete review before marking it verified."); event.currentTarget.reset(); await load(); }
    setPending(false);
  }

  async function setStatus(college: CollegeRecord, status: string, form: HTMLFormElement) {
    setMessage(""); setIsError(false);
    const data = new FormData(form);
    const response = await fetch(`/api/admin/colleges/${college.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationStatus: status, sourceName: data.get("sourceName"), sourceUrl: data.get("sourceUrl"), reviewerNotes: data.get("reviewerNotes") }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setIsError(true); setMessage(result.error ?? "College status could not be updated."); return; }
    setMessage(`Record updated: ${result.college.verificationStatus.replaceAll("_", " ")}.`); await load();
  }

  return <div className="admin-workspace">{message && <p className={isError ? "auth-error" : "auth-success"} role={isError ? "alert" : "status"}>{message}</p>}<section className="surface college-create-panel"><span className="eyebrow">ADD A RECORD</span><h2>Start as a draft.</h2><p className="data-note">A source is required before a record can be marked verified. Demo institutions should never be imported as real records.</p><form className="form-grid" onSubmit={create}><div><label className="field-label" htmlFor="college-name">Institution name</label><input className="field-control" id="college-name" name="name" required minLength={3} maxLength={180} /></div><div><label className="field-label" htmlFor="college-slug">URL slug</label><input className="field-control" id="college-slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div><div><label className="field-label" htmlFor="college-type">Institution type</label><select className="field-control" id="college-type" name="institutionType"><option value="OTHER">Other / not classified</option><option value="GOVERNMENT">Government</option><option value="PRIVATE">Private</option><option value="DEEMED">Deemed</option><option value="AUTONOMOUS">Autonomous</option></select></div><div><label className="field-label" htmlFor="college-city">Campus city</label><input className="field-control" id="college-city" name="city" maxLength={80} /></div><div><label className="field-label" htmlFor="college-state">Campus state</label><input className="field-control" id="college-state" name="state" maxLength={80} /></div><div><label className="field-label" htmlFor="college-website">Official website (HTTPS)</label><input className="field-control" id="college-website" name="officialWebsite" type="url" placeholder="https://…" /></div><div><label className="field-label" htmlFor="college-admissions">Official admissions website (HTTPS)</label><input className="field-control" id="college-admissions" name="officialAdmissionUrl" type="url" placeholder="https://…" /></div><div><label className="field-label" htmlFor="source-name">Source name</label><input className="field-control" id="source-name" name="sourceName" maxLength={180} /></div><div className="form-wide"><label className="field-label" htmlFor="source-url">Source URL</label><input className="field-control" id="source-url" name="sourceUrl" type="url" placeholder="https://official-source.example" /></div><div className="form-wide"><label className="field-label" htmlFor="college-description">Overview</label><textarea className="field-control" id="college-description" name="description" rows={3} maxLength={4000} /></div><div className="form-wide"><button className="btn-primary" type="submit" disabled={pending}>{pending && <LoaderCircle className="spin" size={14} />}Create draft record</button></div></form></section><section className="admin-college-list"><div className="section-heading"><div><span className="eyebrow">REVIEW WORKFLOW</span><h2>College records</h2></div><span className="data-note">{colleges.length} shown</span></div>{colleges.length ? colleges.map(college => <article className="surface admin-college-record" key={college.id}><div className="admin-college-heading"><span><Building2 size={16} color="#0d9488" /><strong>{college.name}</strong></span><span className={college.verificationStatus === "VERIFIED" ? "status-verified" : college.demoRecord ? "status-demo" : "status-badge"}>{college.demoRecord ? "DEMO" : college.verificationStatus.replaceAll("_", " ")}</span></div><small>{college.slug} · {college.campuses.map(item => `${item.city}, ${item.state}`).join(" · ") || "No campus location"}{college.source ? ` · Source: ${college.source.name}` : " · No source attached"}</small><form className="admin-review-form" onSubmit={event => { event.preventDefault(); void setStatus(college, String(new FormData(event.currentTarget).get("status")), event.currentTarget); }}><label className="sr-only" htmlFor={`college-status-${college.id}`}>Verification status</label><select className="field-control" id={`college-status-${college.id}`} name="status" defaultValue={college.verificationStatus} disabled={college.demoRecord}><option value="DRAFT">Draft</option><option value="PENDING_REVIEW">Pending review</option><option value="VERIFIED">Verified</option><option value="NEEDS_UPDATE">Needs update</option><option value="ARCHIVED">Archived</option></select><input className="field-control" name="sourceName" placeholder="Source name" defaultValue={college.source?.name ?? ""} disabled={college.demoRecord} /><input className="field-control" name="sourceUrl" type="url" placeholder="https://source URL" defaultValue={college.source?.url ?? ""} disabled={college.demoRecord} /><input className="field-control" name="reviewerNotes" placeholder="Reviewer notes" disabled={college.demoRecord} /><button className="btn-secondary" type="submit" disabled={college.demoRecord}>Save review</button></form></article>) : <div className="empty-state"><h2>No college records</h2><p>Create a draft above or seed the clearly labelled demo records.</p></div>}</section></div>;
}