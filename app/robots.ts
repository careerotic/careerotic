import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/dashboard", "/account", "/exam/*/attempt", "/exam/*/result", "/login", "/signup", "/forgot-password", "/reset-password"] }, sitemap: "https://careerotic.vercel.app/sitemap.xml" };
}
