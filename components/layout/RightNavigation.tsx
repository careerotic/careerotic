"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

type Subject = { id: string; name: string; slug: string };

export default function RightNavigation() {
  const pathname = usePathname();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSubjects() {
      try {
        const response = await fetch("/api/public/taxonomy");
        if (!response.ok) throw new Error("Subjects could not be loaded.");
        const payload = await response.json() as { subjects: Subject[] };
        if (active) setSubjects(payload.subjects ?? []);
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
    <aside aria-label="Browse learning content" className="min-w-0">
      <section className="app-panel overflow-hidden">
        <div className="app-panel-heading">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-700">Question bank</p>
          <h2 className="mt-0.5 text-sm font-semibold text-slate-900">Browse subjects</h2>
        </div>
        <nav aria-label="Subjects" className="max-h-[min(58vh,38rem)] overflow-y-auto p-1">
          {loading ? (
            <div className="space-y-1 p-1" role="status" aria-label="Loading subjects">
              {[1, 2, 3].map((item) => <Skeleton key={item} className="h-7 rounded bg-slate-100" />)}
            </div>
          ) : loadError ? (
            <p role="status" className="px-2 py-3 text-xs text-rose-700">{loadError}</p>
          ) : subjects.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500">No subjects available yet.</p>
          ) : subjects.map((subject) => {
            const href = `/subjects/${subject.slug}`;
            const current = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={subject.id} href={href} aria-current={current ? "page" : undefined}
                className={`group flex min-w-0 items-center gap-1.5 rounded px-2 py-1.5 text-[13px] leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${current ? "bg-indigo-50 font-semibold text-indigo-800" : "text-slate-600 hover:bg-slate-50 hover:text-indigo-800"}`}>
                <span aria-hidden="true" className={`shrink-0 text-xs ${current ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-500"}`}>•</span>
                <span className="min-w-0 flex-1 break-words">{subject.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200/70 p-1">
          <Link href="/questions" className="block rounded px-2 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">View all questions →</Link>
        </div>
      </section>
    </aside>
  );
}
