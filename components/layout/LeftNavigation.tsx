"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/questions", label: "Questions", icon: "?" },
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/account", label: "My account", icon: "○" },
];

type Props = { onNavigate?: () => void; id?: string };

export default function LeftNavigation({ onNavigate, id }: Props) {
  const pathname = usePathname();

  return (
    <nav id={id} aria-label="Primary navigation" className="space-y-1">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-current/15 text-xs">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
