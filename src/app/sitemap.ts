import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticPaths = ["", "/colleges", "/courses", "/compare", "/admission-guides", "/scholarships", "/about", "/contact", "/guidance", "/data-methodology"];
  let colleges: { slug: string; updatedAt: Date }[] = [];
  try { colleges = await prisma.college.findMany({ where: { verificationStatus: "VERIFIED", demoRecord: false }, select: { slug: true, updatedAt: true } }); } catch {}
  return [
    ...staticPaths.map(path => ({ url: `${baseUrl}${path}`, lastModified: new Date() })),
    ...colleges.map(college => ({ url: `${baseUrl}/colleges/${college.slug}`, lastModified: college.updatedAt })),
  ];
}
