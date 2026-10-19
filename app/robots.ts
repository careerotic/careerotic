import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/dashboard", "/account", "/my-exams", "/my-results", "/saved-questions", "/study-plan", "/exam/*/attempt", "/exam/*/result", "/login", "/signup", "/forgot-password", "/reset-password"] }, sitemap: "https://careerotic.vercel.app/sitemap.xml" };
}
