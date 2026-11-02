"use client";

import { useState } from "react";
import { Bookmark, Check, LoaderCircle } from "lucide-react";

export function SaveCollegeButton({ collegeId, saved = false }: { collegeId: string; saved?: boolean }) {
  const [isSaved, setIsSaved] = useState(saved);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function toggleSaved() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(isSaved ? `/api/student/saved-colleges/${encodeURIComponent(collegeId)}` : "/api/student/saved-colleges", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isSaved ? undefined : JSON.stringify({ collegeId }),
      });
      const result = await response.json();
      if (response.status === 401) {
        location.href = `/login?returnTo=${encodeURIComponent(location.pathname)}`;
        return;
      }
      if (!response.ok) throw new Error(result.error ?? "Could not update your shortlist.");
      setIsSaved(!isSaved);
      setMessage(!isSaved ? "Saved to your shortlist" : "Removed from your shortlist");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your shortlist.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span style={{ flex: 1 }}>
      <button className={`btn-secondary save-button${isSaved ? " saved" : ""}`} type="button" onClick={toggleSaved} disabled={pending} aria-pressed={isSaved} aria-label={isSaved ? "Remove college from saved list" : "Save college"}>
        {pending ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : isSaved ? <Check size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />}
        <span>{pending ? "Saving" : isSaved ? "Saved" : "Save"}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">{message}</span>
    </span>
  );
}