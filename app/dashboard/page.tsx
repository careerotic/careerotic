"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router=useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function signOut() {
    setBusy(true);setError("");
    try {
      const {error:signOutError}=await createClient().auth.signOut();
      if(signOutError) throw signOutError;
      router.replace("/");router.refresh();
    } catch(e) {setError(e instanceof Error?e.message:"Unable to sign out. Please try again.");setBusy(false);}
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900"><div className="mx-auto max-w-3xl"><header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5"><Link href="/" className="text-lg font-bold text-indigo-700">Careerotic</Link><button onClick={signOut} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">{busy?"Signing out…":"Sign out"}</button></header><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><p className="text-sm font-semibold text-indigo-700">YOUR ACCOUNT</p><h1 className="mt-2 text-3xl font-bold">Welcome to Careerotic</h1><p className="mt-3 leading-7 text-slate-600">You are signed in. This is the starting point for your exam-preparation dashboard; learning features will be connected here as they are implemented.</p>{error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}</section></div></main>;
}
