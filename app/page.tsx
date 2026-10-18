import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M4.75 5.75A2.75 2.75 0 0 1 7.5 3h12v16h-12a2.75 2.75 0 0 0-2.75 2.75zM4.75 5.75v16M8 7h8M8 10.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExamIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.5 9 1.5 1.5L13 7.5M14.5 10H16M8.5 15h7M8.5 17.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export const metadata = {
  title: "Home",
  description: "Explore the Careerotic question bank and discover published exam practice.",
};

export default async function Home() {
  const supabase = await createClient();
  const [
    { data: userResult },
    { data: subjectRows, error: subjectError },
    { count: questionCount, error: questionError },
    { count: examCount, error: examError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("subjects").select("id,name").order("name"),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("exams").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const user = userResult.user;
  const displayName =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user?.email?.split("@")[0] ||
    "";
  const subjects = subjectError ? [] : subjectRows ?? [];
  const visibleQuestionCount = questionError ? null : questionCount;
  const visibleExamCount = examError ? null : examCount;

  return (
    <main className="space-y-6 pb-6 sm:space-y-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-5 py-12 text-white shadow-sm sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl sm:h-96 sm:w-96" />
        <div aria-hidden="true" className="absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-200">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            YOUR NEXT STEP STARTS HERE
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Prepare smarter.
            <span className="block text-indigo-300">Practice with purpose.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            {user
              ? `Welcome back${displayName ? `, ${displayName}` : ""}. Keep building your knowledge with the question bank, and check the exams currently available.`
              : "Build confidence one question at a time. Explore the question bank, review answers and explanations, and discover exams when they are published."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/questions" className={primaryButton}>
              Start practicing <ArrowIcon />
            </Link>
            <Link href="/exams" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
              Explore exams <ArrowIcon />
            </Link>
            {user ? (
              <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Go to dashboard
              </Link>
            ) : (
              <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Create an account <ArrowIcon />
              </Link>
            )}
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Practice at your pace</span>
            <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Review explanations</span>
            <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Track published exams</span>
          </div>
        </div>
      </section>

      <section aria-label="Platform overview" className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><BookIcon /></span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Published questions</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{visibleQuestionCount === null ? "—" : visibleQuestionCount.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-600">Explore the question bank</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><CompassIcon /></span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Subjects available</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{subjectError ? "—" : subjects.length.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-600">Browse by subject and topic</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ExamIcon /></span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Published exams</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{visibleExamCount === null ? "—" : visibleExamCount.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-600">Only real, published exams</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><BookIcon /></span>
            <div>
              <p className="text-sm font-semibold text-indigo-700">PRACTICE</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Learn one question at a time</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Browse published questions, filter by subject or topic, and reveal the correct answer and explanation when you are ready.</p>
              <Link href="/questions" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                Open question bank <ArrowIcon />
              </Link>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><ExamIcon /></span>
            <div>
              <p className="text-sm font-semibold text-sky-700">EXAMS</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Prepare for exam day</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Review available exam instructions, timing and marking rules. The list only includes exams published by an administrator.</p>
              {visibleExamCount === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">No exams are published yet. You can practice with questions in the meantime.</p>
              ) : null}
              <Link href="/exams" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                View available exams <ArrowIcon />
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-indigo-700">FIND YOUR FOCUS</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Explore subjects</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Start with a subject that matches what you want to learn. Choose a subject in the question bank to narrow the practice list.</p>
          </div>
          <Link href="/questions" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
            Browse all questions <ArrowIcon />
          </Link>
        </div>
        {subjectError ? (
          <p role="status" className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Subjects could not be loaded right now. Open the question bank to try again.</p>
        ) : subjects.length ? (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <Link href="/questions" className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                  <span className="truncate">{subject.name}</span>
                  <span className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-700"><ArrowIcon /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Subject information is not available right now. Visit the question bank to explore available content.</p>
        )}
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">{user ? "Ready for your next practice session?" : "Make your next study session count."}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{user ? "Continue with the question bank or check the exams currently available." : "Start exploring the public question bank, or create an account to access your account area."}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link href="/questions" className={primaryButton}>Practice questions <ArrowIcon /></Link>
            {user ? (
              <Link href="/dashboard" className={secondaryButton}>Dashboard</Link>
            ) : (
              <Link href="/signup" className={secondaryButton}>Create account</Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
