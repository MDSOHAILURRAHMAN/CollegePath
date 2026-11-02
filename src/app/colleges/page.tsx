import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { CollegeCard } from "@/components/college-card";
import { CollegeNameSearch } from "@/components/college-name-search";
import { collegeSearchSchema } from "@/lib/schemas";
import { searchColleges } from "@/lib/colleges";
import { COURSE_CATEGORIES, INDIAN_STATES } from "@/lib/catalog-options";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CollegesPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const parsed = collegeSearchSchema.safeParse({
    ...raw,
    query: Array.isArray(raw.query) ? raw.query[0] : raw.query ?? "",
    state: Array.isArray(raw.state) ? raw.state[0] : raw.state ?? "",
    category: Array.isArray(raw.category) ? raw.category[0] : raw.category ?? "",
    type: Array.isArray(raw.type) ? raw.type[0] : raw.type ?? "",
    degree: Array.isArray(raw.degree) ? raw.degree[0] : raw.degree ?? "",
    minFee: (Array.isArray(raw.minFee) ? raw.minFee[0] : raw.minFee) || undefined,
    maxFee: (Array.isArray(raw.maxFee) ? raw.maxFee[0] : raw.maxFee) || undefined,
  });

  if (!parsed.success) {
    return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">COLLEGE DIRECTORY</span><h1>Explore colleges</h1></div></section><div className="page-container directory-layout"><div className="error-state"><h3>Some search filters are invalid</h3><p>Adjust the filters and try again.</p><Link className="btn-secondary" href="/colleges">Clear filters</Link></div></div></>;
  }

  let result: Awaited<ReturnType<typeof searchColleges>> | null = null;
  try { result = await searchColleges(parsed.data); } catch {}
  const filters = parsed.data;
  const pageCount = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "" && value !== 1 && value !== "name") query.set(key, String(value)); });
  const queryString = query.toString();

  return (
    <>
      <section className="directory-hero"><div className="page-container"><span className="eyebrow"><span className="eyebrow-dot" />COLLEGE DIRECTORY</span><h1>Explore your options.</h1><p>Search available records and compare what’s known. Each listing shows its source and verification status.</p></div></section>
      <div className="page-container directory-layout">
        <aside className="surface filter-panel"><h2><SlidersHorizontal size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} />Refine your search</h2>
          <form action="/colleges" method="get">
            <div className="filter-group"><label className="field-label" htmlFor="query">College or city</label><CollegeNameSearch defaultValue={filters.query} /></div>
            <div className="filter-group"><label className="field-label" htmlFor="state">State</label><select className="field-control" id="state" name="state" defaultValue={filters.state}><option value="">Any state</option>{INDIAN_STATES.map(state => <option key={state}>{state}</option>)}</select></div>
            <div className="filter-group"><label className="field-label" htmlFor="category">Course category</label><select className="field-control" id="category" name="category" defaultValue={filters.category}><option value="">Any category</option>{COURSE_CATEGORIES.map(([slug, name]) => <option value={slug} key={slug}>{name}</option>)}</select></div>
            <div className="filter-group"><label className="field-label" htmlFor="type">Institution type</label><select className="field-control" id="type" name="type" defaultValue={filters.type}><option value="">Any type</option><option value="GOVERNMENT">Government</option><option value="PRIVATE">Private</option><option value="DEEMED">Deemed</option><option value="AUTONOMOUS">Autonomous</option></select></div>
            <div className="filter-group"><label className="field-label" htmlFor="degree">Degree</label><select className="field-control" id="degree" name="degree" defaultValue={filters.degree}><option value="">Any degree</option><option value="UNDERGRADUATE">Undergraduate</option><option value="POSTGRADUATE">Postgraduate</option><option value="DIPLOMA">Diploma</option><option value="DOCTORAL">Doctoral</option></select></div>
            <div className="filter-group"><label className="field-label" htmlFor="minFee">Annual tuition (INR)</label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}><input className="field-control" id="minFee" name="minFee" type="number" min="0" step="10000" defaultValue={filters.minFee} placeholder="Min" aria-label="Minimum annual tuition in INR" /><input className="field-control" name="maxFee" type="number" min="0" step="10000" defaultValue={filters.maxFee} placeholder="Max" aria-label="Maximum annual tuition in INR" /></div></div>
            <div className="filter-group"><label className="field-label" htmlFor="sort">Sort by</label><select className="field-control" id="sort" name="sort" defaultValue={filters.sort}><option value="name">Name</option><option value="recent">Recently updated</option></select></div>
            <div className="filter-actions"><button className="btn-primary" type="submit">Apply filters</button><Link className="btn-secondary" href="/colleges">Reset</Link></div>
          </form>
        </aside>
        <section aria-labelledby="results-heading"><div className="results-heading"><p id="results-heading">{result ? `${result.total} ${result.total === 1 ? "record" : "records"}` : "Directory unavailable"}{filters.query ? ` for “${filters.query}”` : ""}</p><span className="data-note">No unsourced rankings or placement claims.</span></div>
          {!result ? <div className="error-state"><Building2 size={24} /><h3>College data is unavailable</h3><p>Start PostgreSQL and apply migrations to connect the directory.</p></div> : result.colleges.length ? <><div className="college-grid">{result.colleges.map(college => <CollegeCard college={college} key={college.id} />)}</div><div className="pagination"><span>Page {result.page} of {pageCount}</span><div>{result.page > 1 && <Link className="btn-secondary" href={`/colleges?${queryString ? `${queryString}&` : ""}page=${result.page - 1}`}><ChevronLeft size={15} />Previous</Link>}{result.page < pageCount && <Link className="btn-secondary" href={`/colleges?${queryString ? `${queryString}&` : ""}page=${result.page + 1}`}>Next<ChevronRight size={15} /></Link>}</div></div></> : <div className="empty-state"><Building2 size={24} /><h3>No records match those filters</h3><p>Try a broader search or clear your filters.</p><Link className="btn-secondary" href="/colleges">Clear filters</Link></div>}
        </section>
      </div>
    </>
  );
}
