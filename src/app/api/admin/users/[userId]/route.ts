import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const roleSchema = z.object({ role: z.enum(["STUDENT", "COUNSELLOR", "ADMIN"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  const parsed = roleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid account role." }, { status: 400 });
  const { userId } = await params;
  if (userId === session.user.id && parsed.data.role !== "ADMIN") return NextResponse.json({ error: "You cannot remove your own admin role." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async transaction => {
      const target = await transaction.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
      if (!target) return null;
      if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
        const administrators = await transaction.user.count({ where: { role: "ADMIN" } });
        if (administrators <= 1) throw new Error("LAST_ADMIN");
      }
      const updated = await transaction.user.update({ where: { id: userId }, data: { role: parsed.data.role }, select: { id: true, name: true, email: true, role: true } });
      await transaction.auditLog.create({ data: { actorId: session.user.id, action: "USER_ROLE_CHANGED", entityType: "User", entityId: userId, metadata: { oldRole: target.role, newRole: parsed.data.role } } });
      return updated;
    });
    if (!result) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    return NextResponse.json({ user: result });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ADMIN") return NextResponse.json({ error: "At least one administrator account must remain." }, { status: 409 });
    return NextResponse.json({ error: "Role update failed." }, { status: 503 });
  }
}