"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Option = { id?: string; option_id?: string; text?: string; option_text?: string; option_order?: number };
type Question = { question_id?: string; id?: string; prompt?: string; question_text?: string; options?: Option[]; selected_option_id?: string | null; question_order?: number };
type Payload = { attemptId?: string; questions?: Question[]; error?: string; expiresAt?: string; resumed?: boolean };
type SaveState = "saving" | "saved" | "error";

const questionIdOf = (question: Question) => question.question_id ?? question.id ?? "";

export default function ExamAttemptPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestVersions = useRef<Record<string, number>>({});
  const selectedRef = useRef<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/exam/${encodeURIComponent(params.slug)}/attempt`, { method: "POST", cache: "no-store" });
      const payload = await response.json() as Payload;
      if (!response.ok) throw new Error(payload.error || "Unable to start or resume the attempt.");
      if (!payload.attemptId || !Array.isArray(payload.questions)) throw new Error("The server returned an invalid attempt response.");
      setAttemptId(payload.attemptId);
      setDeadline(payload.expiresAt ? new Date(payload.expiresAt).getTime() : null);
      const ordered = [...payload.questions].sort((a, b) => Number(a.question_order ?? 0) - Number(b.question_order ?? 0));
      setQuestions(ordered);
      const restored = Object.fromEntries(ordered.flatMap((question) => {
        const id = questionIdOf(question);
        return id && question.selected_option_id ? [[id, question.selected_option_id]] : [];
      }));
      selectedRef.current = restored;
      setSelected(restored);
      setSaveState({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start this exam.");
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (questionId: string, optionId: string) => {
    const previous = selectedRef.current[questionId];
    const version = (requestVersions.current[questionId] ?? 0) + 1;
    requestVersions.current[questionId] = version;
    selectedRef.current = { ...selectedRef.current, [questionId]: optionId };
    setSelected((old) => ({ ...old, [questionId]: optionId }));
    setSaveState((old) => ({ ...old, [questionId]: "saving" }));
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/exam/attempt/answer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, optionId }),
      });
      const payload = await response.json() as { error?: string; saved?: boolean };
      if (!response.ok || !payload.saved) throw new Error(payload.error || "Answer could not be saved. Please select the option again to retry.");
      if (requestVersions.current[questionId] === version) {
        setSaveState((old) => ({ ...old, [questionId]: "saved" }));
        setNotice("All changes are saved on the server.");
      }
    } catch (cause) {
      if (requestVersions.current[questionId] === version) {
        const next = { ...selectedRef.current };
        if (previous) next[questionId] = previous;
        else delete next[questionId];
        selectedRef.current = next;
        setSelected(next);
        setSaveState((old) => ({ ...old, [questionId]: "error" }));
        setError(cause instanceof Error ? cause.message : "Answer could not be saved. Please try again.");
      }
    }
  }, []);

  const answeredCount = Object.keys(selected).filter((id) => Boolean(selected[id])).length;
  const pendingCount = Object.values(saveState).filter((state) => state === "saving").length;
  const failedCount = Object.values(saveState).filter((state) => state === "error").length;
  const unansweredCount = questions.length - answeredCount;

  const submit = useCallback(async () => {
    if (submitting || !attemptId) return;
    if (pendingCount > 0) {
      setError("Please wait while your answers finish saving.");
      return;
    }
    if (failedCount > 0) {
      setError("At least one answer failed to save. Re-select the affected option before submitting.");
      return;
    }
    if (unansweredCount > 0) {
      const first = questions.find((question) => !selected[questionIdOf(question)]);
      setError(`Please answer all questions before submitting. ${unansweredCount} remaining.`);
      if (first) document.getElementById(`question-${questionIdOf(first)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/exam/attempt/submit", { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Submission failed.");
      router.replace(`/exam/${encodeURIComponent(params.slug)}/result`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Submission failed.");
      setSubmitting(false);
    }
  }, [attemptId, failedCount, params.slug, pendingCount, questions, router, selected, submitting, unansweredCount]);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const next = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) setError("Time has expired. The server controls the attempt deadline.");
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (loading) return <main className="mx-auto max-w-5xl px-3 py-6 sm:px-5"><p className="text-sm text-slate-600">Restoring your saved exam answers…</p></main>;
  if (error && !questions.length) return <main className="mx-auto max-w-3xl px-3 py-6 sm:px-5"><section role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"><h1 className="font-semibold">Exam attempt unavailable</h1><p className="mt-2 text-sm">{error}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void load()} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Try again</button><Link href={`/exam/${encodeURIComponent(params.slug)}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Exam details</Link></div></section></main>;
  if (!questions.length) return <main className="mx-auto max-w-3xl px-3 py-6 sm:px-5"><p>No questions were returned for this attempt.</p></main>;

  const clock = remaining === null ? "—:—" : `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
  return (
    <main className="mx-auto max-w-5xl px-3 pb-24 pt-3 sm:px-5 sm:pt-5">
      <header className="sticky top-0 z-20 -mx-3 mb-3 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Exam in progress</p>
            <h1 className="text-base font-bold leading-6 text-slate-950">All questions <span className="font-normal text-slate-500">· {questions.length} total</span></h1>
          </div>
          <div className={`rounded-md px-3 py-1.5 font-mono text-base font-bold tabular-nums ${remaining !== null && remaining < 60 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-900"}`} aria-label={`Time remaining ${clock}`}>⏱ {clock}</div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}>
            <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-slate-600">{answeredCount}/{questions.length} answered</p>
        </div>
      </header>

      {error && <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {notice && !error && <p role="status" className="mb-3 text-xs text-emerald-700">{notice}</p>}

      <div className="space-y-3">
        {questions.map((question, index) => {
          const questionId = questionIdOf(question);
          const options = [...(question.options ?? [])].sort((a, b) => Number(a.option_order ?? 0) - Number(b.option_order ?? 0));
          const currentSelection = selected[questionId] ?? "";
          const status = saveState[questionId];
          return (
            <section id={`question-${questionId}`} key={questionId || index} className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <div className="mb-2 flex items-start gap-2">
                <span className="grid h-7 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">{index + 1}</span>
                <h2 className="min-w-0 flex-1 whitespace-pre-line text-sm font-semibold leading-6 text-slate-950 sm:text-base">{question.prompt ?? question.question_text ?? "Question text unavailable"}</h2>
                <span className="shrink-0 pt-1 text-[11px] font-medium text-slate-500" aria-live="polite">
                  {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Not saved" : currentSelection ? "Selected" : ""}
                </span>
              </div>
              <fieldset className="grid gap-1.5 sm:grid-cols-2">
                <legend className="sr-only">Choose one answer for question {index + 1}</legend>
                {options.map((option, optionIndex) => {
                  const optionId = option.id ?? option.option_id ?? "";
                  const text = option.text ?? option.option_text ?? "";
                  const checked = currentSelection === optionId;
                  return (
                    <label key={optionId || optionIndex} className={`flex min-w-0 cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 transition-colors ${checked ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"} ${remaining === 0 || submitting ? "cursor-not-allowed opacity-60" : ""}`}>
                      <input type="radio" name={questionId} value={optionId} checked={checked} disabled={remaining === 0 || submitting || !optionId} onChange={() => { if (optionId) void save(questionId, optionId); }} className="mt-1 shrink-0 accent-indigo-600" />
                      <span className="min-w-0 text-sm leading-5 text-slate-800"><b className="mr-1.5 text-xs text-slate-500">{String.fromCharCode(65 + optionIndex)}.</b>{text}</span>
                    </label>
                  );
                })}
              </fieldset>
              {status === "error" && <p className="mt-2 text-xs text-red-700">Your last choice was not saved. Select an option again to retry.</p>}
            </section>
          );
        })}
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-600">{unansweredCount === 0 ? "All questions answered" : `${unansweredCount} unanswered`} · {pendingCount > 0 ? `${pendingCount} saving` : failedCount > 0 ? `${failedCount} failed to save` : "Server save status up to date"}</p>
          <button onClick={() => { if (window.confirm("Submit this exam? Submission is final and answers cannot be changed afterward.")) void submit(); }} disabled={submitting || pendingCount > 0 || failedCount > 0 || unansweredCount > 0 || remaining === 0} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">{submitting ? "Submitting…" : "Submit exam"}</button>
        </div>
      </footer>
    </main>
  );
}
