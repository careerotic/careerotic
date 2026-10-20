import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuestionsClient from "./QuestionsClient";

const PAGE_SIZE = 25;
type SearchParams = { page?: string | string[] };
type PageProps = { searchParams: Promise<SearchParams> };

function parsePage(value: SearchParams["page"]): number {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) notFound();
  const page = Number(value);
  if (!Number.isSafeInteger(page)) notFound();
  return page;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  return {
    title: page === 1 ? "Practice Questions" : `Practice Questions — Page ${page}`,
    description: "Browse published competitive exam questions by subject, topic, and language. Review options and explanations on Careerotic.",
    alternates: { canonical: page === 1 ? "/questions" : `/questions?page=${page}` },
  };
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const requestedPage = (await searchParams).page;
  const page = parsePage(requestedPage);
  if (page === 1 && requestedPage !== undefined) redirect("/questions");
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("questions")
    .select("id,topic_id,prompt,language,created_at,topics!inner(id,name,subject_id,subjects!inner(id,name)),question_options(id,question_id,option_text,option_order)", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (!error && page > 1 && (count === 0 || (count !== null && from >= count))) notFound();

  const initialQuestions = (data ?? []).map((question) => ({
    ...question,
    question_options: [...(question.question_options ?? [])].sort((a, b) => a.option_order - b.option_order),
  }));

  return <QuestionsClient initialQuestions={initialQuestions as never[]} initialLoadFailed={Boolean(error)} initialPage={page} initialTotal={count ?? 0} />;
}
