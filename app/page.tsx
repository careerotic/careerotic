import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const metadata = {
  title: "Exam Practice & Question Bank",
  description:
    "Practise with published questions, review answers and explanations, and take available competitive exam practice tests on Careerotic.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const supabase = await createClient();
  const [
    { data: userResult },
    { count: questionCount, error: questionError },
    { data: exams, error: examError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("exams")
      .select("id,title,slug,description,duration_minutes,category_id,exam_categories(name)")
      .eq("status", "published")
      .order("start_at", { ascending: true, nullsFirst: false })
      .limit(3),
  ]);

  const user = userResult.user;
  const displayName =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user?.email?.split("@")[0] ||
    "";
  const publishedQuestionCount = questionError ? null : questionCount;
  const availableExams = examError ? [] : exams ?? [];

  return (
    <main id="main-content" className="space-y-5 pb-4">
      <section className="rounded-xl bg-slate-950 px-4 py-7 text-white sm:px-6 sm:py-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Careerotic</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Practice. Learn. Improve.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {user
              ? `Welcome back${displayName ? `, ${displayName}` : ""}. Continue practising or explore the exams currently available.`
              : "Practise with questions, reveal answers and explanations, and take published exam practice tests."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/questions" className={primaryButton}>
              Browse Questions <ArrowIcon />
            </Link>
            <Link href="/exams" className={secondaryButton}>
              Explore Exams <ArrowIcon />
            </Link>
          </div>
          {publishedQuestionCount !== null && (
            <p className="mt-4 text-xs text-slate-400">
              {publishedQuestionCount.toLocaleString()} published questions available
            </p>
          )}
        </div>
      </section>

      {availableExams.length > 0 && (
        <section aria-labelledby="available-exams-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="available-exams-heading" className="text-lg font-bold tracking-tight text-slate-950">
              Available exams
            </h2>
            <Link
              href="/exams"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              View all <ArrowIcon />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {availableExams.map((exam) => (
              <article key={exam.id} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                    {exam.exam_categories?.name ?? "Exam"}
                  </span>
                  {exam.duration_minutes !== null && (
                    <span>{exam.duration_minutes} minutes</span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-semibold leading-6 text-slate-950">{exam.title}</h3>
                {exam.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{exam.description}</p>
                )}
                <Link
                  href={`/exam/${encodeURIComponent(exam.slug)}`}
                  className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  View exam <ArrowIcon />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
