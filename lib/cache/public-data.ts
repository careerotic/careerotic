import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

const QUESTION_SELECT =
  "id,topic_id,prompt,language,created_at,topics!inner(id,name,subject_id,subjects!inner(id,name)),question_options(id,question_id,option_text,option_order)";

export const getCachedQuestionBankPage = unstable_cache(
  async (page: number, pageSize: number) => {
    const supabase = createPublicClient();
    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from("questions")
      .select(QUESTION_SELECT, { count: "exact" })
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Public question cache query failed: ${error.message}`);
    const questions = (data ?? []).map((question) => ({
      ...question,
      question_options: [...(question.question_options ?? [])].sort((a, b) => a.option_order - b.option_order),
    }));
    return { questions, total: count ?? 0 };
  },
  ["public-question-bank-page-v1"],
  { revalidate: 120, tags: ["public-questions"] },
);

export const getCachedPublishedAnswer = unstable_cache(
  async (questionId: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("get_published_question_answer", { p_question_id: questionId });
    if (error) throw new Error(`Published answer lookup failed: ${error.message}`);
    return data;
  },
  ["public-question-answer-v1"],
  { revalidate: 120, tags: ["published-answers"] },
);

export const getCachedPublicTaxonomy = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [
      { data: subjects, error: subjectsError },
      { data: topics, error: topicsError },
    ] = await Promise.all([
      supabase.from("subjects").select("id,name,slug").order("name", { ascending: true }),
      supabase.from("topics").select("id,name,subject_id").order("name", { ascending: true }),
    ]);
    if (subjectsError) throw new Error(`Public subjects lookup failed: ${subjectsError.message}`);
    if (topicsError) throw new Error(`Public topics lookup failed: ${topicsError.message}`);
    return { subjects: subjects ?? [], topics: topics ?? [] };
  },
  ["public-taxonomy-v1"],
  { revalidate: 300, tags: ["public-taxonomy"] },
);

export const getCachedPublishedExams = unstable_cache(
  async (categorySlug: string) => {
    const supabase = createPublicClient();
    let categoryId: string | null = null;
    let categoryName: string | null = null;
    if (categorySlug) {
      const { data } = await supabase.from("exam_categories").select("id,name").eq("slug", categorySlug).maybeSingle();
      categoryId = data?.id ?? null;
      categoryName = data?.name ?? null;
    }
    let query = supabase
      .from("exams")
      .select("id,title,slug,description,duration_minutes,correct_marks,negative_marks,start_at,end_at,category_id,exam_categories(name)")
      .eq("status", "published")
      .order("start_at", { ascending: true, nullsFirst: false });
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query;
    return { exams: data ?? [], categoryName, error: Boolean(error) };
  },
  ["public-published-exams-v1"],
  { revalidate: 120, tags: ["published-exams"] },
);

export const getCachedHomePublicData = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [
      { count: questionCount, error: questionCountError },
      { count: subjectCount, error: subjectCountError },
      { data: exams, count: examCount, error: examError },
      { data: featuredQuestionRows, error: featuredQuestionError },
    ] = await Promise.all([
      supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("subjects").select("id", { count: "exact", head: true }),
      supabase.from("exams").select("id,title,slug,description,duration_minutes,category_id,exam_categories(name)", { count: "exact" }).eq("status", "published").order("start_at", { ascending: true, nullsFirst: false }).limit(3),
      supabase.from("questions").select("id,prompt,language,topics!inner(name,subjects!inner(name)),question_options(id,option_text,option_order)").eq("status", "published").order("created_at", { ascending: false }).limit(1),
    ]);
    return {
      questionCount, questionCountError: Boolean(questionCountError),
      subjectCount, subjectCountError: Boolean(subjectCountError),
      exams: exams ?? [], examCount, examError: Boolean(examError),
      featuredQuestionRows: featuredQuestionRows ?? [], featuredQuestionError: Boolean(featuredQuestionError),
    };
  },
  ["home-public-data-v1"],
  { revalidate: 60, tags: ["home-public-data", "public-questions", "public-taxonomy", "published-exams"] },
);
