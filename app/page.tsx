import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCachedHomePublicData } from "@/lib/cache/public-data";

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

type AttemptQuestionSnapshot = {
  question_id?: string;
  prompt?: string;
  selected_is_correct?: boolean | null;
  correct_option?: { text?: string } | null;
  explanation?: string | null;
};

type AttemptResultSnapshot = {
  score?: number;
  correct_count?: number;
  incorrect_count?: number;
  questions?: AttemptQuestionSnapshot[];
};

type UserAttempt = {
  id: string;
  submitted_at: string | null;
  result_snapshot: AttemptResultSnapshot | null;
  exams: { title: string } | { title: string }[] | null;
};

type QuestionSubject = {
  id: string;
  topics: { name: string; subjects: { name: string } | null } | null;
};

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

  // Personal analytics are calculated only from the signed-in user's own submitted attempts.
  // RLS on exam_attempts and related tables remains the access-control boundary.
  const { data: attemptRows, error: attemptError, count: attemptCount } = user
    ? await supabase
        .from("exam_attempts")
        .select("id,submitted_at,result_snapshot,exams(title)", { count: "exact" })
        .eq("user_id", user.id)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(20)
    : { data: [], error: null, count: null };
  const userAttempts = attemptError ? [] : ((attemptRows ?? []) as unknown as UserAttempt[]);
  const submittedAttemptCount = attemptError ? 0 : (typeof attemptCount === "number" ? attemptCount : userAttempts.length);
  const attemptQuestions = userAttempts.flatMap((attempt) =>
    Array.isArray(attempt.result_snapshot?.questions)
      ? attempt.result_snapshot.questions.filter((question) => typeof question.selected_is_correct === "boolean")
      : [],
  );
  const correctAnswers = attemptQuestions.filter((question) => question.selected_is_correct === true).length;
  const incorrectAnswers = attemptQuestions.filter((question) => question.selected_is_correct === false).length;
  const answeredCount = correctAnswers + incorrectAnswers;
  const accuracyRate = answeredCount > 0 ? Math.round((correctAnswers / answeredCount) * 100) : null;
  const questionIds = [...new Set(attemptQuestions.map((question) => question.question_id).filter((id): id is string => Boolean(id)))];
  const { data: questionSubjectRows } = user && questionIds.length > 0
    ? await supabase.from("questions").select("id,topics(name,subjects(name))").in("id", questionIds)
    : { data: [] };
  const questionSubjects = new Map(
    ((questionSubjectRows ?? []) as unknown as QuestionSubject[]).map((question) => [
      question.id,
      question.topics?.subjects?.name ?? question.topics?.name ?? "অন্যান্য",
    ]),
  );
  const subjectStats = new Map<string, { correct: number; incorrect: number }>();
  for (const question of attemptQuestions) {
    if (!question.question_id) continue;
    const subjectName = questionSubjects.get(question.question_id);
    if (!subjectName) continue;
    const stats = subjectStats.get(subjectName) ?? { correct: 0, incorrect: 0 };
    if (question.selected_is_correct) stats.correct += 1;
    else stats.incorrect += 1;
    subjectStats.set(subjectName, stats);
  }
  const subjectPerformance = [...subjectStats.entries()]
    .map(([name, stats]) => ({
      name,
      ...stats,
      total: stats.correct + stats.incorrect,
      accuracy: Math.round((stats.correct / Math.max(1, stats.correct + stats.incorrect)) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, 5);
  const missedQuestionStats = new Map<string, { prompt: string; count: number; correctOption: string; explanation: string }>();
  for (const question of attemptQuestions) {
    if (question.selected_is_correct !== false || !question.question_id) continue;
    const existing = missedQuestionStats.get(question.question_id);
    missedQuestionStats.set(question.question_id, {
      prompt: question.prompt ?? existing?.prompt ?? "প্রশ্নের বিবরণ পাওয়া যায়নি",
      count: (existing?.count ?? 0) + 1,
      correctOption: question.correct_option?.text ?? existing?.correctOption ?? "",
      explanation: question.explanation ?? existing?.explanation ?? "",
    });
  }
  const missedQuestions = [...missedQuestionStats.entries()]
    .map(([id, question]) => ({ id, ...question }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const latestScore = userAttempts.find((attempt) => typeof attempt.result_snapshot?.score === "number")?.result_snapshot?.score;

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

      {user && !attemptError && userAttempts.length > 0 && (
        <section aria-labelledby="personal-analytics-heading" className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="personal-analytics-heading" className="text-base font-bold tracking-tight text-slate-950">আপনার প্রস্তুতির বিশ্লেষণ</h2>
              <p className="text-xs text-slate-500">আপনার সর্বশেষ ২০টি জমা দেওয়া পরীক্ষার ফলাফল থেকে</p>
            </div>
            <Link href="/my-results" className="shrink-0 text-xs font-semibold text-indigo-700 hover:text-indigo-900">সব ফলাফল <ArrowIcon /></Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">সঠিক উত্তরের হার</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{accuracyRate === null ? "—" : `${accuracyRate}%`}</p>
              <p className="mt-1 text-[11px] text-slate-500">{correctAnswers.toLocaleString("en-US")} সঠিক / {answeredCount.toLocaleString("en-US")} উত্তর</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">সম্পন্ন পরীক্ষা</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{submittedAttemptCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">মোট জমা দেওয়া পরীক্ষা</p>
            </article>
            <article className="col-span-2 rounded-lg border border-slate-200 bg-white p-3 sm:col-span-1">
              <p className="text-xs text-slate-500">সর্বশেষ পরীক্ষার স্কোর</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{typeof latestScore === "number" ? latestScore.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}</p>
              <p className="mt-1 text-[11px] text-slate-500">পরীক্ষার ফলাফলে সংরক্ষিত স্কোর</p>
            </article>
          </div>

          {subjectPerformance.length > 0 && (
            <section aria-labelledby="subject-performance-heading" className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 id="subject-performance-heading" className="text-sm font-bold text-slate-900">বিষয়ভিত্তিক সঠিক উত্তরের হার</h3>
              <div className="mt-3 space-y-3">
                {subjectPerformance.map((subject) => (
                  <div key={subject.name}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-medium text-slate-700">{subject.name}</span>
                      <span className="shrink-0 tabular-nums text-slate-600">{subject.accuracy}% · {subject.total} উত্তর</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${subject.name} accuracy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={subject.accuracy}>
                      <div className={`h-full rounded-full ${subject.accuracy >= 70 ? "bg-emerald-500" : subject.accuracy >= 45 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${subject.accuracy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="missed-questions-heading" className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 id="missed-questions-heading" className="text-sm font-bold text-slate-900">যেসব প্রশ্নে ভুল হয়েছে</h3>
              <span className="text-[11px] text-slate-500">আপনার ফলাফল অনুযায়ী</span>
            </div>
            {missedQuestions.length > 0 ? (
              <ol className="mt-2 divide-y divide-slate-100">
                {missedQuestions.map((question) => (
                  <li key={question.id} className="py-2.5 first:pt-1 last:pb-0">
                    <p className="whitespace-pre-wrap break-words text-sm font-medium leading-5 text-slate-800">{question.prompt}</p>
                    <p className="mt-1 text-[11px] font-medium text-rose-700">{question.count > 1 ? `${question.count} বার ভুল হয়েছে` : "একবার ভুল হয়েছে"}</p>
                    {question.correctOption && <p className="mt-1 text-xs leading-5 text-emerald-800">সঠিক উত্তর: {question.correctOption}</p>}
                    {question.explanation && <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">{question.explanation}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate-600">এই ফলাফলগুলোতে ভুল উত্তর পাওয়া যায়নি। আরও পরীক্ষা দিলে এখানে দুর্বল প্রশ্নগুলো দেখানো হবে।</p>
            )}
          </section>
          <p className="text-[11px] leading-4 text-slate-500">এই বিশ্লেষণ শুধু আপনার অ্যাকাউন্টের জমা দেওয়া পরীক্ষার উপর ভিত্তি করে। পাসের হার দেখানো হয়নি, কারণ ডেটাবেসে নির্ভরযোগ্য পাসের মান সংরক্ষিত নেই।</p>
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
