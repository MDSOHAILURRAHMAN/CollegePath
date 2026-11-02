import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [database, verifiedColleges, verifiedPrograms, verifiedFeeSchedules] = await Promise.all([
      prisma.$queryRaw<Array<{ ready: number }>>`SELECT 1 AS ready`,
      prisma.college.count({ where: { verificationStatus: "VERIFIED", demoRecord: false } }),
      prisma.program.count({ where: { verificationStatus: "VERIFIED", academicYear: "2026-27", college: { demoRecord: false } } }),
      prisma.feeSchedule.count({ where: { verificationStatus: "VERIFIED", academicYear: "2026-27", college: { demoRecord: false } } }),
    ]);
    const paymentsConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET);
    return NextResponse.json({
      status: "ready",
      database: database[0]?.ready === 1 ? "ready" : "unavailable",
      email: env.RESEND_API_KEY && env.EMAIL_FROM ? "configured" : "disabled",
      payments: paymentsConfigured ? "configured" : "disabled",
      catalog: { verifiedColleges, joSaa2026Programs: verifiedPrograms, joSaa2026FeeSchedules: verifiedFeeSchedules },
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "unavailable", database: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
