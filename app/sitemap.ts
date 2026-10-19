import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://careerotic.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: new URL("/questions", siteUrl).toString(), changeFrequency: "daily", priority: 0.9 },
    { url: new URL("/exams", siteUrl).toString(), changeFrequency: "daily", priority: 0.9 },
    { url: new URL("/subjects", siteUrl).toString(), changeFrequency: "weekly", priority: 0.8 },
    { url: new URL("/privacy", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/terms", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const [{ data: subjects }, { data: exams }, { data: topics }] = await Promise.all([
      supabase.from("subjects").select("id,slug"),
      supabase.from("exams").select("slug").eq("status", "published"),
      supabase.from("topics").select("slug,subject_id"),
    ]);

    const subjectRows = subjects ?? [];
    const subjectById = new Map(subjectRows.map((subject) => [subject.id, subject.slug]));
    const subjectRoutes: MetadataRoute.Sitemap = subjectRows.map((subject) => ({
      url: new URL(`/subjects/${subject.slug}`, siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    const topicRoutes: MetadataRoute.Sitemap = (topics ?? []).flatMap((topic) => {
      const subjectSlug = subjectById.get(topic.subject_id);
      return subjectSlug ? [{
        url: new URL(`/subjects/${subjectSlug}/${topic.slug}`, siteUrl).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }] : [];
    });
    const examRoutes: MetadataRoute.Sitemap = (exams ?? []).map((exam) => ({
      url: new URL(`/exam/${exam.slug}`, siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...subjectRoutes, ...topicRoutes, ...examRoutes];
  } catch {
    return staticRoutes;
  }
}
