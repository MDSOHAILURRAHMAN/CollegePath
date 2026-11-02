import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recommendationSchema } from "@/lib/schemas";
import { recommendColleges } from "@/lib/recommendations";
import { statesInOfficialAddress } from "@/lib/catalog-options";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to view saved recommendations." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  try {
    const runs = await prisma.recommendationRun.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { items: { include: { college: { select: { slug: true, name: true, demoRecord: true } } } } } });
    return NextResponse.json({ runs });
  } catch { return NextResponse.json({ error: "Saved recommendations are unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const parsed = recommendationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your recommendation preferences.", issues: parsed.error.flatten() }, { status: 400 });
  try {
    const programFilter = {
      verificationStatus: "VERIFIED" as const,
      degreeLevel: parsed.data.degreeLevel,
      ...(parsed.data.categorySlug ? { categories: { some: { category: { slug: parsed.data.categorySlug } } } } : {}),
    };
    const rows = await prisma.college.findMany({
      where: { verificationStatus: "VERIFIED", demoRecord: false, programs: { some: programFilter } },
      take: 250,
      select: {
        id: true, slug: true, name: true, institutionType: true, officialAdmissionUrl: true, officialState: true, officialAddress: true, demoRecord: true, verificationStatus: true,
        campuses: { select: { state: true } },
        programs: { where: { verificationStatus: "VERIFIED", degreeLevel: parsed.data.degreeLevel }, select: { degreeLevel: true, categories: { include: { category: { select: { slug: true, name: true } } } } } },
        feeRecords: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" }, take: 1, select: { tuitionInr: true } },
      },
    });
    let recommendations = recommendColleges(parsed.data, rows.map(college => ({ ...college, campuses: [...college.campuses, ...(college.officialState ? [{ state: college.officialState }] : statesInOfficialAddress(college.officialAddress).map(state => ({ state })))], annualTuitionInr: college.feeRecords[0]?.tuitionInr?.toNumber() ?? null })));
    let rankingFallback = false;
    if (recommendations.length === 0) {
      const rankedColleges = await prisma.college.findMany({
        where: {
          verificationStatus: "VERIFIED",
          demoRecord: false,
          rankings: { some: { verificationStatus: "VERIFIED", academicYear: "2025", rankingBody: "NIRF India Rankings" } },
          ...(parsed.data.preferredStates.length ? { OR: [
            { campuses: { some: { state: { in: parsed.data.preferredStates, mode: "insensitive" } } } },
            { officialState: { in: parsed.data.preferredStates, mode: "insensitive" } },
          ] } : {}),
        },
        take: 250,
        select: {
          id: true,
          slug: true,
          name: true,
          officialAdmissionUrl: true,
          rankings: {
            where: { verificationStatus: "VERIFIED", academicYear: "2025", rankingBody: "NIRF India Rankings" },
            orderBy: { rank: "asc" },
            select: { category: true, rank: true, academicYear: true },
          },
        },
      });
      recommendations = rankedColleges
        .filter(college => college.rankings.some(ranking => ranking.rank !== null))
        .map(college => {
          const ranking = [...college.rankings].sort((left, right) => {
            if (left.category === "Universities" && right.category !== "Universities") return -1;
            if (right.category === "Universities" && left.category !== "Universities") return 1;
            return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
          })[0];
          return {
            collegeId: college.id,
            slug: college.slug,
            name: college.name,
            band: "POTENTIAL" as const,
            reasons: [`Listed in NIRF India Rankings ${ranking.academicYear}${ranking.category ? ` ${ranking.category}` : ""}, rank ${ranking.rank}`],
            estimatedAnnualTuitionInr: null,
            officialAdmissionUrl: college.officialAdmissionUrl,
            limitations: [
              "Exploration suggestion based on ranking and location only; course availability for your selected study level or category is not verified.",
              "Tuition, institution type, eligibility, and admission likelihood are not assessed because verified records are not available.",
            ],
          };
        })
        .slice(0, 20);
      rankingFallback = recommendations.length > 0;
    }
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user.role === "STUDENT") {
      await prisma.recommendationRun.create({ data: {
        userId: session.user.id,
        inputs: parsed.data as Prisma.InputJsonValue,
        limitations: rankingFallback
          ? ["No verified program-based options were available for this request. The exploration suggestions use NIRF 2025 ranking and preferred state only; course, fee, eligibility, and admission fit are not verified."]
          : recommendations.length
            ? ["Admission likelihood not assessed without matching historical admission evidence."]
            : ["No verified programs or ranked colleges matched the submitted preferences."],
        items: { create: recommendations.map(item => ({ collegeId: item.collegeId, band: item.band, reasons: item.reasons, dataLimitations: item.limitations, ...(item.estimatedAnnualTuitionInr !== null ? { estimatedAnnualTuitionInr: new Prisma.Decimal(item.estimatedAnnualTuitionInr) } : {}) })) },
      } });
    }
    return NextResponse.json({
      recommendations,
      rankingFallback,
      disclaimer: rankingFallback
        ? "No verified program-based options were available for this request. These exploration suggestions use NIRF 2025 rankings and your preferred state only; they do not confirm course availability, fees, eligibility, or admission likelihood. Check each institution’s official site."
        : "Potential options only. Admission likelihood is not assessed and admission is never guaranteed.",
    });
  } catch {
    return NextResponse.json({ error: "Verified recommendation data is temporarily unavailable." }, { status: 503 });
  }
}
