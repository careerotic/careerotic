import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Careerotic",
  description: "Learn how Careerotic helps learners practise questions, review explanations, and prepare with published exams.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">About</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">About Careerotic</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Careerotic is an exam-preparation space for practising questions, reviewing explanations, and working through published practice exams.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">Learn at your own pace</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Browse questions by subject and topic, reveal answers and explanations when ready, and use available practice exams to structure your preparation.</p>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">Use reliable sources</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Practice materials support learning but do not replace official exam notices, syllabuses, or authoritative sources. Check the relevant recruiting authority for current requirements and announcements.</p>
      </section>
      <nav aria-label="Explore Careerotic" className="flex flex-wrap gap-2">
        <Link href="/questions" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">Browse questions</Link>
        <Link href="/exams" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">View exams</Link>
        <Link href="/help" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">Help & FAQ</Link>
      </nav>
    </main>
  );
}
