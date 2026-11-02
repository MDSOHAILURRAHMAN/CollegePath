import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: ["/", "/colleges", "/courses", "/admission-guides", "/scholarships"], disallow: ["/dashboard", "/profile", "/saved-colleges", "/recommendations", "/bookings", "/admin", "/login", "/register", "/api/"] }], sitemap: `${baseUrl}/sitemap.xml` };
}