"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email,setEmail]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [sent,setSent]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSent(false);
    try {
      const supabase=createClient();
      const redirectTo=new URL("/auth/callback?next=/reset-password",window.location.origin).toString();
      const {error:resetError}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});
      if(resetError) throw resetError;
      setSent(true);
    } catch(e) { setError(e instanceof Error?e.message:"Unable to request a password reset. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><Link href="/login" className="text-sm font-semibold text-indigo-700">← Back to sign in</Link><h1 className="mt-7 text-3xl font-bold">Reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-600">Enter the email address associated with your account. We’ll send a reset link if the account can receive one.</p><form onSubmit={submit} className="mt-7 space-y-5"><div><label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email address</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></div>{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{sent&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">If this address is registered, a password reset email should arrive shortly. Check your inbox and spam folder.</p>}<button disabled={busy} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy?"Sending…":"Send reset link"}</button></form></section></main>;
}
