import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createAdminClient, GUEST_ID_COOKIE, sha256 } from "@/lib/exams/attempt-server";
import { createClient } from "@/lib/supabase/server";
import { getCachedHomePublicData } from "@/lib/cache/public-data";
import CommunityAnalytics from "@/app/components/home/community-analytics";

const primaryButton =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1";
const secondaryButton =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
      <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Exam Practice & Question Bank",
  description:
    "Practise published questions by subject, review answers and explanations, and take available competitive exam practice tests on Careerotic.",
  alternates: { canonical: "/" },
};

type FeaturedQuestion = {
  id: string;
  prompt: string;
  language: string;
  topics: { name: string; subjects: { name: string } | null } | null;
  question_options: { id: string; option_text: string; option_order: number }[] | null;
};

type SnapshotQuestion = {
  question_id?: string;
  prompt?: string;
  selected_is_correct?: boolean;
  selected_option?: unknown;
  selected_option_id?: string | null;
};

type AttemptSnapshot = {
  score?: number;
  questions?: SnapshotQuestion[];
};

type AnalyticsAttempt = {
  id: string;
  started_at: string;
  submitted_at: string | null;
  result_snapshot: unknown;
  exams: { title: string; slug: string } | null;
};

type QuestionTaxonomy = {
  id: string;
  prompt: string;
  topics: { name: string; subjects: { name: string; slug: string } | null } | null;
};

type SubjectPerformance = {
  name: string;
  slug: string;
  answered: number;
  correct: number;
  accuracy: number;
};

type DifficultQuestion = {
  questionId: string;
  prompt: string;
  subjectName: string;
  subjectSlug: string;
  answered: number;
  incorrect: number;
  incorrectRate: number;
};

type HomeAnalytics = {
  hasIdentity: boolean;
  submittedAttempts: number;
  answered: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
  subjectPerformance: SubjectPerformance[];
  recentAttempts: { id: string; title: string; slug: string; submittedAt: string | null; score: number | null }[];
  difficultQuestions: DifficultQuestion[];
  personalError: boolean;
};

function snapshotQuestions(value: unknown): SnapshotQuestion[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const questions = (value as AttemptSnapshot).questions;
  return Array.isArray(questions)
    ? questions.filter((item): item is SnapshotQuestion => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    : [];
}

function hasSelectedAnswer(question: SnapshotQuestion) {
  return Boolean(question.selected_option || question.selected_option_id);
}

async function getHomeAnalytics(userId: string | null): Promise<HomeAnalytics> {
  const empty: HomeAnalytics = {
    hasIdentity: Boolean(userId),
    submittedAttempts: 0,
    answered: 0,
    correct: 0,
    incorrect: 0,
    accuracy: null,
    subjectPerformance: [],
    recentAttempts: [],
    difficultQuestions: [],
    personalError: false,
  };

  try {
    const store = await cookies();
    const rawGuestIdentity = store.get(GUEST_ID_COOKIE)?.value;
    const guestHash = rawGuestIdentity && /^[a-f0-9]{64}$/.test(rawGuestIdentity)
      ? sha256(rawGuestIdentity)
      : null;
    const hasIdentity = Boolean(userId || guestHash);
    const admin = createAdminClient();

    let personalRows: AnalyticsAttempt[] = [];
    let submittedAttempts = 0;
    let personalError = false;
    if (userId || guestHash) {
      let personalQuery = admin
        .from("exam_attempts")
        .select("id,started_at,submitted_at,result_snapshot,exams(title,slug)", { count: "exact" })
        .eq("status", "submitted")
        .not("result_snapshot", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(30);
      personalQuery = userId
        ? personalQuery.eq("user_id", userId)
        : personalQuery.eq("guest_identity_hash", guestHash as string);
      const { data, count, error } = await personalQuery;
      if (error) {
        personalError = true;
      } else {
        personalRows = (data ?? []) as unknown as AnalyticsAttempt[];
        submittedAttempts = count ?? personalRows.length;
      }
    }

    const { data: globalRows, error: globalError } = await admin
      .from("exam_attempts")
      .select("result_snapshot,submitted_at")
      .eq("status", "submitted")
      .not("result_snapshot", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(500);

    const subjectQuestionIds = new Set<string>();
    let answered = 0;
    let correct = 0;
    let incorrect = 0;
    const subjectCounts = new Map<string, { name: string; slug: string; answered: number; correct: number }>();
    const personalQuestionIds: string[] = [];

    for (const attempt of personalRows) {
      for (const question of snapshotQuestions(attempt.result_snapshot)) {
        if (!question.question_id || !hasSelectedAnswer(question) || typeof question.selected_is_correct !== "boolean") continue;
        answered += 1;
        if (question.selected_is_correct) correct += 1;
        else incorrect += 1;
        if (!subjectQuestionIds.has(question.question_id)) {
          subjectQuestionIds.add(question.question_id);
          personalQuestionIds.push(question.question_id);
        }
      }
    }

    const globalQuestionCounts = new Map<string, { prompt: string; answered: number; incorrect: number }>();
    if (!globalError) {
      for (const attempt of globalRows ?? []) {
        for (const question of snapshotQuestions(attempt.result_snapshot)) {
          if (!question.question_id || !question.prompt || !hasSelectedAnswer(question) || typeof question.selected_is_correct !== "boolean") continue;
          const current = globalQuestionCounts.get(question.question_id) ?? {
            prompt: question.prompt,
            answered: 0,
            incorrect: 0,
          };
          current.answered += 1;
          if (!question.selected_is_correct) current.incorrect += 1;
          globalQuestionCounts.set(question.question_id, current);
        }
      }
    }

    const difficultCandidates = [...globalQuestionCounts.entries()]
      .filter(([, value]) => value.answered >= 3)
      .map(([questionId, value]) => ({
        questionId,
        prompt: value.prompt,
        answered: value.answered,
        incorrect: value.incorrect,
        incorrectRate: Math.round((value.incorrect / value.answered) * 100),
      }))
      .sort((a, b) => b.incorrectRate - a.incorrectRate || b.answered - a.answered)
      .slice(0, 5);

    const taxonomyIds = [...new Set([...personalQuestionIds.slice(0, 1000), ...difficultCandidates.map((item) => item.questionId)])];
    const taxonomyMap = new Map<string, QuestionTaxonomy>();
    if (taxonomyIds.length > 0) {
      const { data: questionRows, error: questionError } = await admin
        .from("questions")
        .select("id,prompt,status,topics(name,subjects(name,slug))")
        .eq("status", "published")
        .in("id", taxonomyIds);
      if (!questionError) {
        for (const row of (questionRows ?? []) as unknown as (QuestionTaxonomy & { status?: string })[]) {
          taxonomyMap.set(row.id, row);
        }
      }
    }

    for (const attempt of personalRows) {
      for (const question of snapshotQuestions(attempt.result_snapshot)) {
        if (!question.question_id || !hasSelectedAnswer(question) || typeof question.selected_is_correct !== "boolean") continue;
        const taxonomy = taxonomyMap.get(question.question_id);
        const subject = taxonomy?.topics?.subjects;
        if (!subject?.slug || !subject.name) continue;
        const current = subjectCounts.get(subject.slug) ?? {
          name: subject.name,
          slug: subject.slug,
          answered: 0,
          correct: 0,
        };
        current.answered += 1;
        if (question.selected_is_correct) current.correct += 1;
        subjectCounts.set(subject.slug, current);
      }
    }

    const subjectPerformance = [...subjectCounts.values()]
      .filter((subject) => subject.answered >= 3)
      .map((subject) => ({
        ...subject,
        accuracy: Math.round((subject.correct / subject.answered) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered)
      .slice(0, 4);

    const recentAttempts = personalRows.slice(0, 5).map((attempt) => {
      const snapshot = attempt.result_snapshot && typeof attempt.result_snapshot === "object"
        ? attempt.result_snapshot as AttemptSnapshot
        : {};
      return {
        id: attempt.id,
        title: attempt.exams?.title ?? "Exam",
        slug: attempt.exams?.slug ?? "",
        submittedAt: attempt.submitted_at,
        score: typeof snapshot.score === "number" && Number.isFinite(snapshot.score) ? snapshot.score : null,
      };
    });

    const difficultQuestions = difficultCandidates.flatMap((item) => {
      const taxonomy = taxonomyMap.get(item.questionId);
      const subject = taxonomy?.topics?.subjects;
      if (!taxonomy || !subject?.name || !subject.slug) return [];
      return [{
        ...item,
        prompt: taxonomy.prompt,
        subjectName: subject.name,
        subjectSlug: subject.slug,
      }];
    });

    return {
      hasIdentity,
      submittedAttempts,
      answered,
      correct,
      incorrect,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
      subjectPerformance,
      recentAttempts,
      difficultQuestions,
      personalError,
    };
  } catch {
    return { ...empty, personalError: true };
  }
}

export default async function Home() {
  const supabase = await createClient();
  const [{ data: userResult }, publicData] = await Promise.all([
    supabase.auth.getUser(),
    getCachedHomePublicData(),
  ]);
  const {
    questionCount, questionCountError, subjectCount, subjectCountError,
    exams, examCount, examError, featuredQuestionRows, featuredQuestionError,
  } = publicData;

  const user = userResult.user;
  const analytics = await getHomeAnalytics(user?.id ?? null);
  const displayName =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user?.email?.split("@")[0] ||
    "";
  const publishedQuestionCount = questionCountError ? null : questionCount;
  const availableSubjectCount = subjectCountError ? null : subjectCount;
  const availableExams = examError ? [] : exams ?? [];
  const publishedExamCount = examError ? null : examCount;
  const featuredQuestion = featuredQuestionError
    ? null
    : ((featuredQuestionRows ?? [])[0] as unknown as FeaturedQuestion | undefined) ?? null;
  const featuredOptions = [...(featuredQuestion?.question_options ?? [])]
    .sort((a, b) => a.option_order - b.option_order);

  return (
    <div className="space-y-4 pb-3">
      <section aria-labelledby="home-heading" className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Careerotic · Exam preparation</p>
          <h1 id="home-heading" className="mt-1.5 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
            {user ? `Welcome back${displayName ? `, ${displayName}` : ""}.` : "প্রস্তুতি হোক প্রশ্নের অনুশীলনে"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600">
            বিষয়ভিত্তিক প্রশ্ন অনুশীলন করুন, উত্তর ও ব্যাখ্যা বুঝুন, এবং প্রকাশিত পরীক্ষায় নিজের প্রস্তুতি যাচাই করুন।
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/questions" className={primaryButton}>প্রশ্ন অনুশীলন <ArrowIcon /></Link>
            <Link href="/exams" className={secondaryButton}>প্রকাশিত পরীক্ষা <ArrowIcon /></Link>
          </div>
          <form action="/search" role="search" className="mt-3 flex max-w-2xl gap-2">
            <label htmlFor="homepage-search" className="sr-only">Search published questions, subjects, or exams</label>
            <input id="homepage-search" name="q" type="search" maxLength={100}
              placeholder="প্রশ্ন, বিষয় বা পরীক্ষা খুঁজুন…"
              className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <button type="submit" className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">খুঁজুন</button>
          </form>
        </div>
      </section>

      {(publishedQuestionCount !== null || availableSubjectCount !== null || publishedExamCount !== null) && (
        <section aria-label="Careerotic content overview" className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {publishedQuestionCount !== null && (
            <div className="min-w-0 px-2 py-3 text-center sm:px-3">
              <p className="text-lg font-bold tabular-nums text-slate-950 sm:text-xl">{publishedQuestionCount.toLocaleString("en-US")}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">প্রকাশিত প্রশ্ন</p>
            </div>
          )}
          {availableSubjectCount !== null && (
            <div className="min-w-0 px-2 py-3 text-center sm:px-3">
              <p className="text-lg font-bold tabular-nums text-slate-950 sm:text-xl">{availableSubjectCount.toLocaleString("en-US")}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">বিষয়</p>
            </div>
          )}
          {publishedExamCount !== null && (
            <div className="min-w-0 px-2 py-3 text-center sm:px-3">
              <p className="text-lg font-bold tabular-nums text-slate-950 sm:text-xl">{publishedExamCount.toLocaleString("en-US")}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">প্রকাশিত পরীক্ষা</p>
            </div>
          )}
        </section>
      )}

      <CommunityAnalytics />

      {(user || analytics.hasIdentity) && (
        <section aria-labelledby="performance-analytics-heading" className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-700">Your learning</p>
              <h2 id="performance-analytics-heading" className="mt-0.5 text-base font-bold tracking-tight text-slate-950">আপনার পারফরম্যান্স</h2>
              <p className="mt-0.5 text-xs leading-4 text-slate-500">সর্বশেষ ৩০টি জমা পরীক্ষার ফলাফল থেকে হিসাব করা হয়েছে।</p>
            </div>
            {user && <Link href="/my-results" className="shrink-0 text-xs font-semibold text-indigo-700 hover:text-indigo-900">সব ফলাফল <ArrowIcon /></Link>}
          </div>

          {analytics.personalError ? (
            <p role="status" className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">এই মুহূর্তে অ্যানালিটিক্স লোড করা যাচ্ছে না। পরে আবার চেষ্টা করুন।</p>
          ) : analytics.submittedAttempts === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">আপনার প্রথম পরীক্ষা দিয়ে শুরু করুন</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">পরীক্ষা জমা দেওয়ার পর এখানে সঠিক উত্তরের হার, ভুল উত্তরের সংখ্যা এবং সাম্প্রতিক স্কোর দেখা যাবে।</p>
              <Link href="/exams" className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800">পরীক্ষা খুঁজুন <ArrowIcon /></Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] leading-4 text-slate-500">সঠিক উত্তরের হার</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{analytics.accuracy === null ? "—" : `${analytics.accuracy}%`}</p>
                </div>
                <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-[11px] leading-4 text-emerald-800">সঠিক উত্তর</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{analytics.correct.toLocaleString("en-US")}</p>
                </div>
                <div className="rounded-md border border-rose-100 bg-rose-50/70 p-3">
                  <p className="text-[11px] leading-4 text-rose-800">ভুল উত্তর</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">{analytics.incorrect.toLocaleString("en-US")}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] leading-4 text-slate-500">জমা পরীক্ষা</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{analytics.submittedAttempts.toLocaleString("en-US")}</p>
                </div>
              </div>

              {analytics.subjectPerformance.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">যে বিষয়গুলোতে আরও অনুশীলন দরকার</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {analytics.subjectPerformance.map((subject) => (
                      <Link key={subject.slug} href={`/subjects/${encodeURIComponent(subject.slug)}`} className="rounded-md border border-slate-200 p-3 hover:border-indigo-200 hover:bg-indigo-50/30">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{subject.name}</span>
                          <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">{subject.accuracy}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${subject.accuracy}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">{subject.correct} সঠিক · {subject.answered - subject.correct} ভুল · {subject.answered}টি উত্তর</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {analytics.recentAttempts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">সাম্প্রতিক স্কোর</h3>
                    {user && <Link href="/my-results" className="text-xs font-semibold text-indigo-700">সব ফলাফল →</Link>}
                  </div>
                  <ul className="mt-1 divide-y divide-slate-100">
                    {analytics.recentAttempts.map((attempt) => (
                      <li key={attempt.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">{attempt.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString("bn-BD", { dateStyle: "medium" }) : "তারিখ নেই"}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-bold tabular-nums text-slate-900">{attempt.score === null ? "—" : attempt.score}</span>
                          {attempt.slug && <Link href={`/exam/${encodeURIComponent(attempt.slug)}`} className="text-xs font-semibold text-indigo-700">পরীক্ষা <ArrowIcon /></Link>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {availableExams.length > 0 && (
        <section aria-labelledby="available-exams-heading" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 id="available-exams-heading" className="text-base font-bold tracking-tight text-slate-950">প্রকাশিত পরীক্ষা</h2>
              <p className="text-xs text-slate-500">যে পরীক্ষাগুলো এখন Careerotic-এ উপলভ্য</p>
            </div>
            <Link href="/exams" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              সব পরীক্ষা <ArrowIcon />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {availableExams.map((exam) => (
              <article key={exam.id} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-700">{exam.exam_categories?.name ?? "Exam"}</span>
                  <span>{exam.duration_minutes} মিনিট</span>
                </div>
                <h3 className="mt-1.5 text-sm font-semibold leading-5 text-slate-950">{exam.title}</h3>
                {exam.description && <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-600">{exam.description}</p>}
                <Link href={`/exam/${encodeURIComponent(exam.slug)}`} className="mt-2 inline-flex min-h-7 items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                  পরীক্ষার বিবরণ <ArrowIcon />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {featuredQuestion && (
        <section aria-labelledby="featured-question-heading" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 id="featured-question-heading" className="text-base font-bold tracking-tight text-slate-950">একটি প্রশ্ন দিয়ে শুরু করুন</h2>
              <p className="text-xs text-slate-500">প্রশ্নব্যাংক থেকে সাম্প্রতিক প্রকাশিত প্রশ্ন</p>
            </div>
            <Link href="/questions" className="shrink-0 text-xs font-semibold text-indigo-700 hover:text-indigo-900">সব প্রশ্ন →</Link>
          </div>
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium text-slate-500">
              {[featuredQuestion.topics?.subjects?.name, featuredQuestion.topics?.name, featuredQuestion.language].filter(Boolean).join(" · ")}
            </p>
            <h3 className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-slate-900">{featuredQuestion.prompt}</h3>
            {featuredOptions.length > 0 && (
              <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {featuredOptions.map((option, index) => (
                  <li key={option.id} className="flex min-w-0 gap-2 rounded-md bg-slate-50 px-2.5 py-2 text-xs leading-4 text-slate-700">
                    <span className="shrink-0 font-semibold text-slate-400">{String.fromCharCode(65 + index)}.</span>
                    <span className="min-w-0 whitespace-pre-wrap break-words">{option.option_text}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-2 text-xs text-slate-500">উত্তর ও ব্যাখ্যা দেখতে প্রশ্নব্যাংকে যান।</p>
            <Link href="/questions" className="mt-1.5 inline-flex min-h-8 items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100">
              প্রশ্ন অনুশীলন করুন <ArrowIcon />
            </Link>
          </article>
        </section>
      )}

      {analytics.difficultQuestions.length > 0 && (
        <section aria-labelledby="difficult-questions-heading" className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-rose-700">Community practice insights</p>
              <h2 id="difficult-questions-heading" className="text-base font-bold tracking-tight text-slate-950">যে প্রশ্নগুলোতে বেশি ভুল হচ্ছে</h2>
              <p className="text-xs leading-4 text-slate-500">প্রতিটি প্রশ্নে অন্তত ৩টি জমা পরীক্ষার উত্তর বিবেচনা করা হয়েছে।</p>
            </div>
            <Link href="/questions" className="shrink-0 text-xs font-semibold text-indigo-700 hover:text-indigo-900">প্রশ্ন অনুশীলন <ArrowIcon /></Link>
          </div>
          <div className="space-y-2">
            {analytics.difficultQuestions.map((question, index) => (
              <article key={question.questionId} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-50 text-xs font-bold text-rose-800">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/subjects/${encodeURIComponent(question.subjectSlug)}`} className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900">{question.subjectName}</Link>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-5 text-slate-900">{question.prompt}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-xs font-bold text-rose-700">{question.incorrectRate}% ভুল</span>
                      <span className="text-[11px] text-slate-500">{question.incorrect}টি ভুল / {question.answered}টি উত্তর</span>
                      <Link href={`/search?q=${encodeURIComponent(question.prompt.slice(0, 100))}`} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">প্রশ্ন খুঁজুন →</Link>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${question.incorrectRate}%` }} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="learning-links-heading" className="space-y-2">
        <div>
          <h2 id="learning-links-heading" className="text-base font-bold tracking-tight text-slate-950">প্রস্তুতির সহায়ক লিংক</h2>
          <p className="text-xs text-slate-500">প্রয়োজনীয় পেজে দ্রুত পৌঁছান</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href="/exam-categories" className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/40">
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">পরীক্ষার ক্যাটাগরি</span><span className="block text-xs text-slate-500">ক্যাটাগরি অনুযায়ী পরীক্ষা খুঁজুন</span></span>
            <ArrowIcon />
          </Link>
          <Link href="/study-guides" className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/40">
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">Study guides</span><span className="block text-xs text-slate-500">পড়াশোনার কৌশল ও পুনরালোচনা</span></span>
            <ArrowIcon />
          </Link>
          <Link href="/current-affairs" className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/40">
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">Current affairs</span><span className="block text-xs text-slate-500">উৎসভিত্তিক সাম্প্রতিক বিষয়</span></span>
            <ArrowIcon />
          </Link>
          <Link href="/help" className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/40">
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">Help & FAQ</span><span className="block text-xs text-slate-500">ব্যবহার সম্পর্কে সহায়তা</span></span>
            <ArrowIcon />
          </Link>
          {user && (
            <>
              <Link href="/saved-questions" className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/40">
                <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">Saved questions</span><span className="block text-xs text-slate-500">সংরক্ষিত প্রশ্নে ফিরে যান</span></span>
                <ArrowIcon />
              </Link>
              <Link href="/my-results" className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/40">
                <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">My results</span><span className="block text-xs text-slate-500">নিজের জমা দেওয়া পরীক্ষার তালিকা</span></span>
                <ArrowIcon />
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
