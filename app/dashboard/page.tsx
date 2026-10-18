"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    void createClient().auth.getClaims().then(({ data }) => {
      if (active) setIsAdmin((data?.claims as Record<string, any> | undefined)?.app_metadata?.role === "admin");
    });
    return () => { active = false; };
  }, []);

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-700">YOUR ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome to Careerotic</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <Link href="/admin" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Admin panel</Link>}
          <Link href="/account" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">My account</Link>
          <button onClick={signOut} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">{busy ? "Signing out…" : "Sign out"}</button>
        </div>
      </div>
      <p className="mt-4 leading-7 text-slate-600">You are signed in. This is the starting point for your exam-preparation dashboard; learning features will be connected here as they are implemented.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
