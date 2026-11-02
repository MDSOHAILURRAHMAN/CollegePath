import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const comparisonSchema = z.object({ colleges: z.array(z.string().min(1).max(100)).min(2).max(3) });

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to access saved comparisons." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  try {
    const comparisons = await prisma.savedComparison.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, include: { items: { orderBy: { position: "asc" }, select: { college: { select: { id: true, slug: true, name: true, demoRecord: true } } } } } });
    return NextResponse.json({ comparisons });
  } catch { return NextResponse.json({ error: "Saved comparisons are unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to save a comparison." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  const parsed = comparisonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Set(parsed.data?.colleges).size !== parsed.data?.colleges.length) return NextResponse.json({ error: "Select two or three different colleges." }, { status: 400 });
  try {
    const records = await prisma.college.findMany({ where: { slug: { in: parsed.data.colleges }, verificationStatus: { in: ["VERIFIED", "DEMO"] } }, select: { id: true, slug: true } });
    if (records.length !== parsed.data.colleges.length) return NextResponse.json({ error: "A selected college is no longer available." }, { status: 404 });
    const ordered = parsed.data.colleges.map((slug, position) => ({ collegeId: records.find(record => record.slug === slug)!.id, position }));
    const comparison = await prisma.savedComparison.create({ data: { userId: session.user.id, items: { create: ordered } }, select: { id: true, shareId: true } });
    return NextResponse.json({ comparison }, { status: 201 });
  } catch { return NextResponse.json({ error: "Comparison could not be saved." }, { status: 503 }); }
}