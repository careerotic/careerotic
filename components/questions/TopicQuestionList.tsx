"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearClientCache, readClientCache, writeClientCache } from "@/lib/cache/client-memory";
import QuestionBankCard, { type QuestionBankAnswer } from "@/components/questions/QuestionBankCard";

type Option = { id: string; option_text: string; option_order: number };
type Question = { id: string; prompt: string; language: string; question_options: Option[] };
type ReportReason = "incorrect_answer" | "incorrect_question" | "unclear_explanation" | "other";
type AnswerPayload = QuestionBankAnswer & { question_id?: string; options?: unknown[] };

function parseAnswer(value: unknown): AnswerPayload | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const nested = raw.data && typeof raw.data === "object" ? raw.data as Record<string, unknown> : raw;
  return {
    question_id: typeof nested.question_id === "string" ? nested.question_id : undefined,
    explanation: typeof nested.explanation === "string" ? nested.explanation : null,
    correct_option: nested.correct_option && typeof nested.correct_option === "object"
      ? nested.correct_option as AnswerPayload["correct_option"]
      : null,
    options: Array.isArray(nested.options) ? nested.options : [],
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function TopicQuestionList({
  questions,
  subject,
  topic,
}: {
  questions: Question[];
  subject: string;
  topic: string;
}) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [loginPromptQuestion, setLoginPromptQuestion] = useState<Question | null>(null);
  const [reportQuestion, setReportQuestion] = useState<Question | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("incorrect_answer");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, []);

  useEffect(() => {
    if (!supabase || questions.length === 0) return;
    let active = true;
    async function loadBookmarks() {
      const { data: userResult } = await supabase!.auth.getUser();
      if (!active || !userResult.user) return;
      const { data } = await supabase!.from("question_bookmarks")
        .select("question_id")
        .in("question_id", questions.map((question) => question.id));
      if (!active) return;
      setBookmarks((current) => {
        const next = { ...current };
        questions.forEach((question) => { next[question.id] = false; });
        (data ?? []).forEach((row) => { next[row.question_id] = true; });
        return next;
      });
    }
    void loadBookmarks();
    return () => { active = false; };
  }, [questions, supabase]);

  // Honour a bookmark request carried through login/signup, matching the question-bank page.
  useEffect(() => {
    if (!supabase) return;
    const url = new URL(window.location.href);
    const questionId = url.searchParams.get("saveQuestion");
    if (!questionId || !questions.some((question) => question.id === questionId)) return;
    let active = true;
    let busy = false;
    async function saveAfterLogin(userId: string) {
      if (!active || busy) return;
      busy = true;
      try {
        const { error: saveError } = await supabase!.from("question_bookmarks")
          .upsert({ question_id: questionId, user_id: userId }, { onConflict: "user_id,question_id", ignoreDuplicates: true });
        if (saveError) throw saveError;
        if (!active) return;
        clearClientCache(`private:${userId}:saved-questions`);
        setBookmarks((current) => ({ ...current, [questionId]: true }));
        setNotice("Question saved successfully.");
        url.searchParams.delete("saveQuestion");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      } catch (caught) {
        if (active) setError(errorMessage(caught));
      } finally {
        busy = false;
      }
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void saveAfterLogin(session.user.id);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void saveAfterLogin(data.session.user.id);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [questions, supabase]);

  async function toggleAnswer(question: Question) {
    if (opened[question.id]) {
      setOpened((current) => ({ ...current, [question.id]: false }));
      return;
    }
    if (answers[question.id]) {
      setErrors((current) => ({ ...current, [question.id]: "" }));
      setOpened((current) => ({ ...current, [question.id]: true }));
      return;
    }
    const cached = readClientCache<AnswerPayload>(`public:answer:${question.id}`, 2 * 60 * 1000, 10 * 60 * 1000);
    if (cached) {
      setAnswers((current) => ({ ...current, [question.id]: cached.data }));
      setOpened((current) => ({ ...current, [question.id]: true }));
      return;
    }
    if (loading[question.id]) return;
    setLoading((current) => ({ ...current, [question.id]: true }));
    setErrors((current) => ({ ...current, [question.id]: "" }));
    try {
      const response = await fetch("/api/questions/answers?ids=" + encodeURIComponent(question.id));
      if (!response.ok) throw new Error("Could not load the answer. Please try again.");
      const payload = await response.json() as { answers?: Record<string, unknown> };
      const answer = parseAnswer(payload.answers?.[question.id]);
      if (!answer?.correct_option) throw new Error("The answer is not available for this question.");
      writeClientCache(`public:answer:${question.id}`, answer);
      setAnswers((current) => ({ ...current, [question.id]: answer }));
      setOpened((current) => ({ ...current, [question.id]: true }));
    } catch (caught) {
      setErrors((current) => ({ ...current, [question.id]: errorMessage(caught) }));
    } finally {
      setLoading((current) => ({ ...current, [question.id]: false }));
    }
  }

  async function toggleBookmark(question: Question) {
    if (!supabase) { setError("Supabase is not configured for this deployment."); return; }
    setError("");
    setNotice("");
    const { data: userResult, error: authError } = await supabase.auth.getUser();
    if (authError || !userResult.user) {
      setLoginPromptQuestion(question);
      return;
    }
    if (bookmarks[question.id]) {
      const { error: deleteError } = await supabase.from("question_bookmarks")
        .delete().eq("question_id", question.id).eq("user_id", userResult.user.id);
      if (deleteError) { setError(deleteError.message); return; }
      clearClientCache(`private:${userResult.user.id}:saved-questions`);
      setBookmarks((current) => ({ ...current, [question.id]: false }));
    } else {
      const { error: insertError } = await supabase.from("question_bookmarks")
        .insert({ question_id: question.id, user_id: userResult.user.id });
      if (insertError) { setError(insertError.message); return; }
      clearClientCache(`private:${userResult.user.id}:saved-questions`);
      setBookmarks((current) => ({ ...current, [question.id]: true }));
    }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportQuestion) return;
    if (!supabase) { setError("Supabase is not configured for this deployment."); return; }
    setReportBusy(true);
    setError("");
    setNotice("");
    try {
      const { data: userResult, error: authError } = await supabase.auth.getUser();
      if (authError || !userResult.user) {
        setNotice("Sign in to report a question.");
        return;
      }
      const { error: insertError } = await supabase.from("question_reports").insert({
        question_id: reportQuestion.id,
        user_id: userResult.user.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });
      if (insertError) throw insertError;
      setNotice("Thank you. Your report has been submitted.");
      setReportQuestion(null);
      setReportDetails("");
      setReportReason("incorrect_answer");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setReportBusy(false);
    }
  }

  function authUrl(path: "/login" | "/signup", question?: Question) {
    const currentUrl = new URL(window.location.href);
    if (question) currentUrl.searchParams.set("saveQuestion", question.id);
    return `${path}?next=${encodeURIComponent(currentUrl.pathname + currentUrl.search + currentUrl.hash)}`;
  }

  return (
    <>
      {(error || notice) && (
        <div role={error ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-indigo-100 bg-indigo-50 text-indigo-800"}`}>
          {error || notice}
          {!error && notice === "Sign in to report a question." && <span className="ml-2 inline-flex gap-2 font-semibold"><a className="underline" href={authUrl("/login")}>Sign in</a><a className="underline" href={authUrl("/signup")}>Create account</a></span>}
        </div>
      )}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <QuestionBankCard
            key={question.id}
            question={question}
            subject={subject}
            topic={topic}
            numberLabel={`Question ${index + 1}`}
            answer={answers[question.id]}
            isOpen={Boolean(opened[question.id])}
            answerLoading={Boolean(loading[question.id])}
            answerError={errors[question.id]}
            bookmarked={Boolean(bookmarks[question.id])}
            onToggleAnswer={() => void toggleAnswer(question)}
            onToggleBookmark={() => void toggleBookmark(question)}
            onReport={() => { setReportQuestion(question); setReportReason("incorrect_answer"); setReportDetails(""); }}
          />
        ))}
      </div>

      {loginPromptQuestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginPromptQuestion(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="topic-save-login-title" className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 id="topic-save-login-title" className="text-lg font-semibold text-slate-900">Log in to save this question?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">You need an account to save questions. You can keep browsing, or log in now and we’ll save this question for you.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setLoginPromptQuestion(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <a href={authUrl("/signup", loginPromptQuestion)} className="rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Create account</a>
              <a href={authUrl("/login", loginPromptQuestion)} className="rounded-md bg-indigo-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-800">Login</a>
            </div>
          </section>
        </div>
      )}

      {reportQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !reportBusy) setReportQuestion(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="topic-report-title" className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div><h2 id="topic-report-title" className="font-semibold text-slate-900">Report question</h2><p className="mt-1 line-clamp-2 text-sm text-slate-500">{reportQuestion.prompt}</p></div>
              <button type="button" onClick={() => setReportQuestion(null)} disabled={reportBusy} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Close report dialog">×</button>
            </div>
            <form onSubmit={(event) => void submitReport(event)} className="space-y-3">
              <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Reason</span><select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" value={reportReason} onChange={(event) => setReportReason(event.target.value as ReportReason)}><option value="incorrect_answer">Incorrect answer</option><option value="incorrect_question">Incorrect question</option><option value="unclear_explanation">Unclear explanation</option><option value="other">Other</option></select></label>
              <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Details (optional)</span><textarea className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" rows={3} maxLength={1000} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Tell us what needs to be corrected." /></label>
              <div className="flex justify-end gap-2"><button type="button" disabled={reportBusy} onClick={() => setReportQuestion(null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button><button type="submit" disabled={reportBusy} className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50">{reportBusy ? "Submitting…" : "Submit report"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
