import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("exams").select("title").eq("slug", slug).eq("status", "published").maybeSingle();
  return { title: data?.title ? `${data.title} instructions` : "Exam details" };
}

export default async function ExamDetailsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: exam, error } = await supabase
    .from("exams")
    .select("id,title,slug,description,duration_minutes,correct_marks,negative_marks,start_at,end_at,exam_categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Unable to load this exam.");
  if (!exam) notFound();

  const { count, error: countError } = await supabase
    .from("exam_questions")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", exam.id);
  const now = Date.now();
  const start = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const end = exam.end_at ? new Date(exam.end_at).getTime() : null;
  const scheduled = (start === null || now >= start) && (end === null || now < end);
  const questionCount = countError ? null : count ?? 0;
  const canStart = scheduled && questionCount !== null && questionCount > 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/exams" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← All exams</Link>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{exam.exam_categories?.name ?? "Exam"}</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{exam.title}</h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{exam.description || "No additional description has been provided for this exam."}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Duration", `${exam.duration_minutes} min`],
            ["Questions", questionCount === null ? "Unavailable" : String(questionCount)],
            ["Correct answer", `+${exam.correct_marks}`],
            ["Wrong answer", `−${exam.negative_marks}`],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div>)}
        </div>
        {(exam.start_at || exam.end_at) && <div className="mt-5 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          {exam.start_at && <p>Starts: {new Date(exam.start_at).toLocaleString()}</p>}
          {exam.end_at && <p className="mt-1">Ends: {new Date(exam.end_at).toLocaleString()}</p>}
        </div>}
        <div className="mt-7 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <h2 className="font-semibold">Before you begin</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The timer is controlled by the server and cannot be extended by refreshing the page.</li>
            <li>Your selected answers are saved to your attempt and can be restored in this browser.</li>
            <li>Submit only when you are ready. The submitted result is final.</li>
            <li>Correct answers and explanations are hidden until the attempt is submitted.</li>
          </ul>
        </div>
        {!scheduled && <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">This exam is outside its scheduled availability window.</p>}
        {questionCount === 0 && <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">This exam has no assigned questions and cannot be started.</p>}
        {questionCount === null && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">Question assignments could not be verified. Please try again later.</p>}
        <div className="mt-6">
          {canStart ? <Link href={`/attempt/${encodeURIComponent(exam.slug)}`} className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 sm:w-auto">Start or resume exam</Link> : <button disabled className="inline-flex cursor-not-allowed rounded-lg bg-slate-300 px-5 py-3 font-semibold text-slate-600">Exam unavailable</button>}
        </div>
      </section>
    </main>
  );
}
