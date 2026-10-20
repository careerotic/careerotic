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
const authenticationRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default function AppShell({ children, initialUser }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState("");
  const pathname = usePathname();
  const drawerOpen = menuOpen && menuPathname === pathname;
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => {
    if (drawerOpen) setMenuOpen(false);
    else {
      setMenuPathname(pathname);
      setMenuOpen(true);
    }
  }, [drawerOpen, pathname]);

  // Authentication and administration pages keep their focused page layouts.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    authenticationRoutes.includes(pathname) ||
    pathname.startsWith("/auth/")
  ) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <GlobalHeader initialUser={initialUser} menuOpen={drawerOpen} onMenuClick={toggleMenu} />
      <MobileNavigationDrawer open={drawerOpen} onClose={closeMenu} />
      <div className="app-page-gutter mx-auto flex w-full max-w-[1760px] flex-1 flex-col">
        <Breadcrumbs />
        <div className="app-layout-gap grid min-w-0 flex-1 grid-cols-1 pb-3 lg:grid-cols-[10rem_minmax(0,1fr)] xl:grid-cols-[10rem_minmax(0,1fr)_13rem]">
          <aside className="sticky top-[3.5rem] hidden max-h-[calc(100vh-4rem)] self-start overflow-y-auto py-1 pr-1 lg:block">
            <LeftNavigation />
          </aside>
          <main id="main-content" className="min-w-0 py-1">{children}</main>
          <div className="min-w-0 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-[3.5rem] xl:max-h-[calc(100vh-4rem)] xl:self-start xl:overflow-y-auto xl:py-1">
            <RightNavigation />
          </div>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
