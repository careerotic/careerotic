import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Careerotic",
  description: "Learn about Careerotic's mission to make competitive-exam practice more organized and accessible.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">About</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">About Careerotic</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Careerotic is an independent exam-preparation platform designed to help learners practise questions, review explanations, and prepare in a more organized way.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">What you can do here</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Browse available questions by subject and topic, reveal answers and explanations, save questions when signed in, and practise with published exams. Available features depend on the content and functionality currently provided on the site.</p>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">Our approach to learning</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">We aim to make practice straightforward and useful. Study materials are learning aids, not a replacement for official exam notices, syllabuses, or instructions from the relevant recruiting authority. Always verify important requirements with the official source.</p>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">Independent educational resource</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Unless a page explicitly says otherwise, Careerotic is not an official government recruitment body and does not guarantee exam outcomes, admission, or employment. Read the <Link href="/disclaimer" className="font-medium text-indigo-700 underline underline-offset-2">Educational Disclaimer</Link> for more information.</p>
      </section>
      <nav aria-label="Explore Careerotic" className="flex flex-wrap gap-2">
        <Link href="/questions" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">Browse questions</Link>
        <Link href="/exams" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">View exams</Link>
        <Link href="/help" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">Help & FAQ</Link>
        <Link href="/contact" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">Contact & support</Link>
      </nav>
    </main>
  );
}
