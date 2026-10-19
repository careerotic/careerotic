"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/questions", label: "Question bank", icon: "?" },
  { href: "/exams", label: "Exams", icon: "▤" },
  { href: "/exam-categories", label: "Exam categories", icon: "C" },
  { href: "/subjects", label: "Subjects", icon: "S" },
  { href: "/study-guides", label: "Study guides", icon: "G" },
  { href: "/current-affairs", label: "Current affairs", icon: "N" },
  { href: "/search", label: "Search", icon: "⌕" },
  { href: "/help", label: "Help & FAQ", icon: "?" },
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/my-exams", label: "My exams", icon: "E" },
  { href: "/my-results", label: "My results", icon: "R" },
  { href: "/saved-questions", label: "Saved questions", icon: "☆" },
  { href: "/study-plan", label: "Study plan", icon: "✓" },
  { href: "/account", label: "My account", icon: "○" },
];

type Props = { onNavigate?: () => void; id?: string };

export default function LeftNavigation({ onNavigate, id }: Props) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.auth.getClaims().then(({ data }) => {
      if (active) {
        const claims = data?.claims as { app_metadata?: { role?: string } } | undefined;
        setIsAdmin(claims?.app_metadata?.role === "admin");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" || !session?.user) setIsAdmin(false);
      else setIsAdmin(session.user.app_metadata?.role === "admin");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <nav id={id} aria-label="Primary navigation" className="space-y-0.5">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Explore Careerotic</p>
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link key={link.href} href={link.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${active ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            <span aria-hidden="true" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current/15 text-xs">{link.icon}</span>
            <span>{link.label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" aria-hidden="true" />}
          </Link>
        );
      })}
      {isAdmin && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Administration</p>
          <Link href="/admin" onClick={onNavigate} aria-current={pathname === "/admin" || pathname.startsWith("/admin/") ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${pathname === "/admin" || pathname.startsWith("/admin/") ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-current/15 text-xs">⚙</span>
            Admin panel
          </Link>
        </div>
      )}
    </nav>
  );
}
