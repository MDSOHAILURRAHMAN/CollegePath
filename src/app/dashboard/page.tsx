import Link from "next/link";
import type { Metadata } from "next";
import { Bookmark, BookOpenCheck, CalendarClock, GitCompareArrows, UserRound } from "lucide-react";
import { requireStudent } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DeleteComparisonButton } from "@/components/delete-comparison-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Student dashboard", robots: { index: false, follow: false } };
export default async function StudentDashboardPage() {
  const session = await requireStudent();
  let data: { saved: { college: { id: string; slug: string; name: string; demoRecord: boolean; campuses: { city: string; state: string }[] } }[]; comparisons: { id: string; shareId: string; title: string | null; items: { college: { name: string; slug: string } }[] }[]; bookings: { id: string; status: string; service: { name: string }; createdAt: Date }[]; profile: { intendedCourse: string | null } | null } | null = null;
  try {
    const [saved, comparisons, bookings, profile] = await Promise.all([
      prisma.savedCollege.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 6, select: { college: { select: { id: true, slug: true, name: true, demoRecord: true, campuses: { select: { city: true, state: true } } } } } }),
      prisma.savedComparison.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 4, select: { id: true, shareId: true, title: true, items: { orderBy: { position: "asc" }, select: { college: { select: { name: true, slug: true } } } } } }),
      prisma.booking.findMany({ where: { studentId: session.user.id }, orderBy: { createdAt: "desc" }, take: 4, select: { id: true, status: true, createdAt: true, service: { select: { name: true } } } }),
      prisma.studentProfile.findUnique({ where: { userId: session.user.id }, select: { intendedCourse: true } }),
    ]);
    data = { saved, comparisons, bookings, profile };
  } catch {}

  return <section className="page-container protected-page"><div className="dashboard-header"><div><span className="eyebrow">YOUR PRIVATE ACCOUNT</span><h1>Welcome, {session.user.name.split(" ")[0]}.</h1><p>Your college search, saved in one place.</p></div><Link className="btn-secondary" href="/profile"><UserRound size={15} /> Edit profile</Link></div>{!data && <div className="error-state"><h2>Account data is unavailable</h2><p>Check the database connection and try again.</p></div>}{data && <><div className="dashboard-grid"><aside className="surface dashboard-sidebar" aria-label="Student navigation"><Link href="/dashboard" aria-current="page"><UserRound size={14} /> Overview</Link><Link href="/saved-colleges"><Bookmark size={14} /> Saved colleges</Link><Link href="/recommendations"><BookOpenCheck size={14} /> Recommendations</Link><Link href="/compare"><GitCompareArrows size={14} /> Compare colleges</Link><Link href="/bookings"><CalendarClock size={14} /> Counselling</Link><Link href="/profile"><UserRound size={14} /> Profile</Link></aside><div style={{ display: "grid", gap: 15 }}>
      <section className="surface dashboard-content"><div className="account-section-head"><div><span className="eyebrow">YOUR SHORTLIST</span><h2>Saved colleges</h2></div><Link className="text-action" href="/saved-colleges">View all →</Link></div>{data.saved.length ? <div className="dashboard-card-list">{data.saved.map(item => <article className="dashboard-record" key={item.college.id}><div><strong><Link href={`/colleges/${item.college.slug}`}>{item.college.name}</Link></strong><small>{item.college.campuses.map(campus => `${campus.city}, ${campus.state}`).join(" · ") || "Location not available"}{item.college.demoRecord ? " · Fictional demo record" : ""}</small></div><Bookmark size={15} color="#0d9488" /></article>)}</div> : <p className="empty-inline">No saved colleges yet. <Link href="/colleges">Explore the directory.</Link></p>}</section>
      <section className="surface dashboard-content"><div className="account-section-head"><div><span className="eyebrow">SAVED COMPARISONS</span><h2>Compare with context</h2></div><Link className="text-action" href="/compare">Start a comparison →</Link></div>{data.comparisons.length ? <div className="dashboard-card-list">{data.comparisons.map(item => <article className="dashboard-record" key={item.id}><div><strong>{item.title ?? item.items.map(entry => entry.college.name).join(" vs ")}</strong><small>{item.items.map(entry => entry.college.name).join(" · ")}</small></div><Link className="btn-secondary" href={`/compare/${item.shareId}`}>Open</Link><DeleteComparisonButton comparisonId={item.id} /></article>)}</div> : <p className="empty-inline">Saved comparisons will appear here.</p>}</section>
      <section className="surface dashboard-content"><div className="account-section-head"><div><span className="eyebrow">COUNSELLING</span><h2>Session requests</h2></div><Link className="text-action" href="/guidance">Explore guidance →</Link></div>{data.bookings.length ? <div className="dashboard-card-list">{data.bookings.map(booking => <article className="dashboard-record" key={booking.id}><div><strong>{booking.service.name}</strong><small>{booking.status.replaceAll("_", " ")} · Requested {booking.createdAt.toLocaleDateString("en-IN")}</small></div></article>)}</div> : <p className="empty-inline">There are no bookings yet. Services appear when the counselling team opens availability.</p>}</section>
    </div></div></>}</section>;
}
