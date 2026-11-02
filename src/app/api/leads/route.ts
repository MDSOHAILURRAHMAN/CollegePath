import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!checkRateLimit(request, "public-lead", 5)) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields and try again.", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const lead = await prisma.lead.create({
      data: { ...parsed.data, userId: session?.user.id ?? null },
      select: { id: true, status: true, createdAt: true },
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Your request could not be saved. Please try again later." }, { status: 503 });
  }
}