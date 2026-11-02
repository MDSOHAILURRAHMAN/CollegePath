import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ comparisonId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to manage saved comparisons." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access is required." }, { status: 403 });
  const { comparisonId } = await params;
  try {
    const deleted = await prisma.savedComparison.deleteMany({ where: { id: comparisonId, userId: session.user.id } });
    if (!deleted.count) return NextResponse.json({ error: "Saved comparison was not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Saved comparison could not be deleted." }, { status: 503 });
  }
}
