import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { studentProfileSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStudent(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { response: NextResponse.json({ error: "Sign in to access your profile." }, { status: 401 }) };
  if (session.user.role !== "STUDENT") return { response: NextResponse.json({ error: "Student access is required." }, { status: 403 }) };
  return { session };
}

export async function GET(request: Request) {
  const access = await getStudent(request);
  if (access.response) return access.response;
  try {
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({ where: { id: access.session.user.id }, select: { name: true, email: true } }),
      prisma.studentProfile.findUnique({ where: { userId: access.session.user.id } }),
    ]);
    return NextResponse.json({ profile: { name: user?.name ?? "", email: user?.email ?? "", phone: profile?.phone ?? "", currentEducation: profile?.currentEducation ?? "", intendedCourse: profile?.intendedCourse ?? "", preferredStates: profile?.preferredStates ?? [], annualBudgetInr: profile?.annualBudgetInr?.toNumber() ?? null, accommodationNeeded: profile?.accommodationNeeded ?? null, careerInterests: profile?.careerInterests ?? [], marketingConsent: profile?.marketingConsent ?? false } });
  } catch {
    return NextResponse.json({ error: "Your profile is temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const access = await getStudent(request);
  if (access.response) return access.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = studentProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check your profile details.", issues: parsed.error.flatten() }, { status: 400 });
  const { name, ...profile } = parsed.data;
  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: access.session.user.id }, data: { name } }),
      prisma.studentProfile.upsert({
        where: { userId: access.session.user.id },
        update: { ...profile, annualBudgetInr: profile.annualBudgetInr === null || profile.annualBudgetInr === undefined ? null : new Prisma.Decimal(profile.annualBudgetInr) },
        create: { userId: access.session.user.id, ...profile, annualBudgetInr: profile.annualBudgetInr === null || profile.annualBudgetInr === undefined ? null : new Prisma.Decimal(profile.annualBudgetInr) },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Your profile could not be saved." }, { status: 503 });
  }
}