import type { Metadata } from "next";
import { BookOpenCheck } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admission guides" };
const guideSelect = { id: true, slug: true, title: true, summary: true, content: true, category: true, publishedAt: true } satisfies Prisma.AdmissionGuideSelect;
type Guide = Prisma.AdmissionGuideGetPayload<{ select: typeof guideSelect }>;
export default async function AdmissionGuidesPage() {
  let guides: Guide[] = [];
  let unavailable = false;
  try { guides = await prisma.admissionGuide.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, select: guideSelect }); } catch { unavailable = true; }
  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">THE FIELD NOTES</span><h1>Useful context for decisions.</h1><p>Guidance and checklists to help you ask better questions as you explore.</p></div></section><section className="page-container section-pad">{guides.length ? <div className="guide-list">{guides.map(guide => <article className="surface guide-record" key={guide.id}><BookOpenCheck size={19} color="#0d9488" /><div><span className="eyebrow">{guide.category}</span><h2>{guide.title}</h2><p>{guide.summary}</p><div className="guide-body">{guide.content.split("\n").filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><small className="data-note">{guide.publishedAt ? `Updated ${guide.publishedAt.toLocaleDateString("en-IN")}` : "General information · check official sources for current requirements."}</small></div></article>)}</div> : <div className={unavailable ? "error-state" : "empty-state"}><BookOpenCheck size={23} color="#0d9488" /><h2>{unavailable ? "Guides are unavailable" : "Guides are being prepared"}</h2><p>Published guidance will appear here after review.</p></div>}</section></>;
}