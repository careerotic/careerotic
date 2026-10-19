import Link from "next/link";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, LAST_ATTEMPT_COOKIE } from "@/lib/exams/attempt-server";

type Props = { params: Promise<{ slug: string }> };
type Option = { text?: string; option_text?: string } | null;
type ResultQuestion = {
  prompt?: string;
  selected_is_correct?: boolean;
  explanation?: string;
  selected_option?: Option;
  correct_option?: Option;
};
type Result = {
  score?: number;
  correct_count?: number;
  incorrect_count?: number;
  questions?: ResultQuestion[];
};

function optionText(option: Option | undefined) {
  return option?.text ?? option?.option_text ?? null;
}

export default async function ExamResultPage({ params }: Props) {
  const { slug } = await params;
  const store = await cookies();
  const attemptId = store.get(LAST_ATTEMPT_COOKIE)?.value;
  const token = attemptId ? store.get(`careerotic_attempt_${attemptId}`)?.value : null;
  let result: Result | null = null;
  let errorMessage = "";

  if (attemptId && token) {
    const supabase = await createClient();
    const admin = createAdminClient();
    const [{ data: exam }, { data: attempt }] = await Promise.all([
      supabase.from("exams").select("id").eq("slug", slug).eq("status", "published").maybeSingle(),
      admin.from("exam_attempts").select("id,exam_id,status,attempt_token_hash").eq("id", attemptId).maybeSingle(),
    ]);
    const tokenHash = createHash("sha256").update(token).digest("hex");

    if (!exam || !attempt || attempt.exam_id !== exam.id) {
      errorMessage = "No result for this exam was found in this browser.";
    } else if (attempt.status !== "submitted") {
      errorMessage = "This attempt has not been submitted, so its result is not available yet.";
    } else if (attempt.attempt_token_hash !== tokenHash) {
      errorMessage = "This browser is not authorized to view this result.";
    } else {
      const response = await supabase.rpc("get_attempt_result", {
        p_attempt_id: attemptId,
        p_attempt_token: token,
      });
      if (response.error) errorMessage = "Your result could not be loaded. Please refresh and try again.";
      else if (response.data && typeof response.data === "object") result = response.data as Result;
    }
  } else {
    errorMessage = "No submitted attempt was found in this browser. Open the result on the same browser where you took the exam.";
  }

  const questions = Array.isArray(result?.questions) ? result.questions : [];
  const unansweredCount = questions.filter((question) => !optionText(question.selected_option)).length;

  return (
    <main className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Careerotic · Exam report</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Your result</h1>
          <p className="mt-1 text-sm text-slate-600">Review your score and compare each response with the correct answer.</p>
        </div>
        {result && <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{questions.length} questions reviewed</span>}
      </div>

      {!result ? (
        <section role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h2 className="font-semibold text-amber-950">Result unavailable</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">{errorMessage || "The result is not available yet. Submit the exam first."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/exams" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">Browse exams</Link>
            <Link href={`/exam/${encodeURIComponent(slug)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">Exam details</Link>
          </div>
        </section>
      ) : (
        <>
          <section aria-label="Result summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="col-span-2 flex min-h-28 flex-col justify-between rounded-xl bg-indigo-700 p-4 text-white sm:col-span-1 sm:min-h-32">
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Final score</span>
              <span className="text-4xl font-bold tabular-nums">{result.score ?? "—"}</span>
              <span className="text-xs text-indigo-100">As reported by the exam</span>
            </div>
            <div className="flex min-h-28 flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:min-h-32">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Correct</span>
              <span className="text-3xl font-bold tabular-nums text-emerald-900">{result.correct_count ?? "—"}</span>
              <span className="text-xs text-emerald-800">Answers matched</span>
            </div>
            <div className="flex min-h-28 flex-col justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 sm:min-h-32">
              <span className="text-xs font-semibold uppercase tracking-wide text-rose-800">Incorrect</span>
              <span className="text-3xl font-bold tabular-nums text-rose-900">{result.incorrect_count ?? "—"}</span>
              <span className="text-xs text-rose-800">Answers to revisit</span>
            </div>
            <div className="flex min-h-28 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:min-h-32">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Not answered</span>
              <span className="text-3xl font-bold tabular-nums text-slate-900">{unansweredCount}</span>
              <span className="text-xs text-slate-500">No response recorded</span>
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Answer review</h2>
                <p className="mt-0.5 text-sm text-slate-600">Correct answers and explanations are shown below each question.</p>
              </div>
              <span className="text-xs font-medium text-slate-500">{questions.length} items</span>
            </div>

            {questions.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">The score is available, but no question-level review was returned for this attempt.</p>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => {
                  const selectedAnswer = optionText(question.selected_option);
                  const correctAnswer = optionText(question.correct_option);
                  const unanswered = !selectedAnswer;
                  const isCorrect = question.selected_is_correct === true;
                  const statusLabel = unanswered ? "Not answered" : isCorrect ? "Correct" : "Incorrect";
                  const statusClass = unanswered
                    ? "border-slate-200 bg-slate-100 text-slate-700"
                    : isCorrect
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800";

                  return (
                    <article key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-start gap-3 p-3 sm:p-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="min-w-0 flex-1 whitespace-pre-line text-sm font-semibold leading-6 text-slate-950 sm:text-base">{question.prompt ?? "Question"}</h3>
                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className={`rounded-lg border p-3 ${unanswered ? "border-slate-200 bg-slate-50" : isCorrect ? "border-emerald-200 bg-emerald-50/70" : "border-rose-200 bg-rose-50/70"}`}>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Your answer</p>
                              <p className="mt-1 whitespace-pre-line text-sm font-medium leading-5 text-slate-900">{selectedAnswer ?? "No answer selected"}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">Correct answer</p>
                              <p className="mt-1 whitespace-pre-line text-sm font-medium leading-5 text-slate-900">{correctAnswer ?? "Not provided"}</p>
                            </div>
                          </div>
                          {question.explanation && (
                            <div className="mt-3 border-l-2 border-indigo-300 pl-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Explanation</p>
                              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <nav aria-label="Next steps" className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <Link href="/exams" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">Browse exams</Link>
            <Link href={`/exam/${encodeURIComponent(slug)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Exam details</Link>
          </nav>
        </>
      )}
    </main>
  );
}
