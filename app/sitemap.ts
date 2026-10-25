import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://careerotic.vercel.app";
const pageSize = 1000;

type PageResult<T> = { data: T[] | null; error: unknown | null };

async function readAll<T>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[] | null> {
  const rows: T[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await loadPage(offset, offset + pageSize - 1);
    if (error) return null;

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function safePathSegment(value: string | null | undefined): string | null {
  if (!value || value === "." || value === ".." || /[\\/\u0000-\u001f]/.test(value)) {
    return null;
  }
  return encodeURIComponent(value);
}

function uniqueSameOriginRoutes(routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const unique = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const route of routes) {
    try {
      const url = new URL(route.url);
      if (url.origin !== siteUrl || url.hash) continue;
      if (url.search) {
        const pageValues = url.searchParams.getAll("page");
        const page = Number(pageValues[0]);
        if (
          url.pathname !== "/questions" ||
          url.searchParams.size !== 1 ||
          pageValues.length !== 1 ||
          !Number.isSafeInteger(page) ||
          page < 2 ||
          String(page) !== pageValues[0]
        ) continue;
      }
      unique.set(url.toString(), { ...route, url: url.toString() });
    } catch {
      // Skip malformed URLs instead of emitting an invalid sitemap entry.
    }
  }

  return [...unique.values()];
}

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
    { url: new URL("/about", siteUrl).toString(), changeFrequency: "monthly", priority: 0.4 },
    { url: new URL("/help", siteUrl).toString(), changeFrequency: "monthly", priority: 0.4 },
    { url: new URL("/contact", siteUrl).toString(), changeFrequency: "monthly", priority: 0.3 },
    { url: new URL("/disclaimer", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/privacy", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/terms", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [subjects, exams, topics] = await Promise.all([
      readAll<{ id: string; slug: string }>((from, to) =>
        supabase.from("subjects").select("id,slug").range(from, to),
      ),
      readAll<{ slug: string }>((from, to) =>
        supabase.from("exams").select("slug").eq("status", "published").range(from, to),
      ),
      readAll<{ id: string; slug: string; subject_id: string }>((from, to) =>
        supabase.from("topics").select("id,slug,subject_id").range(from, to),
      ),
    ]);

    // If the existing database cannot be read, still serve a valid static sitemap.
    if (!subjects || !exams || !topics) return uniqueSameOriginRoutes(staticRoutes);

    // Include taxonomy URLs only when they are backed by published questions.
    const publishedTopicIds = new Set<string>();
    const questionRows = await readAll<{ topic_id: string | null }>((from, to) =>
      supabase.from("questions").select("topic_id").eq("status", "published").range(from, to),
    );
    if (!questionRows) return uniqueSameOriginRoutes(staticRoutes);

    questionRows.forEach((question) => {
      if (question.topic_id) publishedTopicIds.add(question.topic_id);
    });

    const topicRows = topics.filter((topic) => publishedTopicIds.has(topic.id));
    const subjectsWithPublishedQuestions = new Set(topicRows.map((topic) => topic.subject_id));
    const subjectById = new Map(subjects.map((subject) => [subject.id, subject.slug]));

    const subjectRoutes: MetadataRoute.Sitemap = subjects.flatMap((subject) => {
      const slug = safePathSegment(subject.slug);
      if (!slug || !subjectsWithPublishedQuestions.has(subject.id)) return [];
      return [{
        url: new URL("/subjects/" + slug, siteUrl).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }];
    });

    const topicRoutes: MetadataRoute.Sitemap = topicRows.flatMap((topic) => {
      const subjectSlug = safePathSegment(subjectById.get(topic.subject_id));
      const topicSlug = safePathSegment(topic.slug);
      if (!subjectSlug || !topicSlug) return [];
      return [{
        url: new URL("/subjects/" + subjectSlug + "/" + topicSlug, siteUrl).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }];
    });

    const examRoutes: MetadataRoute.Sitemap = exams.flatMap((exam) => {
      const slug = safePathSegment(exam.slug);
      if (!slug) return [];
      return [{
        url: new URL("/exam/" + slug, siteUrl).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }];
    });

    const totalQuestionPages = Math.ceil(questionRows.length / 25);
    const questionPageRoutes: MetadataRoute.Sitemap = Array.from(
      { length: Math.max(0, totalQuestionPages - 1) },
      (_, index) => {
        const page = index + 2;
        return {
          url: new URL(`/questions?page=${page}`, siteUrl).toString(),
          changeFrequency: "daily" as const,
          priority: 0.8,
        };
      },
    );

    return uniqueSameOriginRoutes([
      ...staticRoutes,
      ...questionPageRoutes,
      ...subjectRoutes,
      ...topicRoutes,
      ...examRoutes,
    ]);
  } catch {
    return uniqueSameOriginRoutes(staticRoutes);
  }
}
