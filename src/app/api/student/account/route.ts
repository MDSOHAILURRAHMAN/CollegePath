import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function student(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { response: NextResponse.json({ error: "Sign in to manage your account data." }, { status: 401 }) };
  if (session.user.role !== "STUDENT") return { response: NextResponse.json({ error: "Student access is required." }, { status: 403 }) };
  return { session };
}

export async function GET(request: Request) {
  const access = await student(request);
  if (access.response) return access.response;
  try {
    const userId = access.session.user.id;
    const [user, profile, savedColleges, comparisons, recommendations, bookings, enquiries, consents] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
      prisma.studentProfile.findUnique({ where: { userId } }),
      prisma.savedCollege.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { createdAt: true, college: { select: { name: true, slug: true, campuses: { select: { city: true, state: true } } } } } }),
      prisma.savedComparison.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { title: true, createdAt: true, items: { orderBy: { position: "asc" }, select: { position: true, college: { select: { name: true, slug: true } }, program: { select: { name: true, degreeLevel: true } } } } } }),
      prisma.recommendationRun.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { inputs: true, limitations: true, createdAt: true, items: { select: { band: true, reasons: true, dataLimitations: true, estimatedAnnualTuitionInr: true, college: { select: { name: true, slug: true } } } } } }),
      prisma.booking.findMany({ where: { studentId: userId }, orderBy: { createdAt: "asc" }, select: { status: true, createdAt: true, service: { select: { name: true, durationMinutes: true } }, availability: { select: { startsAt: true, endsAt: true } }, payment: { select: { amountInr: true, currency: true, status: true } } } }),
      prisma.lead.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { name: true, email: true, phone: true, admissionYear: true, message: true, marketingConsent: true, status: true, createdAt: true } }),
      prisma.consentRecord.findMany({ where: { userId }, orderBy: { recordedAt: "asc" }, select: { consentType: true, granted: true, version: true, recordedAt: true, withdrawnAt: true } }),
    ]);
    if (!user) return NextResponse.json({ error: "Account was not found." }, { status: 404 });
    const data = { exportedAt: new Date().toISOString(), account: user, profile, savedColleges, comparisons, recommendationRuns: recommendations, bookings, enquiries, consentHistory: consents };
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": "attachment; filename=collegepath-account-data.json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Account data could not be exported right now." }, { status: 503 });
  }
}

const deletionSchema = z.object({ confirmation: z.literal("DELETE MY ACCOUNT") });

export async function DELETE(request: Request) {
  const access = await student(request);
  if (access.response) return access.response;
  const origin = request.headers.get("origin");
  const allowedOrigins = [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL, ...(env.NODE_ENV === "development" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : [])].filter((value): value is string => Boolean(value));
  if (!origin || !allowedOrigins.includes(origin)) return NextResponse.json({ error: "Account deletion must be requested from this site." }, { status: 403 });
  const parsed = deletionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Type DELETE MY ACCOUNT to confirm account deletion." }, { status: 400 });

  const userId = access.session.user.id;
  try {
    await prisma.$transaction(async transaction => {
      const user = await transaction.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
      if (!user || user.role !== "STUDENT") throw new Error("STUDENT_NOT_FOUND");

      // Keep bookings and payment accounting rows for financial records while removing student identity and private notes.
      await transaction.booking.updateMany({ where: { studentId: userId }, data: { studentNotes: null, privateNotes: null } });
      await transaction.lead.deleteMany({ where: { userId } });
      await transaction.studentProfile.deleteMany({ where: { userId } });
      await transaction.savedCollege.deleteMany({ where: { userId } });
      await transaction.savedComparison.deleteMany({ where: { userId } });
      await transaction.recommendationRun.deleteMany({ where: { userId } });
      await transaction.notification.deleteMany({ where: { userId } });
      await transaction.consentRecord.deleteMany({ where: { userId } });
      await transaction.verification.deleteMany({ where: { identifier: user.email } });
      await transaction.account.deleteMany({ where: { userId } });
      await transaction.session.deleteMany({ where: { userId } });
      await transaction.user.update({ where: { id: userId }, data: { name: "Deleted student", email: `deleted-${userId}@deleted.invalid`, emailVerified: false, image: null } });
      await transaction.auditLog.create({ data: { actorId: userId, action: "STUDENT_ACCOUNT_ERASED", entityType: "User", entityId: userId } });
    });
    return NextResponse.json({ ok: true, retainedFinancialRecords: true });
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_NOT_FOUND") return NextResponse.json({ error: "Student account was not found." }, { status: 404 });
    return NextResponse.json({ error: "Account could not be deleted right now. Please contact support." }, { status: 503 });
  }
}
