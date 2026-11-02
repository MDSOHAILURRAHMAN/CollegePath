import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleHelp, ExternalLink } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scholarships" };
const scholarshipInclude = { college: { select: { name: true, slug: true } }, source: { select: { name: true, url: true } } } satisfies Prisma.ScholarshipInclude;
type Scholarship = Prisma.ScholarshipGetPayload<{ include: typeof scholarshipInclude }>;
const officialResources = [
  { title: "Search current scholarship schemes", description: "The National Scholarship Portal lists central and state schemes for the current academic cycle.", href: "https://scholarships.gov.in/All-Scholarships" },
  { title: "Check scheme eligibility", description: "Use the official portal’s eligibility tool and confirm the scheme rules before applying.", href: "https://scholarships.gov.in/scholarshipEligibility/" },
  { title: "Student portal and application status", description: "Open the official student service, registration, and application information.", href: "https://scholarships.gov.in/Students" },
];

export default async function ScholarshipsPage() {
  let items: Scholarship[] = [];
  let unavailable = false;
  try { items = await prisma.scholarship.findMany({ where: { verificationStatus: "VERIFIED" }, orderBy: { name: "asc" }, take: 100, include: scholarshipInclude }); } catch { unavailable = true; }
  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">FINANCIAL AID</span><h1>Scholarships, with sources.</h1><p>Review verified listings and official scheme portals. Eligibility, award details, and application dates can change each year.</p></div></section><section className="page-container section-pad">
    {items.length ? <div className="scholarship-list">{items.map(item => <article className="surface scholarship-card" key={item.id}><span className="status-verified"><BadgeCheck size={12} /> Verified listing</span><h2>{item.name}</h2><p>{item.description}</p>{item.eligibility && <p><strong>Eligibility:</strong> {item.eligibility}</p>}{item.academicYear && <p className="data-note">Academic year: {item.academicYear}</p>}{item.college && <p className="data-note">For {item.college.name} · <Link href={`/colleges/${item.college.slug}`}>View college</Link></p>}{item.source?.url ? <a className="text-action" href={item.source.url} target="_blank" rel="noreferrer">Source details <ExternalLink size={13} /></a> : <p className="data-note">Source URL not available.</p>}</article>)}</div> : <div className={unavailable ? "error-state" : "empty-state"}><CircleHelp size={24} color="#0d9488" /><h2>{unavailable ? "Scholarship data is unavailable" : "No verified scholarship listings yet"}</h2><p>We don’t invent scholarship values or deadlines. Use the official portals below for current schemes.</p></div>}
    <div className="section-heading" style={{ marginTop: 34 }}><div><span className="eyebrow">OFFICIAL SOURCES</span><h2>Find current schemes</h2></div></div><div className="resource-grid">{officialResources.map(resource => <article className="resource-card" key={resource.href}><ExternalLink size={18} color="#0d9488" /><h3>{resource.title}</h3><p>{resource.description}</p><a className="text-action" href={resource.href} target="_blank" rel="noreferrer">Open official portal <ExternalLink size={13} /></a></article>)}</div>
    <p className="notice" style={{ marginTop: 18 }}>CollegePath does not determine eligibility or guarantee an award. Apply only through the official scheme portal and check its current rules.</p>
  </section></>;
}
