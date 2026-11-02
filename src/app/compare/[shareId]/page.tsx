import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shared comparison", robots: { index: false, follow: false } };
export default async function SharedComparisonPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  let comparison;
  try {
    comparison = await prisma.savedComparison.findUnique({
      where: { shareId },
      select: {
        items: {
          orderBy: { position: "asc" },
          select: {
            college: {
              select: {
                slug: true,
                name: true,
                demoRecord: true,
                verificationStatus: true,
                institutionType: true,
                campuses: { select: { city: true, state: true } },
                programs: {
                  where: { verificationStatus: { in: ["VERIFIED", "DEMO"] } },
                  select: { name: true, degreeLevel: true },
                },
                feeRecords: {
                  where: { verificationStatus: "VERIFIED" },
                  orderBy: { academicYear: "desc" },
                  take: 1,
                  select: { tuitionInr: true, academicYear: true },
                },
              },
            },
          },
        },
      },
    });
  } catch { return <section className="page-container section-pad"><div className="error-state"><h1>Comparison is unavailable</h1><p>Connect the database and try again.</p></div></section>; }
  if (!comparison) notFound();
  if (!comparison.items.length) return notFound();
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">SHARED COMPARISON</span><h1>College options, side by side.</h1><p>This share link includes public college information only. It does not expose student profile or account details.</p></div></section><section className="page-container section-pad"><div className="compare-scroll"><table className="compare-table"><thead><tr><th>Information</th>{comparison.items.map(item => <th key={item.college.slug}><Link href={`/colleges/${item.college.slug}`}>{item.college.name}</Link>{item.college.demoRecord && <span className="status-demo" style={{ display: "flex", width: "fit-content", marginTop: 7 }}>Fictional demo</span>}</th>)}</tr></thead><tbody><tr><td>Location</td>{comparison.items.map(item => <td key={item.college.slug}>{item.college.campuses.map(campus => `${campus.city}, ${campus.state}`).join(" · ") || "Not available"}</td>)}</tr><tr><td>Institution type</td>{comparison.items.map(item => <td key={item.college.slug}>{item.college.institutionType.replaceAll("_", " ")}</td>)}</tr><tr><td>Programs</td>{comparison.items.map(item => <td key={item.college.slug}>{item.college.programs.map(program => `${program.name} (${program.degreeLevel.toLowerCase()})`).join(" · ") || "Not available"}</td>)}</tr><tr><td>Verified annual tuition</td>{comparison.items.map(item => { const fee = item.college.feeRecords[0]; return <td key={item.college.slug}>{fee?.tuitionInr ? `${money.format(Number(fee.tuitionInr))} · ${fee.academicYear}` : "Not available"}</td>; })}</tr></tbody></table></div><p className="data-note" style={{ marginTop: 13 }}>Only verified financial data is displayed. No universal “best” college is inferred.</p></section></>;
}