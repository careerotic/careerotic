import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Exams",
  description: "Browse published competitive exams on Careerotic.",
};

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data: exams, error } = await supabase
    .from("exams")
    .select("id,title,slug,description,duration_minutes,correct_marks,negative_marks,start_at,end_at,exam_categories(name)")
    .eq("status", "published")
    .order("start_at", { ascending: true, nullsFirst: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Careerotic practice</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Available exams</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Choose a published exam to review its instructions and start when it is available.</p>
      </header>
      {error ? (
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          Exam listings could not be loaded. Please refresh the page or try again later.
        </section>
      ) : exams?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <article key={exam.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{exam.exam_categories?.name ?? "Exam"}</span>
                <span className="text-sm text-slate-500">{exam.duration_minutes} minutes</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">{exam.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{exam.description || "Review the instructions and exam schedule before starting."}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Correct: +{exam.correct_marks}</span>
                <span>Negative: −{exam.negative_marks}</span>
              </div>
              <Link href={`/exam/${encodeURIComponent(exam.slug)}`} className="mt-5 inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">View exam</Link>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">◎</div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No published exams yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">The question bank is available, but no exams have been published. Please check back after an administrator publishes an exam.</p>
          <Link href="/questions" className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Explore question bank</Link>
        </section>
      )}
    </main>
  );
}
