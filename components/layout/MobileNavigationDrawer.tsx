"use client";

import Link from "next/link";
import { useEffect } from "react";

type Props = { open: boolean; onClose: () => void };

const sections = [
  {
    title: "Explore",
    links: [
      { href: "/exam-categories", label: "Exam categories", description: "Find exams by category" },
      { href: "/subjects", label: "Browse subjects", description: "Practice by subject" },
      { href: "/search", label: "Search", description: "Find questions and learning content" },
    ],
  },
  {
    title: "Learning",
    links: [
      { href: "/study-guides", label: "Study guides", description: "Review focused learning guides" },
      { href: "/current-affairs", label: "Current affairs", description: "Keep up with recent topics" },
      { href: "/study-plan", label: "Study plan", description: "Organize your preparation" },
    ],
  },
  {
    title: "Support",
    links: [{ href: "/help", label: "Help & FAQ", description: "Get help using Careerotic" }],
  },
];

export default function MobileNavigationDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-12 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/25"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-navigation-title"
        className="relative mx-auto flex h-full w-full max-w-xl flex-col overflow-hidden border-b border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 id="mobile-navigation-title" className="text-sm font-semibold text-slate-900">
              More to explore
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Extra links, without repeating your main navigation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            Close
          </button>
        </div>

        <nav id="mobile-primary-navigation" aria-label="More navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {sections.map((section) => (
            <section key={section.title} aria-labelledby={`mobile-menu-${section.title.toLowerCase()}`} className="py-2">
              <h3 id={`mobile-menu-${section.title.toLowerCase()}`} className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">{link.label}</span>
                        <span className="mt-0.5 block text-xs leading-4 text-slate-500">{link.description}</span>
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0 text-slate-400">
                        <path d="M4 10h11M10 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </section>
    </div>
  );
}
