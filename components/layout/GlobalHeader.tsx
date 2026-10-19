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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-4 xl:px-5">
        <div className="flex min-w-0 items...[truncated]