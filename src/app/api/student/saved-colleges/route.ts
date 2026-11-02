import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";
const saveSchema = z.object({ collegeId: z.string().min(1).max(80) });

async function studentSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { response: NextResponse.json({ error: "Sign in to access your shortlist." }, { status: 401 }) };
  if (session.user.role !== "STUDENT") return { response: NextResponse.json({ error: "This feature is for student accounts." }, { status: 403 }) };
  return { session };
}

export async function GET(request: Request) {
  const access = await studentSession(request);
  if (access.response) return access.response;
  try {
    const saved = await prisma.savedCollege.findMany({
      where: { userId: access.session.user.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, college: { select: { id: true, slug: true, name: true, demoRecord: true, verificationStatus: true, campuses: { select: { city: true, state: true } }, feeRecords: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" }, take: 1, select: { tuitionInr: true, academicYear: true } } } } },
    });
    return NextResponse.json({ saved: saved.map(item => ({ ...item.college, savedAt: item.createdAt, tuitionInr: item.college.feeRecords[0]?.tuitionInr?.toString() ?? null })) });
  } catch {
    return NextResponse.json({ error: "Your shortlist is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = await studentSession(request);
  if (access.response) return access.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Select a valid college." }, { status: 400 });
  try {
    const college = await prisma.college.findFirst({ where: { id: parsed.data.collegeId, verificationStatus: { in: ["VERIFIED", "DEMO"] } }, select: { id: true } });
    if (!college) return NextResponse.json({ error: "College not found." }, { status: 404 });
    await prisma.savedCollege.upsert({ where: { userId_collegeId: { userId: access.session.user.id, collegeId: college.id } }, update: {}, create: { userId: access.session.user.id, collegeId: college.id } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not update your shortlist." }, { status: 503 });
  }
}