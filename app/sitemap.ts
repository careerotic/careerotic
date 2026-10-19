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
    { url: new URL("/exam-categories", siteUrl).toString(), changeFrequency: "weekly", priority: 0.7 },
    { url: new URL("/study-guides", siteUrl).toString(), changeFrequency: "monthly", priority: 0.7 },
    { url: new URL("/study-guides/bcs-preliminary-strategy", siteUrl).toString(), changeFrequency: "monthly", priority: 0.6 },
    { url: new URL("/study-guides/bangla-grammar", siteUrl).toString(), changeFrequency: "monthly", priority: 0.6 },
    { url: new URL("/study-guides/english-grammar", siteUrl).toString(), changeFrequency: "monthly", priority: 0.6 },
    { url: new URL("/study-guides/math-and-mental-ability", siteUrl).toString(), changeFrequency: "monthly", priority: 0.6 },
    { url: new URL("/study-guides/general-knowledge", siteUrl).toString(), changeFrequency: "monthly", priority: 0.6 },
    { url: new URL("/current-affairs", siteUrl).toString(), changeFrequency: "weekly", priority: 0.6 },
    { url: new URL("/help", siteUrl).toString(), changeFrequency: "monthly", priority: 0.4 },
    { url: new URL("/privacy", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/terms", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const [{ data: subjects, error: subjectsError }, { data: exams, error: examsError }, { data: topics, error: topicsError }] = await Promise.all([
      supabase.from("subjects").select("id,slug"),
      supabase.from("exams").select("slug").eq("status", "published"),
      supabase.from("topics").select("id,slug,subject_id"),
    ]);
    if (subjectsError || examsError || topicsError) return staticRoutes;

    // Only include subject/topic pages backed by published questions.
    // Paginate through the frozen question bank to avoid PostgREST row-limit truncation.
    const publishedTopicIds = new Set<string>();
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data: questionRows, error: questionsError } = await supabase
        .from("questions").select("topic_id").eq("status", "published")
        .range(offset, offset + pageSize - 1);
      if (questionsError) return staticRoutes;
      const rows = questionRows ?? [];
      rows.forEach((question) => publishedTopicIds.add(question.topic_id));
      if (rows.length < pageSize) break;
    }

    const topicRows = (topics ?? []).filter((topic) => publishedTopicIds.has(topic.id));
    const subjectsWithPublishedQuestions = new Set(topicRows.map((topic) => topic.subject_id));
    const subjectRoutes: MetadataRoute.Sitemap = (subjects ?? [])
      .filter((subject) => subjectsWithPublishedQuestions.has(subject.id))
      .map((subject) => ({ url: new URL("/subjects/" + subject.slug, siteUrl).toString(), changeFrequency: "weekly", priority: 0.7 }));
    const subjectById = new Map((subjects ?? []).map((subject) => [subject.id, subject.slug]));
    const topicRoutes: MetadataRoute.Sitemap = topicRows.flatMap((topic) => {
      const subjectSlug = subjectById.get(topic.subject_id);
      return subjectSlug ? [{ url: new URL("/subjects/" + subjectSlug + "/" + topic.slug, siteUrl).toString(), changeFrequency: "weekly" as const, priority: 0.6 }] : [];
    });
    const examRoutes: MetadataRoute.Sitemap = (exams ?? []).map((exam) => ({
      url: new URL("/exam/" + exam.slug, siteUrl).toString(), changeFrequency: "weekly", priority: 0.8,
    }));
    return [...staticRoutes, ...subjectRoutes, ...topicRoutes, ...examRoutes];
  } catch {
    return staticRoutes;
  }
}
