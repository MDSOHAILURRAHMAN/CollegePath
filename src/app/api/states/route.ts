import { NextResponse } from "next/server";
import { INDIAN_STATES } from "@/lib/catalog-options";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ states: INDIAN_STATES });
}
