import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";
import { requireStudent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CollegeCard } from "@/components/college-card";
import { CollegeSearch } from "@/components/college-search";

const savedCollegeInclude = { college: { include: { campuses: { select: { id: true, name: true, city: true, state: true, hostelAvailable: true, hostelLastVerifiedAt: true } }, programs: { where: { verificationStatus: { in: ["VERIFIED", "DEMO"] as const } }, select: { id: true, name: true, degreeLevel: true, academicYear: true, categories: { include: { category: { select: { slug: true, name: true } } } } } }, feeRecords: { where: { verificationStatus: "VERIFIED" as const }, orderBy: { academicYear: "desc" as const }, select: { tuitionInr: true, compulsoryFeesInr: true, academicYear: true } }, source: { select: { name: true, url: true, verificationStatus: true } } } } } satisfies Prisma.SavedCollegeInclude;
type SavedCollegeRow = Prisma.SavedCollegeGetPayload<{ include: typeof savedCollegeInclude }>;

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved colleges", robots: { index: false, follow: false } };
export default async function SavedCollegesPage() {
  const session = await requireStudent();
  let saved: SavedCollegeRow[] = [];
  let unavailable = false;
  try {
    saved = await prisma.savedCollege.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: savedCollegeInclude,
    });
  } catch { unavailable = true; }
  return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">YOUR SHORTLIST</span><h1>Saved colleges</h1><p>Only you can see this list.</p></div><Link className="btn-secondary" href="/dashboard">Back to dashboard</Link></div>{unavailable ? <div className="error-state"><h2>Your saved list is unavailable</h2><p>Check the database connection and try again.</p></div> : saved.length ? <div className="college-grid">{saved.map(item => <CollegeCard key={item.collegeId} college={{ ...item.college, feeRecords: item.college.feeRecords.map(fee => ({ tuitionInr: fee.tuitionInr?.toNumber() ?? null, compulsoryFeesInr: fee.compulsoryFeesInr?.toNumber() ?? null, academicYear: fee.academicYear })) }} saved />)}</div> : <div className="empty-state"><h2>Your shortlist starts here</h2><p>Save a college from the directory to compare it later.</p><CollegeSearch compact /></div>}</section>;
}
