import { Prisma, UserRole } from "../src/generated/prisma/client";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const requestedRole = process.argv[3]?.toUpperCase();
  if (!email || !requestedRole || !Object.values(UserRole).includes(requestedRole as UserRole)) {
    throw new Error("Usage: npm run admin:promote -- <email> <STUDENT|COUNSELLOR|ADMIN>");
  }
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } });
  if (!user) throw new Error("No account exists for that email. Register it first.");
  const role = requestedRole as UserRole;
  await prisma.$transaction(async transaction => {
    if (user.role === "ADMIN" && role !== "ADMIN" && await transaction.user.count({ where: { role: "ADMIN" } }) <= 1) throw new Error("At least one administrator account must remain.");
    await transaction.user.update({ where: { id: user.id }, data: { role } });
    await transaction.auditLog.create({ data: { actorId: user.id, action: "USER_ROLE_CHANGED_BY_LOCAL_OPERATOR", entityType: "User", entityId: user.id, metadata: { previousRole: user.role, newRole: role, source: "local CLI" } satisfies Prisma.InputJsonObject } });
  });
  console.info(`Updated ${user.email} to ${role}.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Role update failed.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());