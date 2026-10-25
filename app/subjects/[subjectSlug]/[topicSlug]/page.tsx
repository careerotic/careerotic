import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TopicQuestionList from "@/components/questions/TopicQuestionList";
import QuestionBankPagination from "@/components/questions/QuestionBankPagination";
import { getCachedSubjectPageData, getCachedTopicPageData } from "@/lib/cache/public-data";

const PAGE_SIZE = 25;
type RouteProps = {
  params: Promise<{ subjectSlug: string; topicSlug: string }>;
  searchParams: Promise<{ page?: string }>;
};
type QuestionRow = {
  id: string;
  prompt: string;
  language: string;
  created_at: string;
  question_options: { id: string; option_text: string; option_order: number }[];
};

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { subjectSlug, topicSlug } = await params;
  const cached = await getCachedSubjectPageData(subjectSlug);
  const subject = cached.subject;
  if (!subject) return { title: "Topic questions" };
  const topic = (cached.topics as { id: string; name: string; slug: string }[]).find((item) => item.slug === topicSlug);
  return {
    title: topic?.name ? `${topic.name} questions` : "Topic questions",
    description: topic?.name ? `Practise published ${topic.name} questions in ${subject.name} on Careerotic.` : "Practise questions from the Careerotic question bank.",
    alternates: { canonical: "/subjects/" + subjectSlug + "/" + topicSlug },
  };
}

export default async function TopicPage({ params, searchParams }: RouteProps) {
  const [{ subjectSlug, topicSlug }, query] = await Promise.all([params, searchParams]);
  const rawPage = query.page ?? "1";
  if (!/^[1-9]\\d*$/.test(rawPage)) notFound();
  const page = Number(rawPage);
  if (!Number.isSafeInteger(page)) notFound();
  let subject: { id: string; name: string; slug: string } | null = null;
  let topic: { id: string; name: string; slug: string; subject_id: string } | null = null;
  let questions: QuestionRow[] = [];
  let total = 0;
  try {
    const cached = await getCachedTopicPageData(subjectSlug, topicSlug, page, PAGE_SIZE);
    subject = cached.subject as { id: string; name: string; slug: string } | null;
    topic = cached.topic as { id: string; name: string; slug: string; subject_id: string } | null;
    questions = cached.questions as unknown as QuestionRow[];
    total = cached.total;
  } catch (error) {
    console.error("Topic page cache lookup failed:", error);
    throw new Error("Unable to load questions for this topic.");
  }
  if (!subject) notFound();
  if (!topic) notFound();
  const from = (page - 1) * PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();
  const first = total ? from + 1 : 0;
  const last = Math.min(from + questions.length, total);

  return (
    <main className="min-w-0 space-y-4 text-slate-900">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <nav aria-label="Subject and topic" className="flex flex-wrap items-center gap-2 text-xs">
          <Link href="/questions" className="font-medium text-indigo-700 hover:underline">Question bank</Link>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <Link href={`/subjects/${subject.slug}`} className="font-medium text-indigo-700 hover:underline">{subject.name}</Link>
        </nav>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">Topic questions</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{topic.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{total} published {total === 1 ? "question" : "questions"} · {subject.name}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-sm">
        <h2 className="font-bold">Practice questions</h2>
        <span className="text-xs text-slate-500">{total ? `Showing ${first}–${last} of ${total}` : "No questions yet"}</span>
      </div>

      {questions.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <h2 className="font-semibold">No published questions in this topic</h2>
          <p className="mt-1 text-sm text-slate-500">Choose another topic to keep practising.</p>
          <Link href={`/subjects/${subject.slug}`} className="mt-3 inline-flex text-sm font-semibold text-indigo-700 hover:underline">Back to {subject.name}</Link>
        </section>
      ) : (
        <TopicQuestionList questions={questions} subject={subject.name} topic={topic.name} />
      )}

      {totalPages > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <QuestionBankPagination
            baseHref={`/subjects/${subject.slug}/${topic.slug}`}
            page={page}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            ariaLabel="Topic question pagination"
          />
        </div>
      )}
    </main>
  );
}
