"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getNextPath() {
    const value = new URLSearchParams(window.location.search).get("next");
    return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (dateOfBirth > new Date().toLocaleDateString("en-CA")) return setError("Date of birth cannot be in the future.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");

    setBusy(true);
    try {
      const supabase = createClient();
      const nextPath = getNextPath();
      const redirectTo = new URL(`/auth/callback?next=${encodeURIComponent(nextPath)}`, window.location.origin).toString();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: fullName.trim(), phone_number: phoneNumber.trim(), date_of_birth: dateOfBirth },
        },
      });
      if (signupError) throw signupError;
      if (data.user && !data.session) {
        setSuccess("Registration started. Check your email and open the confirmation link to activate your account.");
      } else {
        window.location.assign(nextPath);
      }
      setPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">← Careerotic</Link>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-indigo-700">CAREEROTIC</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-2 mb-7 text-sm leading-6 text-slate-600">Join Careerotic and prepare for your next exam.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">Full Name *</label><input id="fullName" name="fullName" autoComplete="name" required maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" className={inputClass} /></div>
            <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email Address *</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} /></div>
            <div><label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium">Phone Number *</label><input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" required maxLength={30} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputClass} /></div>
            <div><label htmlFor="dateOfBirth" className="mb-1.5 block text-sm font-medium">Date of Birth *</label><input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password *</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} /></div>
            <div><label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">Confirm Password *</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} aria-invalid={confirmPassword.length > 0 && confirmPassword !== password} placeholder="Re-enter your password" className={inputClass} /><p className="mt-1.5 text-xs text-slate-500">Confirmation is only used to check the match; it is never saved.</p>{confirmPassword.length > 0 && confirmPassword !== password && <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>}</div>
            <p className="text-sm leading-6 text-slate-600">By creating an account, you acknowledge our <Link href="/terms" className="font-medium text-indigo-700 underline">Terms of Service</Link> and <Link href="/privacy" className="font-medium text-indigo-700 underline">Privacy Policy</Link>. No checkbox is required.</p>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="rounded-lg bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{success}</p>}
            <button type="submit" disabled={busy || (confirmPassword.length > 0 && confirmPassword !== password)} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Creating account…" : "Create Account"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-indigo-700 underline">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
