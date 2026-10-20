"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type HeaderUser = { email: string; fullName: string; isAdmin: boolean };
type Props = { onMenuClick: () => void; menuOpen: boolean; initialUser: HeaderUser | null };

export default function GlobalHeader({ onMenuClick, menuOpen, initialUser }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(initialUser);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) { setUser(null); return; }
      const current = session.user;
      setUser({
        email: current.email ?? "",
        fullName: typeof current.user_metadata?.full_name === "string" ? current.user_metadata.full_name : "",
        isAdmin: current.app_metadata?.role === "admin",
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    setSigningOut(true);
    setAuthError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      setUser(null);
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  const displayName = user?.fullName.trim() || user?.email || "My account";
  const navLink = "rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="app-page-gutter mx-auto flex h-12 w-full max-w-[1760px] items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen} aria-controls="mobile-primary-navigation" onClick={onMenuClick}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 lg:hidden">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
          <Link href="/" className="flex shrink-0 items-center gap-1.5 rounded-md text-base font-extrabold tracking-tight text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 sm:text-lg">
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md bg-indigo-700 text-xs font-black text-white">C</span>
            <span>Careerotic</span>
          </Link>
          <nav aria-label="Main navigation" className="ml-2 hidden items-center gap-0.5 md:flex">
            <Link href="/questions" className={navLink}>Questions</Link>
            <Link href="/exams" className={navLink}>Exams</Link>
          </nav>
        </div>
        <nav aria-label="Account navigation" className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {user ? (
            <>
              {user.isAdmin && <Link href="/admin" className={navLink + " hidden text-indigo-700 sm:inline-flex"}>Admin</Link>}
              <Link href="/dashboard" title={user.email} className={"max-w-24 truncate " + navLink + " sm:max-w-40"}>{displayName}</Link>
              <Link href="/account" className={navLink + " hidden sm:inline-flex"}>Account</Link>
              <button type="button" onClick={signOut} disabled={signingOut}
                className="rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60">
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={navLink}>Sign in</Link>
              <Link href="/signup" className="rounded-md bg-indigo-700 px-2.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1">Create account</Link>
            </>
          )}
        </nav>
      </div>
      {authError && <p role="alert" className="border-t border-red-100 bg-red-50 px-3 py-1.5 text-right text-xs text-red-700">{authError}</p>}
    </header>
  );
}
