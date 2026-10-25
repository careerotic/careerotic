"use client";

import Link from "next/link";

type GuestAccessPromptProps = {
  title: string;
  description: string;
  returnTo: string;
  eyebrow?: string;
};

export function GuestAccessPrompt({
  title,
  description,
  returnTo,
  eyebrow = "Your Careerotic account",
}: GuestAccessPromptProps) {
  const next = encodeURIComponent(returnTo);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-700"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-indigo-700">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:flex-row">
        <Link
          href={`/login?next=${next}`}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-700 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Login
        </Link>
        <Link
          href={`/signup?next=${next}`}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Create account
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        You can continue browsing public questions and exams without an account.
      </p>
    </section>
  );
}
