"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type HeaderUser = {
  email: string;
  fullName: string;
  isAdmin: boolean;
};

type Props = {
  onMenuClick: () => void;
  menuOpen: boolean;
  initialUser: HeaderUser | null;
};

export default function GlobalHeader({ onMenuClick, menuOpen, initialUser }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(initialUser);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        return;
      }
      const current = session.user;
      setUser({
        email: current.email ?? "",
        fullName: typeof current.user_metadata?.full_name === "string" ? current.user_metadata.full_name : "",
        isAdmin: false,
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    setSigningOut(true);
    setAuthError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
          <Link href="/" className="truncate text-xl font-bold tracking-tight text-indigo-700">Careerotic</Link>
        </div>

        <nav aria-label="Account navigation" className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              {user.isAdmin && <Link href="/admin" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:inline-flex">Admin</Link>}
              <Link href="/dashboard" title={user.email} className="max-w-44 truncate rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                {displayName}
              </Link>
              <Link href="/account" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex">Account</Link>
              <button type="button" onClick={signOut} disabled={signingOut} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Create account</Link>
            </>
          )}
        </nav>
      </div>
      {authError && <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-right text-xs text-red-700">{authError}</p>}
    </header>
  );
}
