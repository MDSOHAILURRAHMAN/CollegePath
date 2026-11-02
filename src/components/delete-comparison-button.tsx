"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";

export function DeleteComparisonButton({ comparisonId }: { comparisonId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm("Delete this saved comparison?")) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/student/comparisons/${encodeURIComponent(comparisonId)}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Comparison could not be deleted.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Comparison could not be deleted.");
      setPending(false);
    }
  }

  return <span><button className="btn-quiet" type="button" onClick={remove} disabled={pending} aria-label="Delete saved comparison">{pending ? <LoaderCircle className="spin" size={14} /> : <Trash2 size={14} />}Delete</button>{error && <small className="form-error" role="alert">{error}</small>}</span>;
}
