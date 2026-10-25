"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QuestionBankCard from "@/components/questions/QuestionBankCard";
import { Skeleton } from "@/components/ui/Skeleton";

type Option = { id: string; question_id: string; option_text: string; option_order: number };
type Question = {
  id: string;
  topic_id: string;
  prompt: string;
  language: string;
  created_at: string;
  topics: { id: string; name: string; subject_id: string; subjects: { id: string; name: string } | null } | null;
  question_options: Option[];
};
type Answer = { question_id?: string; explanation?: string | null; options?: { id?: string; option_id?: string; option_text?: string; text?: string; option_order?: number }[]; correct_option?: { id?: string; option_id?: string; option_text?: string; text?: string } | null };
type ReportReason = "incorrect_answer" | "incorrect_question" | "unclear_explanation" | "other";

const PAGE_SIZE = 25;
const inputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";
const iconButtonClass = "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function answerFromJson(value: unknown): Answer | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const nested = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
  return {
    question_id: typeof nested.question_id === "string" ? nested.question_id : undefined,
    explanation: typeof nested.explanation === "string" ? nested.explanation : null,
    options: Array.isArray(nested.options) ? nested.options as Answer["options"] : [],
    correct_option: nested.correct_option && typeof nested.correct_option === "object" ? nested.correct_option as Answer["correct_option"] : null,
  };
}


export default function QuestionsClient({ initialQuestions, initialLoadFailed = false, initialPage = 1, initialTotal = 0 }: { initialQuestions: Question[]; initialLoadFailed?: boolean; initialPage?: number; initialTotal?: number }) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const skipInitialQuestionFetch = useRef(true);

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (caught) {
      setError(getErrorMessage(caught));
      setLoading(false);
    }
  }, []);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string; subject_id: string }[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [topicId, setTopicId] = useState("all");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, boolean>>({});
  const [answerLoading, setAnswerLoading] = useState<Record<string, boolean>>({});
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});
  const preloadInFlight = useRef(new Set<string>());
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [loginPromptQuestion, setLoginPromptQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(initialLoadFailed);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reportQuestion, setReportQuestion] = useState<Question | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("incorrect_answer");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    async function loadTaxonomy() {
      try {
        const response = await fetch("/api/public/taxonomy");
        if (!response.ok) throw new Error("Unable to load filters.");
        const payload = await response.json() as {
          subjects: { id: string; name: string; slug: string }[];
          topics: { id: string; name: string; subject_id: string }[];
        };
        if (!active) return;
        setSubjects(payload.subjects.map(({ id, name }) => ({ id, name })));
        setTopics(payload.topics);
      } catch {
        if (active) setError("Unable to load filters.");
      }
    }
    void loadTaxonomy();
    return () => { active = false; };
  }, [supabase]);

  const availableTopics = useMemo(
    () => topics.filter((topic) => subjectId === "all" || topic.subject_id === subjectId),
    [topics, subjectId],
  );

  const loadQuestions = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        subjectId,
        topicId,
        language,
        search,
        sort,
      });
      const response = await fetch(`/api/public/questions?${params.toString()}`);
      if (!response.ok) throw new Error("Questions could not be loaded. Please try again.");
      const result = await response.json() as { questions: Question[]; total: number };
      const normalized = (result.questions ?? []).map((question) => ({
        ...question,
        question_options: [...(question.question_options ?? [])].sort((a, b) => a.option_order - b.option_order),
      }));
      setQuestions(normalized);
      setTotal(result.total ?? 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Questions could not be loaded.");
      setQuestions([]);
      setTotal(0);
    }
    setLoading(false);
  }, [supabase, page, subjectId, topicId, language, search, sort]);

  useEffect(() => {
    if (!supabase) return;
    if (skipInitialQuestionFetch.current) {
      skipInitialQuestionFetch.current = false;
      if (
        !initialLoadFailed &&
        page === initialPage &&
        subjectId === "all" &&
        topicId === "all" &&
        language === "all" &&
        search === "" &&
        sort === "newest"
      ) return;
    }
    void loadQuestions();
  }, [loadQuestions, supabase, initialLoadFailed, initialPage, page, subjectId, topicId, language, search, sort]);

  useEffect(() => {
    if (!supabase || questions.length === 0) return;
    let active = true;

    async function preloadAnswers() {
      const missing = questions.filter(
        (question) => !answers[question.id] && !preloadInFlight.current.has(question.id),
      );
      for (let index = 0; index < missing.length; index += 5) {
        const batch = missing.slice(index, index + 5);
        batch.forEach((question) => preloadInFlight.current.add(question.id));
        let payload: { answers?: Record<string, unknown> } | null = null;
        try {
          const response = await fetch("/api/questions/answers?ids=" + encodeURIComponent(batch.map((question) => question.id).join(",")));
          if (response.ok) payload = await response.json() as { answers?: Record<string, unknown> };
        } catch {
          // Preloading is best-effort; the Show answer action retries on demand.
        } finally {
          batch.forEach((question) => preloadInFlight.current.delete(question.id));
        }

        if (!active) return;
        const results = batch.map((question) => {
          const parsed = answerFromJson(payload?.answers?.[question.id]);
          return parsed ? [question.id, parsed] as const : null;
        });
        if (results.some((result) => result !== null)) {
          setAnswers((current) => {
            const next = { ...current };
            results.forEach((result) => { if (result) next[result[0]] = result[1]; });
            return next;
          });
        }
      }
    }

    void preloadAnswers();
    return () => { active = false; };
  }, [questions, supabase, answers]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const db = client as NonNullable<typeof client>;
    let active = true;
    async function loadBookmarks() {
      const { data: userResult } = await db.auth.getUser();
      if (!active || !userResult.user || questions.length === 0) return;
      const { data } = await db.from("question_bookmarks").select("question_id").in("question_id", questions.map((q) => q.id));
      if (!active) return;
      setBookmarks((current) => {
        const next = { ...current };
        questions.forEach((q) => { next[q.id] = false; });
        (data ?? []).forEach((row) => { next[row.question_id] = true; });
        return next;
      });
    }
    void loadBookmarks();
    return () => { active = false; };
  }, [questions, supabase]);

  // Complete a guest's pending save after sign-in. Use getSession (which
  // safely returns a null session for guests) and auth-state events instead of
  // getUser, which throws "Auth session missing!" when no session is present.
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const pendingUrl = new URL(window.location.href);
    const pendingQuestionId = pendingUrl.searchParams.get("saveQuestion");
    if (!pendingQuestionId) return;
    const questionId = pendingQuestionId;

    let active = true;
    let saving = false;
    let saved = false;

    async function savePendingBookmark(userId: string) {
      if (!active || saving || saved) return;
      saving = true;
      try {
        const { error: saveError } = await client
          .from("question_bookmarks")
          .upsert(
            { question_id: questionId, user_id: userId },
            { onConflict: "user_id,question_id", ignoreDuplicates: true },
          );
        if (!active) return;
        if (saveError) throw saveError;

        saved = true;
        setBookmarks((current) => ({ ...current, [questionId]: true }));
        setNotice("Question saved successfully.");
        setError("");
        pendingUrl.searchParams.delete("saveQuestion");
        window.history.replaceState({}, "", pendingUrl.pathname + pendingUrl.search + pendingUrl.hash);
      } catch (caught) {
        if (active) setError(getErrorMessage(caught));
      } finally {
        saving = false;
      }
    }

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void savePendingBookmark(session.user.id);
    });

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError("Unable to verify your login. Please try again.");
        return;
      }
      if (data.session?.user) void savePendingBookmark(data.session.user.id);
      // No session is a normal guest state; wait for sign-in without showing
      // an auth error or removing the pending question from the URL.
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Reset pagination in filter handlers, not on mount, so URL page=N survives initial render.

  async function toggleAnswer(question: Question) {
    if (openAnswers[question.id]) {
      setOpenAnswers((current) => ({ ...current, [question.id]: false }));
      return;
    }
    if (answers[question.id]) {
      setAnswerErrors((current) => ({ ...current, [question.id]: "" }));
      setOpenAnswers((current) => ({ ...current, [question.id]: true }));
      return;
    }
    if (answerLoading[question.id]) return;

    setAnswerLoading((current) => ({ ...current, [question.id]: true }));
    setAnswerErrors((current) => ({ ...current, [question.id]: "" }));
    try {
      const response = await fetch("/api/questions/answers?ids=" + encodeURIComponent(question.id));
      if (!response.ok) throw new Error("Could not load the answer. Please try again.");
      const payload = await response.json() as { answers?: Record<string, unknown> };
      const answer = answerFromJson(payload.answers?.[question.id]);
      if (!answer?.correct_option) throw new Error("The answer is not available for this question.");
      setAnswers((current) => ({ ...current, [question.id]: answer }));
      setOpenAnswers((current) => ({ ...current, [question.id]: true }));
    } catch (caught) {
      setAnswerErrors((current) => ({
        ...current,
        [question.id]: caught instanceof Error ? caught.message : "Could not load the answer. Please try again.",
      }));
    } finally {
      setAnswerLoading((current) => ({ ...current, [question.id]: false }));
    }
  }

  async function toggleBookmark(question: Question) {
    if (!supabase) { setNotice("Supabase is not configured for this deployment."); return; }
    setError("");
    setNotice("");
    const { data: userResult, error: authError } = await supabase.auth.getUser();
    if (authError || !userResult.user) {
      // Keep guests on the current page until they explicitly choose to sign in.
      setLoginPromptQuestion(question);
      return;
    }
    if (bookmarks[question.id]) {
      const { error: deleteError } = await supabase.from("question_bookmarks").delete().eq("question_id", question.id).eq("user_id", userResult.user.id);
      if (deleteError) { setError(deleteError.message); return; }
      setBookmarks((current) => ({ ...current, [question.id]: false }));
    } else {
      const { error: insertError } = await supabase.from("question_bookmarks").insert({ question_id: question.id, user_id: userResult.user.id });
      if (insertError) { setError(insertError.message); return; }
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
      setError(getErrorMessage(caught));
    } finally {
      setReportBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5 text-slate-900 sm:px-5 sm:py-7">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Questions</h1>
            <p className="mt-1 text-sm text-slate-500">Browse published questions by subject and topic.</p>
          </div>
          <button type="button" onClick={() => setMobileFiltersOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 md:hidden" aria-expanded={mobileFiltersOpen}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M7 12h10m-7 6h4" strokeLinecap="round" /></svg>
            Filters
          </button>
        </div>

        <div className="space-y-3">
          <label className="relative block">
            <span className="sr-only">Search questions</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" strokeLinecap="round" /></svg>
            <input value={searchInput} onChange={(event) => { setSearchInput(event.target.value); setPage(1); }} placeholder="Search questions..." className={`${inputClass} pl-9`} />
          </label>
          <div className={`${mobileFiltersOpen ? "grid" : "hidden"} grid-cols-1 gap-2 sm:grid-cols-2 md:grid md:grid-cols-4`}>
            <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Subject</span><select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId("all"); setPage(1); }} className={inputClass}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Topic</span><select value={topicId} onChange={(event) => { setTopicId(event.target.value); setPage(1); }} className={inputClass}><option value="all">All topics</option>{availableTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Language</span><select value={language} onChange={(event) => { setLanguage(event.target.value); setPage(1); }} className={inputClass}><option value="all">All languages</option><option value="bn">বাংলা</option><option value="en">English</option></select></label>
            <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Sort</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className={inputClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
          </div>
        </div>

        {(error || notice) && <div role={error || notice === "Sign in to save questions." ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-indigo-100 bg-indigo-50 text-indigo-800"}`}>
          <span>{error || notice}</span>
          {!error && notice === "Sign in to save questions." && <span className="ml-2 inline-flex flex-wrap gap-2 font-semibold"><a className="underline" href={`/login?next=${encodeURIComponent("/questions")}`}>Sign in</a><a className="underline" href={`/signup?next=${encodeURIComponent("/questions")}`}>Create account</a></span>}
        </div>}

        <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm">
          <span className="font-medium text-slate-700">Question bank</span>
          <span className="text-slate-500">{loading ? "Loading…" : total === 0 ? "0 questions" : `${firstItem}–${lastItem} of ${total}`}</span>
        </div>

        {loading ? <div className="space-y-3" role="status" aria-label="Loading questions" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="rounded-lg border border-slate-200 bg-white p-4"><Skeleton className="mb-3 h-3 w-40 rounded bg-slate-200" /><Skeleton className="mb-4 h-4 w-3/4 rounded bg-slate-200" /><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-9 rounded bg-slate-100" />)}</div></Skeleton>)}</div>
          : questions.length === 0 ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center"><p className="font-medium text-slate-800">No questions found</p><p className="mt-1 text-sm text-slate-500">Try another search or change your filters.</p></div>
          : <div className="space-y-3">{questions.map((question) => (
              <QuestionBankCard
                key={question.id}
                question={question}
                subject={question.topics?.subjects?.name ?? "Subject"}
                topic={question.topics?.name ?? "Topic"}
                answer={answers[question.id]}
                isOpen={Boolean(openAnswers[question.id])}
                answerLoading={Boolean(answerLoading[question.id])}
                answerError={answerErrors[question.id]}
                onToggleAnswer={() => void toggleAnswer(question)}
                bookmarked={Boolean(bookmarks[question.id])}
                onToggleBookmark={() => void toggleBookmark(question)}
                onReport={() => { setReportQuestion(question); setReportReason("incorrect_answer"); setReportDetails(""); }}
              />
            ))}</div>}

        <nav aria-label="Question pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <p className="text-sm text-slate-500">Page {page} of {totalPages} · 25 per page</p>
          <div className="flex items-center gap-2">
            {page > 1 ? <a href={page === 2 ? "/questions" : `/questions?page=${page - 1}`} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Previous</a> : <span aria-disabled="true" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm opacity-40">Previous</span>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => Math.max(1, Math.min(page - 2, totalPages - 4)) + i).map((number) => <a key={number} href={number === 1 ? "/questions" : `/questions?page=${number}`} aria-current={number === page ? "page" : undefined} className={`rounded-md border px-3 py-2 text-sm font-medium ${number === page ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-300 bg-white text-slate-700"}`}>{number}</a>)}
            {page < totalPages ? <a href={`/questions?page=${page + 1}`} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Next</a> : <span aria-disabled="true" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm opacity-40">Next</span>}
          </div>
        </nav>
      </div>

      {loginPromptQuestion && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginPromptQuestion(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="save-login-title" aria-describedby="save-login-description" className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
          <h2 id="save-login-title" className="text-lg font-semibold text-slate-900">Log in to save this question?</h2>
          <p id="save-login-description" className="mt-2 text-sm leading-6 text-slate-600">You need an account to save questions. You can keep browsing, or log in now and we’ll save this question for you.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setLoginPromptQuestion(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Cancel</button>
            <button type="button" onClick={() => {
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set("saveQuestion", loginPromptQuestion.id);
              const next = currentUrl.pathname + currentUrl.search + currentUrl.hash;
              window.location.assign("/login?next=" + encodeURIComponent(next));
            }} className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Login</button>
          </div>
        </section>
      </div>}

      {reportQuestion && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !reportBusy) setReportQuestion(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-3"><div><h2 id="report-title" className="font-semibold text-slate-900">Report question</h2><p className="mt-1 line-clamp-2 text-sm text-slate-500">{reportQuestion.prompt}</p></div><button type="button" onClick={() => setReportQuestion(null)} disabled={reportBusy} className={iconButtonClass} aria-label="Close report dialog">×</button></div>
          <form onSubmit={submitReport} className="space-y-3">
            <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Reason</span><select className={inputClass} value={reportReason} onChange={(event) => setReportReason(event.target.value as ReportReason)}><option value="incorrect_answer">Incorrect answer</option><option value="incorrect_question">Incorrect question</option><option value="unclear_explanation">Unclear explanation</option><option value="other">Other</option></select></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Details (optional)</span><textarea className={inputClass} rows={3} maxLength={1000} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Tell us what needs to be corrected." /></label>
            <div className="flex justify-end gap-2"><button type="button" disabled={reportBusy} onClick={() => setReportQuestion(null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Cancel</button><button type="submit" disabled={reportBusy} className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50">{reportBusy ? "Submitting…" : "Submit report"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
