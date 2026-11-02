import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ collegeId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to access your shortlist." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "This feature is for student accounts." }, { status: 403 });
  const { collegeId } = await params;
  try {
    await prisma.savedCollege.deleteMany({ where: { userId: session.user.id, collegeId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update your shortlist." }, { status: 503 });
  }
}