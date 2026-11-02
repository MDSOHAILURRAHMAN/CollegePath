import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.courseCategory.findMany({
      where: { programs: { some: { program: { verificationStatus: { in: ["VERIFIED", "DEMO"] } } } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true, description: true, _count: { select: { programs: true } } },
    });
    return NextResponse.json({ courses: categories });
  } catch {
    return NextResponse.json({ error: "Course data is temporarily unavailable." }, { status: 503 });
  }
}