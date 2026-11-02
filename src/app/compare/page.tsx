import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { SaveComparisonButton } from "@/components/save-comparison-button";
import { CompareCollegePicker } from "@/components/compare-college-picker";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const compareInclude = {
  campuses: true,
  programs: { where: { verificationStatus: { in: ["VERIFIED", "DEMO"] as const } }, include: { categories: { include: { category: true } } } },
  feeRecords: { where: { verificationStatus: "VERIFIED" as const }, orderBy: { academicYear: "desc" as const } },
  rankings: { where: { verificationStatus: "VERIFIED" as const }, orderBy: { academicYear: "desc" as const }, include: { source: true } },
  accreditations: { where: { verificationStatus: "VERIFIED" as const } },
} satisfies Prisma.CollegeInclude;
type ComparedCollege = Prisma.CollegeGetPayload<{ include: typeof compareInclude }>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const selected = (Array.isArray(raw.colleges) ? raw.colleges : raw.colleges ? [raw.colleges] : []).filter(Boolean).slice(0, 3);
  let colleges: ComparedCollege[] = [];
  let unavailable = false;
  try {
    colleges = await prisma.college.findMany({
      where: { slug: { in: selected }, verificationStatus: { in: ["VERIFIED", "DEMO"] } },
      include: compareInclude,
    });
  } catch { unavailable = true; }
  const selectedColleges = selected.map(slug => colleges.find(college => college.slug === slug)).filter((college): college is (typeof colleges)[number] => Boolean(college));
  const link = selected.length ? `/compare?${selected.map(slug => `colleges=${encodeURIComponent(slug)}`).join("&")}` : "/compare";
  const feeDescription = (college: (typeof colleges)[number]) => {
    const fee = college.feeRecords.find(record => record.tuitionInr !== null);
    return fee?.tuitionInr ? `${inr.format(Number(fee.tuitionInr))} · ${fee.academicYear}` : "Not available";
  };

  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">A SIDE-BY-SIDE VIEW</span><h1>Compare your options.</h1><p>Compare up to three colleges. We only show available information and its verification status.</p></div></section><section className="page-container section-pad">
    {unavailable ? <div className="error-state"><h2>College data is unavailable</h2><p>Connect PostgreSQL to build a comparison.</p></div> : <>
      <form action="/compare" className="surface" style={{ padding: 17, marginBottom: 21 }}><CompareCollegePicker initialSelection={selectedColleges.map(college => ({ slug: college.slug, name: college.name, institutionType: college.institutionType, officialDistrict: college.officialDistrict, officialState: college.officialState }))} /><p className="data-note" style={{ margin: "12px 0" }}>The comparison URL contains only public college identifiers.</p><button className="btn-primary" type="submit">Compare selected colleges</button></form>
      {!selectedColleges.length ? <div className="empty-state"><h2>Add colleges to compare</h2><p>Choose one or more records above, or start in the directory.</p><Link className="btn-secondary" href="/colleges">Browse colleges</Link></div> : selectedColleges.length < 2 ? <div className="notice" style={{ marginBottom: 16 }}>Add at least one more college to see a side-by-side comparison. Missing information is shown as “Not available.”</div> : <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 13 }}><p className="data-note" style={{ margin: 0 }}>Comparison does not designate a universal “best” college.</p><SaveComparisonButton colleges={selectedColleges.map(college => college.slug)} /></div>
        <div className="compare-scroll"><table className="compare-table"><thead><tr><th>Information</th>{selectedColleges.map(college => <th key={college.id}><Link href={`/colleges/${college.slug}`}>{college.name}</Link>{college.demoRecord && <span className="status-demo" style={{ display: "flex", width: "fit-content", marginTop: 7 }}>Demo record</span>}</th>)}</tr></thead><tbody>
          <tr><td>Location</td>{selectedColleges.map(c => <td key={c.id}>{c.campuses.length ? c.campuses.map(campus => `${campus.city}, ${campus.state}`).join(" · ") : "Not available"}</td>)}</tr>
          <tr><td>Institution type</td>{selectedColleges.map(c => <td key={c.id}>{c.institutionType.replaceAll("_", " ")}</td>)}</tr>
          <tr><td>Programs</td>{selectedColleges.map(c => <td key={c.id}>{c.programs.length ? c.programs.map(program => `${program.name} (${program.degreeLevel.toLowerCase()})`).join("; ") : "Not available"}</td>)}</tr>
          <tr><td>Course categories</td>{selectedColleges.map(c => { const categories = [...new Set(c.programs.flatMap(program => program.categories.map(item => item.category.name)))]; return <td key={c.id}>{categories.length ? categories.join(", ") : "Not available"}</td>; })}</tr>
          <tr><td>Verified annual tuition</td>{selectedColleges.map(c => <td key={c.id}>{feeDescription(c)}</td>)}</tr>
          <tr><td>Verified rankings</td>{selectedColleges.map(c => <td key={c.id}>{c.rankings.length ? c.rankings.map(record => `${record.rankingBody}${record.rank ? ` #${record.rank}` : ""} · ${record.academicYear}`).join("; ") : "Not available"}</td>)}</tr>
          <tr><td>Recognition records</td>{selectedColleges.map(c => <td key={c.id}>{c.accreditations.length ? c.accreditations.map(record => `${record.authority}: ${record.status}`).join("; ") : "Not available"}</td>)}</tr>
          <tr><td>Admission information</td>{selectedColleges.map(c => <td key={c.id}>{c.officialAdmissionUrl ? <a href={c.officialAdmissionUrl} target="_blank" rel="noreferrer">Official admission website</a> : "Not available"}</td>)}</tr>
        </tbody></table></div>
        <p className="data-note" style={{ marginTop: 12 }}>Records marked demo are fictional. Fees, rankings, and recognition appear only where verified for the displayed year. <Link href={link}>Share this comparison</Link></p>
      </>}
    </>}
  </section></>;
}
