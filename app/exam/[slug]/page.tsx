import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedPublishedExamDetail } from "@/lib/cache/public-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { exam: data } = await getCachedPublishedExamDetail(slug);

  if (!data) {
    return { title: "Exam not found", robots: { index: false, follow: false } };
  }

  const title = `${data.title} | Exam details`;
  const description = data.description?.slice(0, 160) || `Review the published ${data.title} exam details and instructions on Careerotic.`;
  const canonical = `/exam/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary", title, description },
  };
}

export default async function ExamDetailsPage({ params }: Props) {
  const { slug } = await params;
  const { exam, questionCount } = await getCachedPublishedExamDetail(slug);
  if (!exam) notFound();
  const now = Date.now();
  const start = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const end = exam.end_at ? new Date(exam.end_at).getTime() : null;
  const scheduled = (start === null || now >= start) && (end === null || now < end);
  const canStart = scheduled && questionCount !== null && questionCount > 0;

  const metrics = [
    { label: "Duration", value: `${exam.duration_minutes} min`, detail: "Time limit" },
    { label: "Questions", value: questionCount === null ? "Unavailable" : String(questionCount), detail: "In this exam" },
    { label: "Correct", value: `+${exam.correct_marks}`, detail: "Marks per answer" },
    { label: "Incorrect", value: `−${exam.negative_marks}`, detail: "Negative marks" },
  ];

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl px-3 py-3 sm:px-5 sm:py-5">
      <nav aria-label="Breadcrumb" className="mb-3">
        <Link href="/exams" className="inline-flex min-h-9 items-center gap-1 rounded-md text-sm font-medium text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <span aria-hidden="true">←</span> All exams
        </Link>
      </nav>

      <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {exam.exam_categories?.name ?? "Exam"}
            </span>
            {scheduled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Not currently available</span>
            )}
          </div>
          <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-slate-950 sm:text-2xl">{exam.title}</h1>
          {exam.description ? (
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{exam.description}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Review the exam details and instructions before you begin.</p>
          )}
        </header>

        <section aria-label="Exam summary" className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0 bg-slate-50 px-3 py-3 sm:px-4">
              <p className="text-xs font-medium text-slate-500">{metric.label}</p>
              <p className="mt-1 break-words text-lg font-bold leading-6 tabular-nums text-slate-950">{metric.value}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{metric.detail}</p>
            </div>
          ))}
        </section>

        {(exam.start_at || exam.end_at) && (
          <section aria-labelledby="schedule-heading" className="border-b border-slate-200 px-4 py-3 sm:px-6">
            <h2 id="schedule-heading" className="mb-2 text-sm font-semibold text-slate-900">Schedule</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {exam.start_at && (
                <div className="min-w-0">
                  <dt className="text-xs text-slate-500">Starts</dt>
                  <dd className="mt-0.5 break-words font-medium text-slate-800">{new Date(exam.start_at).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</dd>
                </div>
              )}
              {exam.end_at && (
                <div className="min-w-0">
                  <dt className="text-xs text-slate-500">Ends</dt>
                  <dd className="mt-0.5 break-words font-medium text-slate-800">{new Date(exam.end_at).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section aria-labelledby="instructions-heading" className="px-4 py-4 sm:px-6">
          <h2 id="instructions-heading" className="text-sm font-semibold text-slate-950">Before you begin</h2>
          <ul className="mt-2 grid gap-x-6 gap-y-2 text-sm leading-5 text-slate-600 sm:grid-cols-2">
            <li className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-0.5 font-bold text-indigo-600">✓</span><span>The timer is controlled by the server and cannot be extended by refreshing the page.</span></li>
            <li className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-0.5 font-bold text-indigo-600">✓</span><span>Selected answers are saved and can be restored when you resume this attempt.</span></li>
            <li className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-0.5 font-bold text-indigo-600">✓</span><span>Submission is final. Review your answers before submitting.</span></li>
            <li className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-0.5 font-bold text-indigo-600">✓</span><span>Correct answers and explanations remain hidden until the attempt is submitted.</span></li>
          </ul>
        </section>

        {(!scheduled || questionCount === 0 || questionCount === null) && (
          <div className="mx-4 mb-4 space-y-2 sm:mx-6" aria-live="polite">
            {!scheduled && <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">This exam is outside its scheduled availability window.</p>}
            {questionCount === 0 && <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">This exam has no assigned questions and cannot be started.</p>}
            {questionCount === null && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Question assignments could not be verified. Please try again later.</p>}
          </div>
        )}

        <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          {canStart ? (
            <Link href={`/attempt/${encodeURIComponent(exam.slug)}`} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto">
              Start or resume exam <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          ) : (
            <button type="button" disabled className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 sm:w-auto">
              Exam unavailable
            </button>
          )}
          <p className="mt-2 text-xs leading-5 text-slate-500">Your attempt uses the existing exam rules and time limit.</p>
        </footer>
      </article>
    </main>
  );
}
