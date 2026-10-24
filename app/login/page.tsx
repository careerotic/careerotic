"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nextPath = searchParams.get("next");
  const callbackError = searchParams.get("auth_error") === "confirmation" ? "That confirmation link is invalid or expired. Request a new email or sign in if your account is already confirmed." : "";
  const destination = nextPath?.startsWith("/") && !nextPath.startsWith("//") && !nextPath.includes("\\") && !/[\x00-\x1F]/.test(nextPath) && nextPath.length <= 2048 ? nextPath : "/dashboard";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      router.replace(destination);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in. Please try again.");
    } finally { setBusy(false); }
  }
  const field = "w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><Link href="/" className="text-sm font-semibold text-indigo-700">← Careerotic</Link><p className="mt-7 text-sm font-semibold text-indigo-700">CAREEROTIC</p><h1 className="mt-2 text-3xl font-bold">Sign in</h1><p className="mt-2 text-sm text-slate-600">Continue your exam preparation.</p><form onSubmit={submit} className="mt-7 space-y-5"><div><label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email address</label><input className={field} id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} /></div><div><label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label><input className={field} id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></div><div className="text-right"><Link href="/forgot-password" className="text-sm font-medium text-indigo-700 underline">Forgot password?</Link></div>{(error || callbackError) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error || callbackError}</p>}<button disabled={busy} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60">{busy?"Signing in…":"Sign in"}</button></form><p className="mt-6 text-center text-sm text-slate-600">New to Careerotic? <Link href="/signup" className="font-semibold text-indigo-700 underline">Create an account</Link></p></section></main>;
}
export default function LoginPage() { return <Suspense fallback={<main className="min-h-screen bg-slate-50 px-4 py-12" aria-busy="true" aria-label="Loading sign-in"><section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><Skeleton className="h-4 w-28 rounded bg-slate-200" /><Skeleton className="mt-7 h-8 w-40 rounded bg-slate-200" /><Skeleton className="mt-3 h-4 w-56 rounded bg-slate-100" /><div className="mt-7 space-y-4"><Skeleton className="h-11 rounded-lg bg-slate-100" /><Skeleton className="h-11 rounded-lg bg-slate-100" /><Skeleton className="h-11 rounded-lg bg-indigo-100" /></div></section></main>}><LoginForm /></Suspense>; }
