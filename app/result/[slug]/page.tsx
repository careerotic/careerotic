import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/exams/attempt-server";
import { LAST_ATTEMPT_COOKIE } from "@/lib/exams/attempt-server";

type Props = { params: Promise<{ slug: string }> };
type Result = { score?: number; correct_count?: number; incorrect_count?: number; questions?: { prompt?: string; selected_is_correct?: boolean; explanation?: string; selected_option?: { text?: string; option_text?: string } | null; correct_option?: { text?: string; option_text?: string } | null }[] };

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
    const { createHash } = await import("node:crypto");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    if (!exam || !attempt || attempt.exam_id !== exam.id) errorMessage = "No result for this exam was found in this browser.";
    else if (attempt.status !== "submitted") errorMessage = "This attempt has not been submitted, so its result is not available yet.";
    else if (attempt.attempt_token_hash !== tokenHash) errorMessage = "This browser is not authorized to view this result.";
    else {
      const response = await supabase.rpc("get_attempt_result", { p_attempt_id: attemptId, p_attempt_token: token });
      if (response.error) errorMessage = "Your result could not be loaded. Please refresh and try again.";
      else if (response.data && typeof response.data === "object") result = response.data as Result;
    }
  } else {
    errorMessage = "No submitted attempt was found in this browser.";
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Exam results</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Your result</h1>
        {!result ? <div role="status" className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{errorMessage || "The result is not available yet. Submit the exam first."}</div> : <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Score", result.score ?? "—"],
              ["Correct", result.correct_count ?? "—"],
              ["Incorrect", result.incorrect_count ?? "—"],
              ["Questions", result.questions?.length ?? "—"],
            ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></div>)}
          </div>
          {Array.isArray(result.questions) && <div className="mt-8 space-y-4">
            <h2 className="text-lg font-bold">Answer review</h2>
            {result.questions.map((question, index) => <article key={index} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="font-semibold leading-6">{index + 1}. {question.prompt ?? "Question"}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${question.selected_is_correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{question.selected_is_correct ? "Correct" : "Incorrect"}</span></div>
              <p className="mt-3 text-sm text-slate-600">Your answer: {question.selected_option?.text ?? question.selected_option?.option_text ?? "—"}</p>
              <p className="mt-1 text-sm text-slate-600">Correct answer: {question.correct_option?.text ?? question.correct_option?.option_text ?? "—"}</p>
              {question.explanation && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{question.explanation}</p>}
            </article>)}
          </div>}
        </>}
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/exams" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Browse exams</Link><Link href={`/exam/${encodeURIComponent(slug)}`} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Exam details</Link></div>
      </section>
    </main>
  );
}
