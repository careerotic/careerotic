"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Option = { id?: string; option_id?: string; text?: string; option_text?: string; option_order?: number };
type Question = { question_id?: string; id?: string; prompt?: string; question_text?: string; options?: Option[]; selected_option_id?: string | null; question_order?: number };
type Payload = { attemptId?: string; questions?: Question[]; error?: string; expiresAt?: string; resumed?: boolean };

export default function ExamAttemptPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setSelected(Object.fromEntries(ordered.flatMap((question) => {
        const id = question.question_id ?? question.id;
        return id && question.selected_option_id ? [[id, question.selected_option_id]] : [];
      })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start this exam.");
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async () => {
    if (submitting || !attemptId) return;
    const unanswered = questions.findIndex((question) => {
      const id = question.question_id ?? question.id ?? "";
      return !selected[id];
    });
    if (unanswered >= 0) {
      setIndex(unanswered);
      setError("The current database requires every question to be answered before submission. Please answer the remaining questions.");
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
  }, [attemptId, params.slug, questions, router, selected, submitting]);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const next = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) setError("Time has expired. The server will reject further answers and submission if the attempt has expired.");
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const current = questions[index];
  const currentId = current?.question_id ?? current?.id ?? "";
  const options = useMemo(() => [...(current?.options ?? [])].sort((a, b) => Number(a.option_order ?? 0) - Number(b.option_order ?? 0)), [current]);
  const save = async (questionId: string, optionId: string) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/exam/attempt/answer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, optionId }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Answer could not be saved.");
      setNotice("Answer saved");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Answer could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-12"><p className="text-sm text-slate-600">Restoring your exam attempt…</p></main>;
  if (error && !questions.length) return <main className="mx-auto max-w-3xl px-4 py-12"><section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><h1 className="font-semibold">Exam attempt unavailable</h1><p className="mt-2 text-sm">{error}</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={() => void load()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Try again</button><Link href={`/exam/${encodeURIComponent(params.slug)}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Exam details</Link></div></section></main>;
  if (!current) return <main className="mx-auto max-w-3xl px-4 py-12"><p>No questions were returned for this attempt.</p></main>;

  const clock = remaining === null ? "—:—" : `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="sticky top-0 z-10 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Exam in progress</p><h1 className="text-lg font-bold text-slate-950">Question {index + 1} of {questions.length}</h1></div>
        <div aria-live="polite" className={`rounded-lg px-4 py-2 font-mono text-lg font-bold ${remaining !== null && remaining < 60 ? "bg-red-100 text-red-700" : "bg-white text-slate-900"}`}>⏱ {clock}</div>
      </header>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-emerald-700">{notice}</p>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Question {index + 1}</p>
          <h2 className="mt-4 whitespace-pre-line text-lg font-semibold leading-8 text-slate-950">{current.prompt ?? current.question_text ?? "Question text unavailable"}</h2>
          <fieldset className="mt-6 space-y-3">
            <legend className="sr-only">Select one answer</legend>
            {options.map((option, i) => {
              const optionId = option.id ?? option.option_id ?? "";
              const text = option.text ?? option.option_text ?? "";
              const checked = selected[currentId] === optionId;
              return <label key={optionId || i} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" name={currentId} value={optionId} checked={checked} disabled={saving || !optionId || remaining === 0} onChange={() => { setSelected((old) => ({ ...old, [currentId]: optionId })); void save(currentId, optionId); }} className="mt-1 accent-indigo-600" />
                <span className="min-w-0 text-sm leading-6 text-slate-800"><b className="mr-2 text-slate-500">{String.fromCharCode(65 + i)}.</b>{text}</span>
              </label>;
            })}
          </fieldset>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Previous</button>
            {index < questions.length - 1 ? <button onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Next question</button> : <button onClick={() => void submit()} disabled={submitting} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit exam"}</button>}
          </div>
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Question navigator</h2>
          <div className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-4">
            {questions.map((question, i) => {
              const id = question.question_id ?? question.id ?? "";
              return <button key={id || i} onClick={() => setIndex(i)} aria-label={`Go to question ${i + 1}`} aria-current={i === index ? "step" : undefined} className={`grid aspect-square place-items-center rounded-lg border text-sm font-semibold ${i === index ? "border-indigo-600 bg-indigo-600 text-white" : selected[id] ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600"}`}>{i + 1}</button>;
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">{Object.keys(selected).length} of {questions.length} answered. Answers save as you select them.</p>
          <button onClick={() => { if (window.confirm("Submit the exam now? You cannot change answers after submission.")) void submit(); }} disabled={submitting} className="mt-5 w-full rounded-lg border border-emerald-300 px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">Review & submit</button>
        </aside>
      </div>
    </main>
  );
}
