import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 250, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    return NextResponse.json({ users });
  } catch { return NextResponse.json({ error: "Account data is temporarily unavailable." }, { status: 503 }); }
}