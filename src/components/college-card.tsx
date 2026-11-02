import Link from "next/link";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import type { CollegeCardData } from "@/lib/colleges";
import { SaveCollegeButton } from "@/components/save-college-button";

const typeLabel: Record<string, string> = { GOVERNMENT: "Government", PRIVATE: "Private", DEEMED: "Deemed", AUTONOMOUS: "Autonomous", OTHER: "Type not listed" };
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function CollegeCard({ college, saved = false }: { college: CollegeCardData; saved?: boolean }) {
  const locations = [...new Set(college.campuses.map(campus => `${campus.city}, ${campus.state}`))];
  const fee = college.feeRecords.find(record => record.tuitionInr !== null);
  const categories = [...new Set(college.programs.flatMap(program => program.categories.map(item => item.category.name)))].slice(0, 2);
  const ranking = college.rankings?.find(record => record.rank !== null);

  return (
    <article className="college-card">
      <div className="college-card-art"><span className={college.demoRecord ? "status-demo" : "status-verified"}>{college.demoRecord ? "Demo data · not verified" : <><BadgeCheck size={12} /> Verified record</>}</span><Building2 size={38} aria-hidden="true" /></div>
      <div className="college-card-body">
        <p className="college-card-location"><MapPin size={12} aria-hidden="true" />{locations.join(" · ") || "Location not available"}</p>
        <h3><Link href={`/colleges/${college.slug}`}>{college.name}</Link></h3>
        <div className="college-tags"><span className="college-tag">{typeLabel[college.institutionType]}</span>{categories.map(category => <span className="college-tag" key={category}>{category}</span>)}</div>
        {ranking && <p className="data-note" style={{ margin: "10px 0 0" }}>{ranking.rankingBody}{ranking.category ? ` Â· ${ranking.category}` : ""} rank {ranking.rank} ({ranking.academicYear})</p>}
        <div className="college-facts"><div><small>Tuition information</small><strong>{fee ? `${inr.format(fee.tuitionInr!)} · ${fee.academicYear}` : "Not available"}</strong></div><div><small>Programs listed</small><strong>{college.programs.length || "Not available"}</strong></div></div>
        {college.demoRecord && <p className="data-note" style={{ marginTop: 10 }}>Fictional development record, not an actual institution.</p>}
        {!college.demoRecord && college.lastVerifiedAt && <p className="data-note" style={{ marginTop: 10 }}>Verified {college.lastVerifiedAt.toLocaleDateString("en-IN")}{college.source ? ` · Source: ${college.source.name}` : ""}</p>}
        <div className="college-card-actions"><Link className="btn-primary" href={`/colleges/${college.slug}`}>View details</Link><Link className="btn-secondary" href={`/compare?colleges=${encodeURIComponent(college.slug)}`}>Compare</Link><SaveCollegeButton collegeId={college.id} saved={saved} /></div>
      </div>
    </article>
  );
}
