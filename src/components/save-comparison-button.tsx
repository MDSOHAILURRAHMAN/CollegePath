"use client";

import { useState } from "react";
import { BookmarkCheck } from "lucide-react";

export function SaveComparisonButton({ colleges }: { colleges: string[] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function save() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/student/comparisons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ colleges }) });
      const result = await response.json();
      if (response.status === 401) { location.href = `/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`; return; }
      if (!response.ok) throw new Error(result.error ?? "Could not save comparison.");
      setMessage("Comparison saved to your account.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save comparison."); }
    finally { setPending(false); }
  }
  return <span><button className="btn-primary" type="button" disabled={pending} onClick={save}><BookmarkCheck size={15} />{pending ? "Saving…" : "Save comparison"}</button><span className="data-note" role="status" aria-live="polite" style={{ marginLeft: 10 }}>{message}</span></span>;
}