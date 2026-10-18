"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router=useRouter(); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [success,setSuccess]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    if(password.length<8) {setError("Use a password with at least 8 characters.");return;}
    if(password!==confirm) {setError("Passwords do not match.");return;}
    setBusy(true);
    try {
      const supabase=createClient();
      const {error:updateError}=await supabase.auth.updateUser({password});
      if(updateError) throw updateError;
      setSuccess("Password updated. You can now continue to your account.");
      setPassword("");setConfirm("");
      router.replace("/dashboard");router.refresh();
    } catch(e) {setError(e instanceof Error?e.message:"Unable to update password. Open the latest reset email link and try again.");}
    finally {setBusy(false);}
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><Link href="/login" className="text-sm font-semibold text-indigo-700">← Sign in</Link><h1 className="mt-7 text-3xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-slate-600">Use at least 8 characters.</p><form onSubmit={submit} className="mt-7 space-y-5"><div><label htmlFor="password" className="mb-1.5 block text-sm font-medium">New password</label><input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></div><div><label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">Confirm new password</label><input id="confirm" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></div>{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}<button disabled={busy} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy?"Updating…":"Update password"}</button></form></section></main>;
}
