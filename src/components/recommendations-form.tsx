"use client";

import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

type Category = { slug: string; name: string };
type Result = { slug: string; name: string; band: "POTENTIAL"; reasons: string[]; estimatedAnnualTuitionInr: number | null; officialAdmissionUrl: string | null; limitations: string[] };

export function RecommendationsForm({ categories }: { categories: Category[] }) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setNotice(""); setResults([]);
    const form = new FormData(event.currentTarget);
    const budget = String(form.get("budget") ?? "");
    const body = { categorySlug: String(form.get("category") ?? "") || undefined, degreeLevel: form.get("degreeLevel"), preferredStates: form.getAll("states").map(String).filter(Boolean), budgetInr: budget ? Number(budget) : null, institutionPreference: String(form.get("institutionPreference") ?? "") || undefined };
    try {
      const response = await fetch("/api/recommendations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Recommendations are unavailable.");
      setResults(result.recommendations); setNotice(result.disclaimer);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Recommendations are unavailable."); }
    finally { setLoading(false); }
  }

  return <div className="recommendation-layout"><form className="surface recommendation-form" onSubmit={submit}><span className="eyebrow">YOUR PRIORITIES</span><h2>Build a first shortlist.</h2><p className="data-note">This is a transparent discovery tool, not an admissions prediction.</p>
    <div className="filter-group"><label className="field-label" htmlFor="recommend-category">Course category</label><select className="field-control" name="category" id="recommend-category"><option value="">Any available category</option>{categories.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div>
    <div className="filter-group"><label className="field-label" htmlFor="recommend-degree">Degree level</label><select className="field-control" name="degreeLevel" id="recommend-degree"><option value="UNDERGRADUATE">Undergraduate</option><option value="POSTGRADUATE">Postgraduate</option><option value="DIPLOMA">Diploma</option></select></div>
    <div className="filter-group"><label className="field-label" htmlFor="recommend-budget">Annual tuition budget (INR, optional)</label><input className="field-control" name="budget" id="recommend-budget" type="number" min="0" step="10000" /></div>
    <div className="filter-group"><label className="field-label" htmlFor="recommend-state">Preferred state (optional)</label><select className="field-control" name="states" id="recommend-state"><option value="">No preference</option>{["Delhi", "Karnataka", "Maharashtra", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"].map(state => <option key={state}>{state}</option>)}</select></div>
    <div className="filter-group"><label className="field-label" htmlFor="recommend-type">Institution type (optional)</label><select className="field-control" name="institutionPreference" id="recommend-type"><option value="">No preference</option><option value="GOVERNMENT">Government</option><option value="PRIVATE">Private</option></select></div>
    <button className="btn-primary" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}Find potential options</button>
  </form><section className="recommendation-results" aria-live="polite">{error && <div className="auth-error" role="alert">{error}</div>}{loading && <div className="loading-state"><LoaderCircle className="spin" />Matching verified programs…</div>}{!loading && results.length === 0 && !error && <div className="empty-state"><Sparkles size={23} color="#0d9488" /><h2>Your options will appear here</h2><p>Results use verified program information. If a field is missing, the tool won’t assume it.</p></div>}{!loading && results.length > 0 && <><p className="notice">{notice}</p>{results.map(result => <article className="surface recommendation-card" key={result.slug}><div className="recommendation-card-top"><span className="status-demo">Potential option</span><span className="data-note">Admission likelihood not assessed</span></div><h3>{result.name}</h3><p><strong>Why it appears:</strong> {result.reasons.join(" · ")}</p><p><strong>Annual tuition:</strong> {result.estimatedAnnualTuitionInr === null ? "Not available" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(result.estimatedAnnualTuitionInr)}</p><p className="data-note">{result.limitations.join(" ")}</p><div className="college-card-actions"><a className="btn-primary" href={`/colleges/${result.slug}`}>Review college</a>{result.officialAdmissionUrl && <a className="btn-secondary" href={result.officialAdmissionUrl} target="_blank" rel="noreferrer">Official admissions</a>}</div></article>)}</>}</section></div>;
}