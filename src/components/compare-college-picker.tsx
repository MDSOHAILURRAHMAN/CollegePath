"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle, Plus, X } from "lucide-react";

type CollegeOption = {
  slug: string;
  name: string;
  institutionType: string;
  officialDistrict: string | null;
  officialState: string | null;
  aisheCode: string | null;
};

type SearchResponse = { colleges?: CollegeOption[]; hasMore?: boolean; error?: string };

function typeName(type: string) {
  if (type === "GOVERNMENT") return "Government";
  if (type === "PRIVATE") return "Private";
  return type.toLowerCase().replaceAll("_", " ");
}

export function CompareCollegePicker({ initialSelection }: { initialSelection: CollegeOption[] }) {
  const [selected, setSelected] = useState(initialSelection);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CollegeOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setResults([]);
      setHasMore(false);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const search = new URLSearchParams({ query: query.trim(), offset: String(offset) });
        const response = await fetch(`/api/college-options?${search}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json() as SearchResponse;
        if (!response.ok) throw new Error(data.error || "College search failed.");
        const fetched = (data.colleges ?? []).filter(college => !selected.some(item => item.slug === college.slug));
        setResults(current => offset === 0 ? fetched : [...current, ...fetched]);
        setHasMore(Boolean(data.hasMore));
      } catch (searchError) {
        if (!controller.signal.aborted) setError(searchError instanceof Error ? searchError.message : "College search failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 220 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, selected, offset]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function addCollege(college: CollegeOption) {
    if (selected.length >= 3) return;
    setSelected(current => [...current, college]);
    setQuery("");
    setOffset(0);
    input.current?.focus();
  }

  function removeCollege(slug: string) {
    setSelected(current => current.filter(college => college.slug !== slug));
  }

  function changeQuery(value: string) {
    setQuery(value);
    setOffset(0);
  }

  return (
    <div className="compare-college-picker" ref={container}>
      {selected.map(college => <input type="hidden" name="colleges" value={college.slug} key={college.slug} />)}
      <div className="compare-picker-heading">
        <div>
          <label className="field-label" htmlFor="compare-college-picker-toggle">Choose up to three colleges</label>
          <p className="data-note" id="compare-help">Browse or search all Government and Private institutions. Names are listed alphabetically.</p>
        </div>
        <button className="btn-secondary" id="compare-college-picker-toggle" type="button" aria-expanded={open} aria-controls="compare-college-options" onClick={() => { setOpen(value => !value); window.setTimeout(() => input.current?.focus(), 0); }}>
          <Plus size={15} />Add college<ChevronDown size={14} />
        </button>
      </div>
      {selected.length > 0 && <div className="compare-picker-selected" aria-label="Selected colleges">
        {selected.map(college => <span className="compare-picker-chip" key={college.slug}>
          <span>{college.name}</span>
          <button type="button" aria-label={`Remove ${college.name}`} onClick={() => removeCollege(college.slug)}><X size={13} /></button>
        </span>)}
      </div>}
      {open && <div className="compare-picker-panel" id="compare-college-options">
        <div className="compare-picker-search">
          <label className="sr-only" htmlFor="compare-college-search">Search college names</label>
          <input ref={input} className="field-control" id="compare-college-search" type="search" value={query} onChange={event => changeQuery(event.target.value)} placeholder="Type a college name or browse A-Z" autoComplete="off" aria-describedby="compare-help" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} />
          {loading && <LoaderCircle className="spin" size={16} aria-label="Searching colleges" />}
        </div>
        {error ? <p className="compare-picker-message" role="alert">{error}</p>
          : loading && results.length === 0 ? <p className="compare-picker-message" role="status">Loading colleges...</p>
          : results.length ? <ul className="compare-picker-results" aria-label="College search results">
            {results.map(college => <li key={college.slug}>
              <button className="compare-picker-option" type="button" onClick={() => addCollege(college)} disabled={selected.length >= 3}>
                <span className="compare-picker-option-name"><Plus size={14} aria-hidden="true" />{college.name}</span>
                <span className="compare-picker-option-meta">{typeName(college.institutionType)}{college.officialDistrict ? ` | ${college.officialDistrict}` : ""}{college.officialState ? `, ${college.officialState}` : ""}{college.aisheCode ? ` | AISHE ${college.aisheCode}` : ""}</span>
              </button>
            </li>)}
          </ul> : <p className="compare-picker-message">No matching Government or Private colleges. Try another name or acronym.</p>}
        {hasMore && <button className="compare-picker-load-more" type="button" onClick={() => setOffset(value => value + 30)} disabled={loading}>{loading ? "Loading..." : "Load more colleges"}</button>}
        {selected.length >= 3 && <p className="compare-picker-limit" role="status">You have selected the maximum of three colleges.</p>}
      </div>}
    </div>
  );
}
