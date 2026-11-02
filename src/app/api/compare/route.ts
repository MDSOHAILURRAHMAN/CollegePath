import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const querySchema = z.object({ colleges: z.array(z.string().min(1).max(100)).min(1).max(3) });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ colleges: url.searchParams.getAll("colleges") });
  if (!parsed.success || new Set(parsed.data?.colleges).size !== parsed.data?.colleges.length) return NextResponse.json({ error: "Select up to three different colleges." }, { status: 400 });
  try {
    const colleges = await prisma.college.findMany({ where: { slug: { in: parsed.data.colleges }, verificationStatus: { in: ["VERIFIED", "DEMO"] } }, select: { id: true, slug: true, name: true, institutionType: true, demoRecord: true, campuses: { select: { city: true, state: true } }, programs: { where: { verificationStatus: { in: ["VERIFIED", "DEMO"] } }, select: { name: true, degreeLevel: true, categories: { include: { category: { select: { name: true } } } } } }, feeRecords: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" }, select: { tuitionInr: true, academicYear: true } }, rankings: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" }, select: { rankingBody: true, rank: true, academicYear: true } } } });
    const ordered = parsed.data.colleges.map(slug => colleges.find(college => college.slug === slug)).filter((college): college is (typeof colleges)[number] => Boolean(college));
    return NextResponse.json({ colleges: ordered });
  } catch { return NextResponse.json({ error: "Comparison data is temporarily unavailable." }, { status: 503 }); }
}