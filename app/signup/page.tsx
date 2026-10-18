"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber.trim(),
            date_of_birth: dateOfBirth,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user && !data.session) {
        setSuccess("Account registration started. Check your email for a confirmation link before signing in.");
      } else {
        setSuccess("Your account has been created successfully.");
      }
      setPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <span aria-hidden="true">←</span> Careerotic
        </Link>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold text-indigo-700">CAREEROTIC</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Join Careerotic and prepare for your next exam.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">Full Name <span aria-hidden="true">*</span></label>
              <input id="fullName" name="fullName" autoComplete="name" required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email Address <span aria-hidden="true">*</span></label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium">Phone Number <span aria-hidden="true">*</span></label>
              <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" required maxLength={30} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="01XXXXXXXXX" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="mb-1.5 block text-sm font-medium">Date of Birth <span aria-hidden="true">*</span></label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" required max={new Date().toISOString().slice(0, 10)} value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password <span aria-hidden="true">*</span></label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">Confirm Password <span aria-hidden="true">*</span></label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={confirmPassword.length > 0 && confirmPassword !== password} aria-describedby="confirmPasswordHelp" placeholder="Re-enter your password" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
              <p id="confirmPasswordHelp" className="mt-1.5 text-xs text-slate-500">Used only to check that both passwords match; it is not saved.</p>
              {confirmPassword.length > 0 && confirmPassword !== password && <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>}
            </div>

            <p className="text-sm leading-6 text-slate-600">
              By creating an account, you acknowledge our{" "}
              <Link href="/terms" className="font-medium text-indigo-700 underline underline-offset-2">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="font-medium text-indigo-700 underline underline-offset-2">Privacy Policy</Link>.
              No checkbox is required.
            </p>

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="rounded-lg bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{success}</p>}

            <button type="submit" disabled={busy || (confirmPassword.length > 0 && confirmPassword !== password)} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link href="/login" className="font-semibold text-indigo-700 underline underline-offset-2">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
