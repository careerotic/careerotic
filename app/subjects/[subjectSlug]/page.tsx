import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteProps = { params: Promise<{ subjectSlug: string }> };
type TopicRow = { id: string; name: string; slug: string };
type TopicCountRow = { topic_id: string };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  await connection();
  const { subjectSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("name").eq("slug", subjectSlug).maybeSingle();
  return {
    title: data?.name ? `${data.name} questions and topics` : "Subject",
    description: data?.name ? `Browse topics and published practice questions in ${data.name} on Careerotic.` : "Browse Careerotic subjects and topics.",
  };
}

export default async function SubjectPage({ params }: RouteProps) {
  const { subjectSlug } = await params;
  const supabase = await createClient();
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id,name,slug")
    .eq("slug", subjectSlug)
    .maybeSingle();

  if (subjectError) {
    console.error("Subject lookup failed:", subjectError.message);
    throw new Error("Unable to load this subject.");
  }
  if (!subject) notFound();

  const { data: topicRows, error: topicsError } = await supabase
    .from("topics")
    .select("id,name,slug")
    .eq("subject_id", subject.id)
    .order("name", { ascending: true });

  if (topicsError) {
    console.error("Topic lookup failed:", topicsError.message);
    throw new Error("Unable to load topics for this subject.");
  }

  const topics = (topicRows ?? []) as TopicRow[];
  const topicIds = topics.map((topic) => topic.id);
  let questionCountByTopic = new Map<string, number>();

  // Keep the public topic listing independent of PostgREST's nested aggregate
  // filtering. The existing schema supports these two direct relationships;
  // no schema changes or migrations are needed.
  if (topicIds.length > 0) {
    const { data: questionRows, error: questionCountError } = await supabase
      .from("questions")
      .select("topic_id")
      .in("topic_id", topicIds)
      .eq("status", "published");

    if (questionCountError) {
      console.error("Published question count lookup failed:", questionCountError.message);
      throw new Error("Unable to load published question counts for this subject.");
    }

    questionCountByTopic = new Map<string, number>();
    for (const question of (questionRows ?? []) as TopicCountRow[]) {
      questionCountByTopic.set(question.topic_id, (questionCountByTopic.get(question.topic_id) ?? 0) + 1);
    }
  }

  const totalQuestions = [...questionCountByTopic.values()].reduce((sum, count) => sum + count, 0);

  return (
    <main className="min-w-0 space-y-4 text-slate-900">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <Link href="/questions" className="text-xs font-medium text-indigo-700 hover:underline">← Question bank</Link>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">Subject</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{subject.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {topics.length} {topics.length === 1 ? "topic" : "topics"} · {totalQuestions} published {totalQuestions === 1 ? "question" : "questions"}
        </p>
      </header>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Topics</h2>
        <span className="text-xs text-slate-500">Choose a topic to practise</span>
      </div>

      {topics.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <h2 className="font-semibold">No topics available</h2>
          <p className="mt-1 text-sm text-slate-500">There are currently no topics under this subject.</p>
        </section>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topics.map((topic) => {
            const count = questionCountByTopic.get(topic.id) ?? 0;
            return (
              <li key={topic.id}>
                <Link href={`/subjects/${subject.slug}/${topic.slug}`} className="group flex h-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                  <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-indigo-700 group-hover:bg-white">▤</span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold text-slate-800 group-hover:text-indigo-800">{topic.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{count} {count === 1 ? "question" : "questions"}</span>
                  </span>
                  <span aria-hidden="true" className="text-lg text-slate-300 group-hover:text-indigo-600">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
