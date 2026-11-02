import { NextResponse } from "next/server";
import { collegeSearchSchema } from "@/lib/schemas";
import { searchColleges } from "@/lib/colleges";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = collegeSearchSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search filters.", issues: parsed.error.flatten() }, { status: 400 });
  try {
    return NextResponse.json(await searchColleges(parsed.data), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "College data is temporarily unavailable." }, { status: 503 });
  }
}