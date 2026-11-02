import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireStudent() {
  const session = await getSession();
  if (!session) redirect("/login?returnTo=/dashboard");
  if (session.user.role !== "STUDENT") redirect("/unauthorized");
  return session;
}

export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login?returnTo=/admin");
  if (!["COUNSELLOR", "ADMIN"].includes(session.user.role)) redirect("/unauthorized");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login?returnTo=/admin");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");
  return session;
}