"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Breadcrumbs from "./Breadcrumbs";
import GlobalFooter from "./GlobalFooter";
import GlobalHeader from "./GlobalHeader";
import LeftNavigation from "./LeftNavigation";
import MobileNavigationDrawer from "./MobileNavigationDrawer";
import RightNavigation from "./RightNavigation";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => { closeMenu(); }, [pathname, closeMenu]);
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <GlobalHeader menuOpen={menuOpen} onMenuClick={() => setMenuOpen((open) => !open)} />
    <MobileNavigationDrawer open={menuOpen} onClose={closeMenu} />
    <div className="mx-auto w-full max-w-screen-2xl flex-1 px-4 sm:px-6 lg:px-8"><Breadcrumbs />
      <div className="grid min-w-0 grid-cols-1 gap-6 pb-8 lg:grid-cols-[13rem_minmax(0,1fr)_14rem] lg:items-start">
        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 lg:block"><LeftNavigation /></aside>
        <div id="main-content" className="min-w-0">{children}</div>
        <div className="min-w-0 lg:sticky lg:top-20"><RightNavigation /></div>
      </div>
    </div><GlobalFooter />
  </div>;
}
