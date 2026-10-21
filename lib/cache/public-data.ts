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


export const getCachedSubjectBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("subjects").select("id,name,slug").eq("slug", slug).maybeSingle();
    if (error) throw new Error(`Public subject lookup failed: ${error.message}`);
    return data;
  },
  ["public-subject-by-slug-v1"],
  { revalidate: 300, tags: ["public-taxonomy"] },
);

export const getCachedSubjectPageData = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data: subject, error: subjectError } = await supabase.from("subjects").select("id,name,slug").eq("slug", slug).maybeSingle();
    if (subjectError) throw new Error(`Public subject lookup failed: ${subjectError.message}`);
    if (!subject) return { subject: null, topics: [], questionCountByTopic: [] as [string, number][] };
    const { data: topicRows, error: topicsError } = await supabase.from("topics").select("id,name,slug").eq("subject_id", subject.id).order("name", { ascending: true });
    if (topicsError) throw new Error(`Public subject topics lookup failed: ${topicsError.message}`);
    const topics = topicRows ?? [];
    const topicIds = topics.map((topic) => topic.id);
    if (topicIds.length === 0) return { subject, topics, questionCountByTopic: [] as [string, number][] };
    const { data: questionRows, error: questionsError } = await supabase.from("questions").select("topic_id").in("topic_id", topicIds).eq("status", "published");
    if (questionsError) throw new Error(`Public topic question counts lookup failed: ${questionsError.message}`);
    const counts = new Map<string, number>();
    for (const row of questionRows ?? []) counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
    return { subject, topics, questionCountByTopic: [...counts.entries()] as [string, number][] };
  },
  ["public-subject-page-v1"],
  { revalidate: 120, tags: ["public-taxonomy", "public-questions"] },
);

export const getCachedTopicPageData = unstable_cache(
  async (subjectSlug: string, topicSlug: string, page: number, pageSize: number) => {
    const supabase = createPublicClient();
    const { data: subject, error: subjectError } = await supabase.from("subjects").select("id,name,slug").eq("slug", subjectSlug).maybeSingle();
    if (subjectError) throw new Error(`Public subject lookup failed: ${subjectError.message}`);
    if (!subject) return { subject: null, topic: null, questions: [], total: 0 };
    const { data: topic, error: topicError } = await supabase.from("topics").select("id,name,slug,subject_id").eq("subject_id", subject.id).eq("slug", topicSlug).maybeSingle();
    if (topicError) throw new Error(`Public topic lookup failed: ${topicError.message}`);
    if (!topic) return { subject, topic: null, questions: [], total: 0 };
    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase.from("questions")
      .select("id,prompt,language,created_at,question_options(id,option_text,option_order)", { count: "exact" })
      .eq("topic_id", topic.id).eq("status", "published")
      .order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw new Error(`Public topic questions lookup failed: ${error.message}`);
    const questions = (data ?? []).map((question) => ({
      ...question,
      question_options: [...(question.question_options ?? [])].sort((a, b) => a.option_order - b.option_order),
    }));
    return { subject, topic, questions, total: count ?? 0 };
  },
  ["public-topic-page-v1"],
  { revalidate: 120, tags: ["public-taxonomy", "public-questions"] },
);

export const getCachedPublishedExamDetail = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data: exam, error } = await supabase.from("exams")
      .select("id,title,slug,description,duration_minutes,correct_marks,negative_marks,start_at,end_at,exam_categories(name)")
      .eq("slug", slug).eq("status", "published").maybeSingle();
    if (error) throw new Error(`Public exam lookup failed: ${error.message}`);
    if (!exam) return { exam: null, questionCount: null as number | null };
    const { count, error: countError } = await supabase.from("exam_questions").select("id", { count: "exact", head: true }).eq("exam_id", exam.id);
    return { exam, questionCount: countError ? null : count ?? 0 };
  },
  ["public-exam-detail-v1"],
  { revalidate: 60, tags: ["published-exams"] },
);

export const getCachedExamCategories = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: categories, error: categoriesError }, { data: exams, error: examsError }] = await Promise.all([
      supabase.from("exam_categories").select("id,name,slug").order("name"),
      supabase.from("exams").select("category_id").eq("status", "published"),
    ]);
    if (categoriesError || examsError) throw new Error("Public exam categories lookup failed.");
    const counts = new Map<string, number>();
    for (const exam of exams ?? []) counts.set(exam.category_id, (counts.get(exam.category_id) ?? 0) + 1);
    return { categories: categories ?? [], counts: [...counts.entries()] as [string, number][] };
  },
  ["public-exam-categories-v1"],
  { revalidate: 120, tags: ["published-exams"] },
);

export const getCachedPublicSearch = unstable_cache(
  async (term: string) => {
    const supabase = createPublicClient();
    const safe = term.replace(/[%_]/g, "\\$&");
    const [questions, subjects, exams] = await Promise.all([
      supabase.from("questions").select("id,prompt,language,topics(name,subjects(name))").eq("status", "published").ilike("prompt", "%" + safe + "%").limit(10),
      supabase.from("subjects").select("id,name,slug").ilike("name", "%" + safe + "%").limit(8),
      supabase.from("exams").select("id,title,slug,description,duration_minutes").eq("status", "published").ilike("title", "%" + safe + "%").limit(8),
    ]);
    return { questions: questions.data ?? [], subjects: subjects.data ?? [], exams: exams.data ?? [], failed: Boolean(questions.error || subjects.error || exams.error) };
  },
  ["public-search-v1"],
  { revalidate: 60, tags: ["public-questions", "public-taxonomy", "published-exams"] },
);


export const getCachedQuestionFilterPage = unstable_cache(
  async (page: number, pageSize: number, subjectId: string, topicId: string, language: string, search: string, sort: string) => {
    const supabase = createPublicClient();
    const from = (page - 1) * pageSize;
    let query = supabase.from("questions")
      .select(QUESTION_SELECT, { count: "exact" })
      .eq("status", "published");
    if (subjectId !== "all") query = query.eq("topics.subject_id", subjectId);
    if (topicId !== "all") query = query.eq("topic_id", topicId);
    if (language !== "all") query = query.eq("language", language);
    if (search) query = query.ilike("prompt", "%" + search.replace(/[%_]/g, "\\$&") + "%");
    query = query.order("created_at", { ascending: sort === "oldest" }).order("id", { ascending: true }).range(from, from + pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw new Error(`Public filtered questions lookup failed: ${error.message}`);
    const questions = (data ?? []).map((question) => ({
      ...question,
      question_options: [...(question.question_options ?? [])].sort((a, b) => a.option_order - b.option_order),
    }));
    return { questions, total: count ?? 0 };
  },
  ["public-question-filter-page-v1"],
  { revalidate: 120, tags: ["public-questions", "public-taxonomy"] },
);
