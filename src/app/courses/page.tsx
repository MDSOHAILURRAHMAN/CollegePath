import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let categories: { slug: string; name: string; description: string | null; programs: { program: { id: string } }[] }[] = [];
  let available = true;
  try {
    categories = await prisma.courseCategory.findMany({
      where: { programs: { some: { program: { verificationStatus: { in: ["VERIFIED", "DEMO"] }, college: { verificationStatus: { in: ["VERIFIED", "DEMO"] } } } } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true, description: true, programs: { where: { program: { verificationStatus: { in: ["VERIFIED", "DEMO"] } } }, select: { program: { select: { id: true } } } } },
    });
  } catch { available = false; }

  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">COURSE DISCOVERY</span><h1>Explore a direction.</h1><p>Browse available course categories and see which programs are listed in the directory.</p></div></section><section className="page-container section-pad">{categories.length ? <div className="resource-grid">{categories.map(category => <Link className="resource-card" href={`/colleges?category=${encodeURIComponent(category.slug)}`} key={category.slug}><BookOpen size={19} color="#0d9488" /><h2 style={{ margin: "13px 0 6px", fontSize: 14 }}>{category.name}</h2><p>{category.description ?? "Program details depend on current, verified college records."}</p><span className="data-note" style={{ display: "block", marginTop: 12 }}>{category.programs.length} listed programs <ChevronRight size={13} style={{ verticalAlign: "-3px" }} /></span></Link>)}</div> : <div className={available ? "empty-state" : "error-state"}><BookOpen size={24} color="#0d9488" /><h3>{available ? "Course categories are being prepared" : "Course data is unavailable"}</h3><p>{available ? "Categories appear when programs are reviewed and added." : "Connect PostgreSQL to browse course records."}</p><Link className="btn-secondary" href="/colleges">Explore colleges</Link></div>}</section></>;
}