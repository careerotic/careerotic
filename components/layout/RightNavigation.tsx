"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Subject = { id: string; name: string; slug: string };

const quickLinks = [
  { href: "/questions", eyebrow: "PRACTICE", title: "Browse questions", detail: "Search the complete question bank", icon: "?" },
  { href: "/exams", eyebrow: "ASSESS", title: "Available exams", detail: "Take a published practice exam", icon: "▤" },
  { href: "/dashboard", eyebrow: "YOUR SPACE", title: "Dashboard", detail: "Open your account workspace", icon: "▦" },
  { href: "/account", eyebrow: "PROFILE", title: "Account settings", detail: "Review your account details", icon: "○" },
];

export default function RightNavigation() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSubjects() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("subjects")
          .select("id,name,slug")
          .order("name", { ascending: true });
        if (error) throw error;
        if (active) setSubjects((data ?? []) as Subject[]);
      } catch {
        if (active) setLoadError("Subjects could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadSubjects();
    return () => { active = false; };
  }, []);

  return (
    <aside aria-label="Learning shortcuts and subjects" className="space-y-3">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">Question bank</p>
          <h2 className="mt-1 text-sm font-bold text-slate-900">Browse subjects</h2>
          <p className="mt-1 text-xs leading-4 text-slate-500">Choose a subject, then a topic, to practise its questions.</p>
        </div>
        <nav aria-label="Subjects" className="max-h-[min(52vh,32rem)] overflow-y-auto p-1.5">
          {loading ? (
            <div className="space-y-1.5 p-2" aria-label="Loading subjects">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-8 animate-pulse rounded-md bg-slate-100" />)}
            </div>
          ) : loadError ? (
            <p role="status" className="px-2 py-3 text-xs text-rose-700">{loadError}</p>
          ) : subjects.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500">No subjects available yet.</p>
          ) : subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.slug}`}
              className="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 group-hover:bg-white group-hover:text-indigo-700">•</span>
              <span className="min-w-0 flex-1 break-words leading-5">{subject.name}</span>
              <span aria-hidden="true" className="text-slate-300 group-hover:text-indigo-500">›</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-2">
          <Link href="/questions" className="block rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">View all questions →</Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-3">
          <h2 className="text-sm font-bold text-slate-900">Shortcuts</h2>
        </div>
        <nav aria-label="Quick links" className="p-1.5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group flex gap-2.5 rounded-lg p-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700">{link.icon}</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold tracking-[0.1em] text-slate-400">{link.eyebrow}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-800 group-hover:text-indigo-700">{link.title}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{link.detail}</span>
              </span>
            </Link>
          ))}
        </nav>
      </section>
      <section className="rounded-xl bg-slate-950 p-3 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-200">Study routine</p>
        <p className="mt-1.5 text-sm font-semibold leading-5">Practise, reveal, learn.</p>
        <p className="mt-1 text-xs leading-4 text-slate-300">Answers and explanations appear when you ask to show them.</p>
      </section>
    </aside>
  );
}
