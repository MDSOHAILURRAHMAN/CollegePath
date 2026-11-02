import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recommendationSchema } from "@/lib/schemas";
import { recommendColleges } from "@/lib/recommendations";

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
        id: true, slug: true, name: true, institutionType: true, officialAdmissionUrl: true, demoRecord: true, verificationStatus: true,
        campuses: { select: { state: true } },
        programs: { where: { verificationStatus: "VERIFIED", degreeLevel: parsed.data.degreeLevel }, select: { degreeLevel: true, categories: { include: { category: { select: { slug: true, name: true } } } } } },
        feeRecords: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" }, take: 1, select: { tuitionInr: true } },
      },
    });
    const recommendations = recommendColleges(parsed.data, rows.map(college => ({ ...college, annualTuitionInr: college.feeRecords[0]?.tuitionInr?.toNumber() ?? null })));
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user.role === "STUDENT") {
      await prisma.recommendationRun.create({ data: {
        userId: session.user.id,
        inputs: parsed.data as Prisma.InputJsonValue,
        limitations: recommendations.length ? ["Admission likelihood not assessed without matching historical admission evidence."] : ["No verified programs matched the submitted preferences."],
        items: { create: recommendations.map(item => ({ collegeId: item.collegeId, band: item.band, reasons: item.reasons, dataLimitations: item.limitations, ...(item.estimatedAnnualTuitionInr !== null ? { estimatedAnnualTuitionInr: new Prisma.Decimal(item.estimatedAnnualTuitionInr) } : {}) })) },
      } });
    }
    return NextResponse.json({ recommendations, disclaimer: "Potential options only. Admission likelihood is not assessed and admission is never guaranteed." });
  } catch {
    return NextResponse.json({ error: "Verified recommendation data is temporarily unavailable." }, { status: 503 });
  }
}