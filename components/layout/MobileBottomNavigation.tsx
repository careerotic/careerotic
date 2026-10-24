"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/questions", label: "Practice", icon: "practice" },
  { href: "/exams", label: "Exams", icon: "exams" },
  { href: "/saved-questions", label: "Saved", icon: "saved" },
  { href: "/account", label: "Account", icon: "account" },
] as const;

type IconName = (typeof destinations)[number]["icon"];

function NavigationIcon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: "h-5 w-5",
  };

  switch (name) {
    case "home":
      return <svg {...common}><path d="m3.5 10 8.5-7 8.5 7" /><path d="M5.5 9v11h13V9M9 20v-6h6v6" /></svg>;
    case "practice":
      return <svg {...common}><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5z" /><path d="M5 4.5v17M9 6h7M9 10h7" /></svg>;
    case "exams":
      return <svg {...common}><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" /></svg>;
    case "saved":
      return <svg {...common}><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4z" /></svg>;
    case "account":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
  }
}

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/questions") {
    return ["/questions", "/subjects", "/search", "/study-guides", "/current-affairs"].some(
      (base) => pathname === base || pathname.startsWith(base + "/"),
    );
  }
  if (href === "/exams") {
    return pathname === "/exams" || pathname.startsWith("/exams/") ||
      (pathname.startsWith("/exam/") && !pathname.includes("/attempt/"));
  }
  if (href === "/saved-questions") return pathname === href || pathname.startsWith(href + "/");
  return ["/account", "/dashboard", "/my-exams", "/my-results", "/study-plan"].some(
    (base) => pathname === base || pathname.startsWith(base + "/"),
  );
}

export default function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid min-h-14 max-w-xl grid-cols-5">
        {destinations.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 ${active ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"}`}
            >
              <span className={`flex h-7 w-10 items-center justify-center rounded-full ${active ? "bg-indigo-50" : ""}`}>
                <NavigationIcon name={item.icon} />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
