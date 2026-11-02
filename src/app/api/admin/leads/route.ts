import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!["COUNSELLOR", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  const url = new URL(request.url);
  const page = Math.min(1000, Math.max(1, Number(url.searchParams.get("page") || 1)));
  const status = url.searchParams.get("status") || undefined;
  try {
    const where = status ? { status: status as "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "CLOSED" } : {};
    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, select: { id: true, name: true, email: true, phone: true, admissionYear: true, message: true, status: true, followUpAt: true, createdAt: true, notes: { orderBy: { createdAt: "desc" }, take: 3, select: { id: true, note: true, createdAt: true, author: { select: { name: true } } } } } }),
      prisma.lead.count({ where }),
    ]);
    return NextResponse.json({ leads, total, page, pageSize: 25 });
  } catch {
    return NextResponse.json({ error: "Lead data is temporarily unavailable." }, { status: 503 });
  }
}