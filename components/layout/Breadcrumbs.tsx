"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  account: "My account",
  dashboard: "Dashboard",
  login: "Sign in",
  signup: "Create account",
  questions: "Question bank",
  exams: "Exams",
  exam: "Exams",
  attempt: "Attempt",
  result: "Result",
  results: "Results",
  admin: "Admin",
  "forgot-password": "Reset password",
  "reset-password": "Choose new password",
  auth: "Authentication",
  subjects: "Subjects",
  privacy: "Privacy policy",
  terms: "Terms of use",
  "bcs-preliminary-practice-exam-01": "BCS Preliminary Practice Exam – 01",
  "bangla-grammar-challenge-01": "Bangla Grammar Challenge – 01",
};

function prettify(segment: string) {
  return labels[segment] ?? segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hrefFor(segments: string[], index: number) {
  const path = "/" + segments.slice(0, index + 1).join("/");
  // Exam attempts live at /exam/[slug]; the usable parent listing is /exams.
  if (segments[index] === "exam" && index === 0) return "/exams";
  return path;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return null;

  const items = [
    { label: "Home", href: "/", home: true },
    ...segments.map((segment, index) => ({
      label: prettify(segment),
      href: hrefFor(segments, index),
      home: false,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0 py-2">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs sm:text-sm">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${index}-${item.href}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-slate-300">
                  <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {current ? (
                <span
                  aria-current="page"
                  title={item.label}
                  className="min-w-0 max-w-[min(65vw,28rem)] truncate rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-800"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  title={item.label}
                  aria-label={item.home ? "Home" : `Go to ${item.label}`}
                  className="inline-flex min-w-0 max-w-[min(45vw,18rem)] items-center gap-1 rounded-md px-2 py-1 text-slate-500 underline-offset-4 transition-colors hover:bg-indigo-50 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1"
                >
                  {item.home && (
                    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0">
                      <path d="m3 9 7-6 7 6v7a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
