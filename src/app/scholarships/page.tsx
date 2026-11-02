import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleHelp } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scholarships" };
const scholarshipInclude = { college: { select: { name: true, slug: true } }, source: { select: { name: true, url: true } } } satisfies Prisma.ScholarshipInclude;
type Scholarship = Prisma.ScholarshipGetPayload<{ include: typeof scholarshipInclude }>;
export default async function ScholarshipsPage() {
  let items: Scholarship[] = [];
  let unavailable = false;
  try { items = await prisma.scholarship.findMany({ where: { verificationStatus: "VERIFIED" }, orderBy: { name: "asc" }, take: 100, include: scholarshipInclude }); } catch { unavailable = true; }
  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">FINANCIAL AID</span><h1>Scholarships, with sources.</h1><p>Review eligibility and application details from records marked verified. Confirm current deadlines with the official provider.</p></div></section><section className="page-container section-pad">{items.length ? <div className="scholarship-list">{items.map(item => <article className="surface scholarship-card" key={item.id}><span className="status-verified"><BadgeCheck size={12} /> Verified listing</span><h2>{item.name}</h2><p>{item.description}</p>{item.eligibility && <p><strong>Eligibility:</strong> {item.eligibility}</p>}{item.academicYear && <p className="data-note">Academic year: {item.academicYear}</p>}{item.college && <p className="data-note">For {item.college.name} · <Link href={`/colleges/${item.college.slug}`}>View college</Link></p>}{item.source?.url ? <a className="text-action" href={item.source.url} target="_blank" rel="noreferrer">Official/source details ↗</a> : <p className="data-note">Source URL not available.</p>}</article>)}</div> : <div className={unavailable ? "error-state" : "empty-state"}><CircleHelp size={24} color="#0d9488" /><h2>{unavailable ? "Scholarship data is unavailable" : "No verified scholarships listed yet"}</h2><p>We don’t invent scholarship values or deadlines. Listings will appear after source review.</p></div>}</section></>;
}