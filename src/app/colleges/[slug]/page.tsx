import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Building2, MapPin } from "lucide-react";
import { getCollegeBySlug } from "@/lib/colleges";
import { SaveCollegeButton } from "@/components/save-college-button";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;
type Props = { params: Params };
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const college = await getCollegeBySlug(slug);
    if (college) return { title: college.name, description: college.description ?? `Programs, available sources, and admission information for ${college.name}.` };
  } catch {}
  return { title: "College details" };
}

export default async function CollegeDetailsPage({ params }: Props) {
  const { slug } = await params;
  let college;
  try { college = await getCollegeBySlug(slug); } catch { return <section className="page-container section-pad"><div className="error-state"><h1>College details are unavailable</h1><p>Connect PostgreSQL and try again.</p><Link className="btn-secondary" href="/colleges">Back to colleges</Link></div></section>; }
  if (!college) notFound();

  return <>
    <section className="detail-hero"><div className="page-container"><Link className="data-note" href="/colleges">← Back to college directory</Link><div style={{ display: "flex", gap: 9, marginTop: 18 }}><span className={college.demoRecord ? "status-demo" : "status-verified"}>{college.demoRecord ? "Development demo · not a real college" : <><BadgeCheck size={12} /> Verified record</>}</span></div><h1>{college.name}</h1><p style={{ maxWidth: 660, color: "#63758a", fontSize: 13, lineHeight: 1.7 }}>{college.description ?? "No overview has been verified yet."}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 14, color: "#64778c", fontSize: 11 }}>{college.campuses.map(campus => <span key={`${campus.city}-${campus.state}`}><MapPin size={13} style={{ verticalAlign: "-2px" }} /> {campus.city}, {campus.state}</span>)}<span><Building2 size={13} style={{ verticalAlign: "-2px" }} /> {college.institutionType.replaceAll("_", " ")}</span></div></div></section>
    <div className="page-container detail-layout"><article className="surface detail-content">
      {college.demoRecord && <div className="notice">This is a fictional development record used to preview the directory. It does not represent a real institution. No fees, recognition, rankings, or admission likelihood are asserted.</div>}
      <h2>Overview</h2><p>{college.description ?? "Information is not yet available."}</p>
      <h2>Campuses & location</h2>{college.campuses.length ? <ul>{college.campuses.map(campus => <li key={campus.id}>{campus.name ? `${campus.name} · ` : ""}{campus.city}, {campus.state}. Hostel availability: {campus.hostelAvailable === null ? "Not available" : campus.hostelAvailable ? "Available (verify with college)" : "Not listed"}.</li>)}</ul> : <p>Campus information is not available.</p>}
      <h2>Programs</h2>{college.programs.length ? <ul>{college.programs.map(program => <li key={program.id}><strong>{program.name}</strong> · {program.degreeLevel.toLowerCase().replaceAll("_", " ")} {program.categories.length ? `· ${program.categories.map(item => item.category.name).join(", ")}` : ""}</li>)}</ul> : <p>Programs have not been listed.</p>}
      <h2>Fees</h2>{college.feeRecords.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Academic year</th><th>Tuition</th><th>Compulsory fees</th><th>Currency</th></tr></thead><tbody>{college.feeRecords.map((fee, index) => <tr key={index}><td>{fee.academicYear}</td><td>{fee.tuitionInr ? inr.format(Number(fee.tuitionInr)) : "Not available"}</td><td>{fee.compulsoryFeesInr ? inr.format(Number(fee.compulsoryFeesInr)) : "Not available"}</td><td>INR</td></tr>)}</tbody></table></div> : <p>No verified tuition or compulsory-fee records are available.</p>}
      <h2>Recognition & accreditation</h2>{college.accreditations.length ? <ul>{college.accreditations.map(record => <li key={record.id}>{record.authority}: {record.status}{record.validUntil ? ` · valid until ${record.validUntil.toLocaleDateString("en-IN")}` : ""}{record.source?.url ? <> · <a href={record.source.url} target="_blank" rel="noreferrer">Source</a></> : ""}</li>)}</ul> : <p>No verified recognition or accreditation records are available.</p>}
      <h2>Rankings</h2>{college.rankings.length ? <ul>{college.rankings.map(record => <li key={record.id}>{record.rankingBody}{record.category ? ` · ${record.category}` : ""}{record.rank ? ` · Rank ${record.rank}` : " · Rank not available"} · {record.academicYear}{record.source?.url ? <> · <a href={record.source.url} target="_blank" rel="noreferrer">Source</a></> : ""}</li>)}</ul> : <p>No verified ranking records are available. CollegePath does not create composite rankings.</p>}
      <h2>Placement outcomes</h2>{college.placements.length ? <ul>{college.placements.map(record => <li key={record.id}>Reporting year {record.reportingYear}: median {record.medianSalaryInr ? inr.format(Number(record.medianSalaryInr)) : "not available"}; average {record.averageSalaryInr ? inr.format(Number(record.averageSalaryInr)) : "not available"}; placement rate {record.placementRate !== null ? `${record.placementRate}%` : "not available"}. {record.methodology ?? "Methodology not supplied."}</li>)}</ul> : <p>No verified placement outcomes are available.</p>}
      <h2>Scholarships & admission</h2>{college.scholarships.length ? <ul>{college.scholarships.map(item => <li key={item.id}>{item.name}: {item.description} {item.source?.url ? <a href={item.source.url} target="_blank" rel="noreferrer">Source</a> : ""}</li>)}</ul> : <p>No verified scholarship records are available.</p>}
      <p className="data-note">{college.demoRecord ? "Demo record: no external sources are asserted." : `Verification status: ${college.verificationStatus.replaceAll("_", " ")}. ${college.lastVerifiedAt ? `Last checked ${college.lastVerifiedAt.toLocaleDateString("en-IN")}.` : "Last-verified date not available."} ${college.source ? `Source: ${college.source.name}.` : "Source information is not yet available."}`}</p>
    </article><aside className="surface detail-sidebar"><h2 style={{ margin: 0, color: "#173b66", fontSize: 16 }}>Next steps</h2><div className="detail-list"><div><span>Programs listed</span><strong>{college.programs.length || "Not available"}</strong></div><div><span>Verified fees</span><strong>{college.feeRecords.length ? "Available" : "Not available"}</strong></div><div><span>Admission details</span><strong>{college.officialAdmissionUrl ? "Official link" : "Not available"}</strong></div></div><div style={{ display: "grid", gap: 9, marginTop: 18 }}><SaveCollegeButton collegeId={college.id} /><Link className="btn-secondary" href={`/compare?colleges=${encodeURIComponent(college.slug)}`}>Add to compare</Link><Link className="btn-secondary" href={`/contact?college=${encodeURIComponent(college.slug)}`}>Ask a counsellor</Link>{college.officialWebsite && <a className="btn-secondary" href={college.officialWebsite} target="_blank" rel="noreferrer">Official website <ArrowUpRight size={14} /></a>}{college.officialAdmissionUrl && <a className="btn-primary" href={college.officialAdmissionUrl} target="_blank" rel="noreferrer">Official admissions <ArrowUpRight size={14} /></a>}</div><p className="data-note" style={{ marginTop: 14 }}>Admission likelihood is not assessed. Confirm current details with official institutional sources.</p></aside></div>
  </>;
}