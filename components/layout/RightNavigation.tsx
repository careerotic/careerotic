"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
        const supabase = createClient();
        const { data, error } = await supabase.from("subjects").select("id,name,slug").order("name", { ascending: true });
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
    <aside aria-label="Browse learning content" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700">Question bank</p>
          <h2 className="mt-0.5 text-sm font-bold text-slate-900">Browse subjects</h2>
        </div>
        <nav aria-label="Subjects" className="max-h-[min(48vh,28rem)] overflow-y-auto p-1.5">
          {loading ? <div className="space-y-1.5 p-1.5" role="status" aria-label="Loading subjects">{[1, 2, 3].map((item) => <div key={item} className="h-8 animate-pulse rounded-md bg-slate-100" />)}</div>
          : loadError ? <p role="status" className="px-2 py-3 text-xs text-rose-700">{loadError}</p>
          : subjects.length === 0 ? <...[truncated]