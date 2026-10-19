"use client";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import Breadcrumbs from "./Breadcrumbs";
import GlobalFooter from "./GlobalFooter";
import GlobalHeader, { type HeaderUser } from "./GlobalHeader";
import LeftNavigation from "./LeftNavigation";
import MobileNavigationDrawer from "./MobileNavigationDrawer";
import RightNavigation from "./RightNavigation";

type Props = { children: React.ReactNode; initialUser: HeaderUser | null };
const focusedRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default function AppShell({ children, initialUser }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState("");
  const pathname = usePathname();
  const drawerOpen = menuOpen && menuPathname === pathname;
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => {
    if (drawerOpen) setMenuOpen(false);
    else { setMenuPathname(pathname); setMenuOpen(true); }
  }, [drawerOpen, pathname]);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  const focusedFlow = focusedRoutes.includes(pathname) || pathname.startsWith("/exam/") || pathname.startsWith("/auth/");
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <GlobalHeader initialUser={initialUser} menuOpen={drawerOpen} onMenuClick={toggleMenu} />
      <MobileNavigationDrawer open={menuOpen} onClose={closeMenu} />
      <div className={`mx-auto w-full flex-1 ${focusedFlow ? "max-w-5xl px-3 sm:px-5 lg:px-6" : "max-w-[1600px] px-3 sm:px-4 xl:px-5"}`}>
        <Breadcrumbs />
        {focusedFlow ? (
          <main id="main-content" className="min-w-0 pb-6">{children}</main>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 pb-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-4 xl:gr...[truncated]