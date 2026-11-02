"use client";

import { useEffect, useState } from "react";
import type { CollegeSearch } from "@/lib/schemas";

type CollegeOption = {
  slug: string;
  name: string;
  institutionType: "GOVERNMENT" | "PRIVATE";
  officialDistrict: string | null;
  officialState: string | null;
  aisheCode: string | null;
};

export function CollegeNameSearch({ defaultValue }: { defaultValue: CollegeSearch["query"] }) {
  const [query, setQuery] = useState(defaultValue);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);

  useEffect(() => {
    if (query.trim().length < 1) {
      setColleges([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/college-options?query=${encodeURIComponent(query.trim())}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { colleges?: CollegeOption[] };
        setColleges(data.colleges ?? []);
      } catch {
        if (!controller.signal.aborted) setColleges([]);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return <>
    <input className="field-control" id="query" name="query" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by college name or city" maxLength={100} list="college-name-suggestions" autoComplete="off" />
    <datalist id="college-name-suggestions">
      {colleges.map(college => <option value={college.name} label={`${college.institutionType === "GOVERNMENT" ? "Government" : "Private"}${college.officialDistrict ? ` | ${college.officialDistrict}` : ""}${college.officialState ? `, ${college.officialState}` : ""}${college.aisheCode ? ` | AISHE ${college.aisheCode}` : ""}`} key={college.slug} />)}
    </datalist>
  </>;
}
