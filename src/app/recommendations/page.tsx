import type { Metadata } from "next";
import { requireStudent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RecommendationsForm } from "@/components/recommendations-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Potential college options", robots: { index: false, follow: false } };
export default async function RecommendationsPage() {
  await requireStudent();
  let categories: { slug: string; name: string }[] = [];
  let unavailable = false;
  try { categories = await prisma.courseCategory.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }); } catch { unavailable = true; }
  return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">EXPLAINABLE DISCOVERY</span><h1>Potential options</h1><p>Recommendations use verified program records and your declared preferences. Admission likelihood is not assessed.</p></div></div>{unavailable ? <div className="error-state"><h2>Recommendation data is unavailable</h2><p>Connect PostgreSQL and try again.</p></div> : <RecommendationsForm categories={categories} />}</section>;
}