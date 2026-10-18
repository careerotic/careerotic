"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
};

function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<AccountForm>({ fullName: "", email: "", phoneNumber: "", dateOfBirth: "" });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      try {
        const supabase = createClient();
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data.user) throw new Error("Your session has expired. Please sign in again.");
        if (!active) return;
        setProfile({
          fullName: typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : "",
          email: data.user.email ?? "",
          phoneNumber: typeof data.user.user_metadata?.phone_number === "string" ? data.user.user_metadata.phone_number : "",
          dateOfBirth: typeof data.user.user_metadata?.date_of_birth === "string" ? data.user.user_metadata.date_of_birth : "",
        });
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load your account.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAccount();
    return () => { active = false; };
  }, []);

  function change<K extends keyof AccountForm>(key: K, value: AccountForm[K]) {
    setProfile(current => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (profile.dateOfBirth && profile.dateOfBirth > todayLocalDate()) {
      setError("Date of birth cannot be in the future.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName.trim(),
          phone_number: profile.phoneNumber.trim(),
          date_of_birth: profile.dateOfBirth,
        },
      });
      if (updateError) throw updateError;
      const user = data.user;
      setProfile(current => ({
        ...current,
        fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : current.fullName,
        phoneNumber: typeof user.user_metadata?.phone_number === "string" ? user.user_metadata.phone_number : current.phoneNumber,
        dateOfBirth: typeof user.user_metadata?.date_of_birth === "string" ? user.user_metadata.date_of_birth : current.dateOfBirth,
        email: user.email ?? current.email,
      }));
      setEditing(false);
      setNotice("Your account details have been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-600";
  const label = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-indigo-700">Careerotic</Link>
          <Link href="/dashboard" className="text-sm font-semibold text-indigo-700 hover:underline">← Dashboard</Link>
        </header>
        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-indigo-700">YOUR ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Account details</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Review the details associated with your Careerotic sign-in account.</p>
          {loading ? (
            <p className="mt-7 text-sm text-slate-600">Loading your account details…</p>
          ) : (
            <form onSubmit={save} className="mt-7 space-y-5">
              <div><label className={label} htmlFor="fullName">Full name</label><input className={field} id="fullName" autoComplete="name" required maxLength={120} disabled={!editing || busy} value={profile.fullName} onChange={e => change("fullName", e.target.value)} /></div>
              <div><label className={label} htmlFor="email">Email address</label><input className={field} id="email" type="email" autoComplete="email" disabled value={profile.email} /><p className="mt-1.5 text-xs text-slate-500">Email is your sign-in identifier and cannot be changed from this form.</p></div>
              <div><label className={label} htmlFor="phoneNumber">Phone number</label><input className={field} id="phoneNumber" type="tel" autoComplete="tel" required maxLength={30} disabled={!editing || busy} value={profile.phoneNumber} onChange={e => change("phoneNumber", e.target.value)} /></div>
              <div><label className={label} htmlFor="dateOfBirth">Date of birth</label><input className={field} id="dateOfBirth" type="date" autoComplete="bday" max={todayLocalDate()} required disabled={!editing || busy} value={profile.dateOfBirth} onChange={e => change("dateOfBirth", e.target.value)} /></div>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-lg bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{notice}</p>}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                {!editing ? (
                  <button type="button" onClick={() => { setError(""); setNotice(""); setEditing(true); }} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800">Update details</button>
                ) : (
                  <>
                    <button type="submit" disabled={busy} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
                    <button type="button" disabled={busy} onClick={() => { setEditing(false); setError(""); setProfile(current => ({ ...current })); void (async () => { const { data } = await createClient().auth.getUser(); if (data.user) setProfile({ fullName: String(data.user.user_metadata?.full_name ?? ""), email: data.user.email ?? "", phoneNumber: String(data.user.user_metadata?.phone_number ?? ""), dateOfBirth: String(data.user.user_metadata?.date_of_birth ?? "") }); })(); }} className="w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
                  </>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
