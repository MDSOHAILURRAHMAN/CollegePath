"use client";

import { useState } from "react";
import { FileUp, LoaderCircle } from "lucide-react";

type ImportResult = { imported: number; errors: { row: number; message: string }[]; note: string };

export function CollegeCsvImporter() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setResult(null); setError("");
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || !file.size) { setError("Choose a CSV file first."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/colleges/import", { method: "POST", headers: { "Content-Type": "text/csv" }, body: await file.text() });
      const data = await response.json();
      if (!response.ok && response.status !== 207) throw new Error(data.error ?? "Import failed.");
      setResult(data);
      event.currentTarget.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Import failed."); }
    finally { setLoading(false); }
  }
  return <section className="surface csv-import-panel"><div><span className="eyebrow">BULK DATA ENTRY</span><h2>Import a CSV file</h2><p className="data-note">Imports create draft records only. Rows with invalid fields or duplicate slugs are reported by row number and not saved.</p><code className="csv-template">name,slug,institutionType,city,state,officialWebsite,officialAdmissionUrl,sourceName,sourceUrl,description</code></div><form onSubmit={submit} encType="text/csv"><label className="field-label" htmlFor="college-csv">College CSV · max 2 MB / 500 rows</label><input className="field-control" id="college-csv" name="file" type="file" accept=".csv,text/csv" required /><button className="btn-secondary" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : <FileUp size={15} />}Import draft records</button></form>{error && <p className="auth-error" role="alert">{error}</p>}{result && <div className="csv-result" role="status"><strong>{result.imported} records imported</strong><p>{result.note}</p>{result.errors.length > 0 && <div><strong>{result.errors.length} rows need correction</strong><ul>{result.errors.map(item => <li key={`${item.row}-${item.message}`}>Row {item.row}: {item.message}</li>)}</ul></div>}</div>}</section>;
}