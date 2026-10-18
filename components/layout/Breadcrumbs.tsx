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
  exam: "Exam",
  attempt: "Attempt",
  result: "Result",
  results: "Results",
  admin: "Admin",
  "forgot-password": "Reset password",
  "reset-password": "Choose new password",
  auth: "Authentication",
};

function prettify(segment: string) {
  return labels[segment] ?? segment.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return null;

  const items = [
    { label: "Home", href: "/" },
    ...segments.map((segment, index) => ({
      label: prettify(segment),
      href: "/" + segments.slice(0, index + 1).join("/"),
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0 py-4">
      <ol className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={item.href} className="flex min-w-0 items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
              {current ? (
                <span aria-current="page" className="max-w-full truncate font-medium text-slate-800">{item.label}</span>
              ) : (
                <Link href={item.href} className="truncate text-slate-500 transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
