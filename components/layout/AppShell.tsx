"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearPrivateClientCache, setPrivateCacheUserId } from "@/lib/cache/client-memory";
import { usePathname, useRouter } from "next/navigation";
import Breadcrumbs from "./Breadcrumbs";
import GlobalFooter from "./GlobalFooter";
import GlobalHeader, { type HeaderUser } from "./GlobalHeader";
import LeftNavigation from "./LeftNavigation";
import MobileNavigationDrawer from "./MobileNavigationDrawer";
import MobileBottomNavigation from "./MobileBottomNavigation";
import RightNavigation from "./RightNavigation";

type Props = { children: React.ReactNode; initialUser: HeaderUser | null };
const authenticationRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
const ROUTE_REFRESH_AFTER_MS = 30_000;
const routeVisitedAt = new Map<string, number>();

export default function AppShell({ children, initialUser }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;
    let authEventSeen = false;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      // An auth event is authoritative if it raced with the initial session lookup.
      if (!active || authEventSeen) return;
      currentUserId = data.session?.user.id ?? null;
      setPrivateCacheUserId(currentUserId);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      authEventSeen = true;
      if (event === "SIGNED_OUT" || !session?.user) {
        clearPrivateClientCache();
        setPrivateCacheUserId(null);
        currentUserId = null;
        return;
      }
      if (currentUserId && currentUserId !== session.user.id) {
        clearPrivateClientCache();
      }
      currentUserId = session.user.id;
      setPrivateCacheUserId(currentUserId);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const isAuthenticationOrAdminRoute =
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      authenticationRoutes.includes(pathname) ||
      pathname.startsWith("/auth/");
    const isExamAttempt =
      pathname.startsWith("/attempt/") ||
      (pathname.startsWith("/exam/") && (pathname.endsWith("/attempt") || pathname.includes("/attempt/")));

    // Do not refresh authentication flows, admin screens, or an in-progress exam attempt.
    if (isAuthenticationOrAdminRoute || isExamAttempt) return;

    const now = Date.now();
    const lastVisitedAt = routeVisitedAt.get(pathname);
    routeVisitedAt.delete(pathname);
    routeVisitedAt.set(pathname, now);

    // Bound the per-tab route history to avoid unbounded memory growth.
    while (routeVisitedAt.size > 50) {
      const oldestPath = routeVisitedAt.keys().next().value;
      if (oldestPath === undefined) break;
      routeVisitedAt.delete(oldestPath);
    }

    // The Router Cache renders the previous route immediately; refresh the RSC payload
    // in the background when the page has not been visited recently.
    if (lastVisitedAt !== undefined && now - lastVisitedAt > ROUTE_REFRESH_AFTER_MS) {
      router.refresh();
    }
  }, [pathname, router]);

  const drawerOpen = menuOpen && menuPathname === pathname;
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => {
    if (drawerOpen) setMenuOpen(false);
    else {
      setMenuPathname(pathname);
      setMenuOpen(true);
    }
  }, [drawerOpen, pathname]);
  const isExamAttempt =
    pathname.startsWith("/attempt/") ||
    (pathname.startsWith("/exam/") && (pathname.endsWith("/attempt") || pathname.includes("/attempt/")));
  const showMobileBottomNavigation = !isExamAttempt;

  // Authentication and administration pages keep their existing focused layouts.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    authenticationRoutes.includes(pathname) ||
    pathname.startsWith("/auth/")
  ) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  return (
    <div className={`flex min-h-screen flex-col bg-slate-50 text-slate-900 ${showMobileBottomNavigation ? "pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0" : ""}`}>
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
      {showMobileBottomNavigation && <MobileBottomNavigation />}
    </div>
  );
}
