import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const alphabetical = new Intl.Collator("en-IN", { sensitivity: "base", numeric: true });
const pageSize = 30;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("query")?.trim().slice(0, 100) ?? "";
  const offsetValue = Number(params.get("offset") ?? 0);
  const offset = Number.isSafeInteger(offsetValue) ? Math.max(0, Math.min(offsetValue, 52000)) : 0;

  const shortQuery = query.length <= 3;
  const where: Prisma.CollegeWhereInput = {
    institutionType: { in: ["GOVERNMENT", "PRIVATE"] },
    verificationStatus: "VERIFIED",
    demoRecord: false,
    ...(query ? { OR: [
      { name: shortQuery ? { startsWith: query, mode: "insensitive" } : { contains: query, mode: "insensitive" } },
      { searchAliases: { has: query.toLocaleLowerCase("en-IN") } },
    ] } : {}),
  };

  try {
    const colleges = await prisma.college.findMany({
      where,
      select: { slug: true, name: true, institutionType: true, officialDistrict: true, officialState: true, aisheCode: true },
      orderBy: { name: "asc" },
      skip: offset,
      take: pageSize + 1,
    });
    const hasMore = colleges.length > pageSize;
    const page = colleges.slice(0, pageSize);
    page.sort((left, right) => alphabetical.compare(left.name, right.name) || alphabetical.compare(left.officialState ?? "", right.officialState ?? "") || alphabetical.compare(left.aisheCode ?? "", right.aisheCode ?? ""));
    return NextResponse.json({ colleges: page, hasMore, nextOffset: hasMore ? offset + pageSize : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("College option search failed:", error);
    return NextResponse.json({ error: "College options are temporarily unavailable." }, { status: 503 });
  }
}
