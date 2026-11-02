import Link from "next/link";
import { Search } from "lucide-react";
import { COURSE_CATEGORIES, INDIAN_STATES } from "@/lib/catalog-options";

export function CollegeSearch({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/colleges" className={compact ? "hero-search" : "college-search-form"}>
      <label className="sr-only" htmlFor={compact ? "hero-query" : "directory-query"}>Search college, course, or city</label>
      <input id={compact ? "hero-query" : "directory-query"} className="field-control" name="query" placeholder="College, course, or city" maxLength={100} />
      <label className="sr-only" htmlFor={compact ? "hero-state" : "directory-state"}>Preferred state</label>
      <select id={compact ? "hero-state" : "directory-state"} className="field-control" name="state" defaultValue="">
        <option value="">Any state</option>{INDIAN_STATES.map(state => <option key={state}>{state}</option>)}
      </select>
      <label className="sr-only" htmlFor={compact ? "hero-category" : "directory-category"}>Course category</label>
      <select id={compact ? "hero-category" : "directory-category"} className="field-control" name="category" defaultValue="">
        <option value="">Any course</option>{COURSE_CATEGORIES.map(([slug, name]) => <option value={slug} key={slug}>{name}</option>)}
      </select>
      <button className="btn-primary" type="submit"><Search size={16} aria-hidden="true" /> Explore colleges</button>
      {!compact && <Link className="btn-secondary" href="/courses">Browse courses</Link>}
    </form>
  );
}
