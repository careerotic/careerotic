import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCachedQuestionBankPage } from "@/lib/cache/public-data";
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
  let initialQuestions: Awaited<ReturnType<typeof getCachedQuestionBankPage>>["questions"] = [];
  let initialTotal = 0;
  let initialLoadFailed = false;

  try {
    const cachedPage = await getCachedQuestionBankPage(page, PAGE_SIZE);
    initialQuestions = cachedPage.questions;
    initialTotal = cachedPage.total;
  } catch (error) {
    console.error("Question bank lookup failed:", error);
    initialLoadFailed = true;
  }

  if (!initialLoadFailed && page > 1 && (initialTotal === 0 || from >= initialTotal)) notFound();

  return (
    <QuestionsClient
      initialQuestions={initialQuestions as never[]}
      initialLoadFailed={initialLoadFailed}
      initialPage={page}
      initialTotal={initialTotal}
    />
  );
}
