import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to update preferences." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  const parsed = z.object({ marketing: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid communications preference." }, { status: 400 });
  try {
    await prisma.$transaction([
      prisma.studentProfile.upsert({ where: { userId: session.user.id }, update: { marketingConsent: parsed.data.marketing }, create: { userId: session.user.id, marketingConsent: parsed.data.marketing } }),
      prisma.consentRecord.create({ data: { userId: session.user.id, consentType: "MARKETING", granted: parsed.data.marketing, version: "2026-10", ...(parsed.data.marketing ? {} : { withdrawnAt: new Date() }) } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Preference could not be saved." }, { status: 503 }); }
}