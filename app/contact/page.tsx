import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact & Support",
  description: "Find the available support routes for Careerotic, including help articles and question corrections.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Support</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Contact & support</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Choose the support route that best matches what you need help with.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="font-semibold text-slate-900">Using Careerotic</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Find answers about question cards, exam attempts, saved questions, and account features in the help centre.</p>
          <Link href="/help" className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:border-indigo-300">Open Help & FAQ</Link>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="font-semibold text-slate-900">Report a question issue</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">If a question or answer appears incorrect, open the question bank and use the report control on that question when available.</p>
          <Link href="/questions" className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:border-indigo-300">Open question bank</Link>
        </section>
      </div>
      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">A direct support email address or general contact form is not currently published on this site. This page links only to support options that are available in Careerotic.</p>
    </main>
  );
}
