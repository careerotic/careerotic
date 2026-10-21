import type { Metadata } from "next";
import Link from "next/link";
import { getCachedPublicTaxonomy } from "@/lib/cache/public-data";

export const metadata: Metadata = {
  title: "Browse subjects",
  description: "Explore Careerotic's available subjects and open subject-wise topics and practice questions.",
  alternates: { canonical: "/subjects" },
};

type Subject = { id: string; name: string; slug: string };

export default async function SubjectsPage() {
  let subjects: Subject[] = [];
  let error = false;
  try { subjects = (await getCachedPublicTaxonomy()).subjects as Subject[]; } catch { error = true; }

  return (
    <section className="space-y-4 pb-4">
      <header className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Question bank</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Browse subjects</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Choose a subject to explore its topics and available practice questions.
        </p>
      </header>

      {error ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Subjects are temporarily unavailable. Please try again shortly.
        </p>
      ) : subjects.length ? (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Link
                href={`/subjects/${subject.slug}`}
                className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <span className="min-w-0 break-words">{subject.name}</span>
                <span aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-indigo-700">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No subjects are available yet. Visit the question bank to check available questions.
        </p>
      )}
      <p className="text-sm text-slate-500">
        Looking for all practice questions? <Link href="/questions" className="font-semibold text-indigo-700 hover:text-indigo-900">Open the question bank</Link>.
      </p>
    </section>
  );
}
