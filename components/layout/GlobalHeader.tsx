"use client";

import Link from "next/link";

type Props = { onMenuClick: () => void; menuOpen: boolean };

export default function GlobalHeader({ onMenuClick, menuOpen }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
          <Link href="/" className="truncate text-xl font-bold tracking-tight text-indigo-700">Careerotic</Link>
        </div>
        <nav aria-label="Account navigation" className="flex shrink-0 items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign in</Link>
          <Link href="/signup" className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Create account</Link>
        </nav>
      </div>
    </header>
  );
}
