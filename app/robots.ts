import type { MetadataRoute } from "next";
const siteUrl = "https://careerotic.vercel.app";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/dashboard", "/account", "/my-exams", "/my-results", "/saved-questions", "/study-plan", "/exam/*/attempt", "/exam/*/result", "/login", "/signup", "/forgot-password", "/reset-password"] }, sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl };
}
