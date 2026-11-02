import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const states = await prisma.campus.findMany({ where: { college: { verificationStatus: { in: ["VERIFIED", "DEMO"] } } }, distinct: ["state"], orderBy: { state: "asc" }, select: { state: true } });
    return NextResponse.json({ states: states.map(item => item.state) });
  } catch {
    return NextResponse.json({ error: "Location data is temporarily unavailable." }, { status: 503 });
  }
}