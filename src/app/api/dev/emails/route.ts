import { NextResponse } from "next/server";
import { z } from "zod";
import { getDevelopmentEmails } from "@/lib/dev-mailbox";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = z.email().safeParse(url.searchParams.get("email"));
  if (!parsed.success) return NextResponse.json({ error: "Enter the recipient email address." }, { status: 400 });
  return NextResponse.json({ emails: await getDevelopmentEmails(parsed.data) }, { headers: { "Cache-Control": "private, no-store" } });
}
