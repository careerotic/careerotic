import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const admin = path === "/admin" || path.startsWith("/admin/");
  const protectedPath = ["/dashboard", "/account", "/saved-questions"].some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  const authRedirectPath = ["/login", "/signup", "/forgot-password"].includes(path);

  // Public pages do not need a session lookup here. Avoid an auth round-trip
  // on every public navigation; protected and auth-redirect routes still
  // verify claims before deciding whether to allow or redirect the request.
  if (!admin && !protectedPath && !authRedirectPath) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase public environment variables.");

  let authResponse = response;
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies, headers) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        authResponse = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => authResponse.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([name, value]) => authResponse.headers.set(name, value));
      },
    },
  });
  const result = await supabase.auth.getClaims();
  const claims = result.data?.claims as Record<string, any> | undefined;
  const signedIn = Boolean(claims && !result.error);

  const safeNextPath = (value: string | null) => {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes(String.fromCharCode(92))) return "/dashboard";
    const blocked = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth"];
    if (blocked.some((item) => value === item || value.startsWith(item + "/") || value.startsWith(item + "?") || value.startsWith(item + "#"))) return "/dashboard";
    return value;
  };

  if (admin && !signedIn) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.search = "";
    target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }
  if (admin && claims?.app_metadata?.role !== "admin") {
    const target = request.nextUrl.clone();
    target.pathname = "/dashboard";
    target.search = "";
    target.searchParams.set("error", "admin_required");
    return NextResponse.redirect(target);
  }
  if (protectedPath && !signedIn) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.search = "";
    target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }
  if (signedIn && authRedirectPath) {
    const target = request.nextUrl.clone();
    const destination = safeNextPath(request.nextUrl.searchParams.get("next"));
    target.pathname = destination.split("?")[0];
    target.search = destination.includes("?") ? destination.slice(destination.indexOf("?")) : "";
    return NextResponse.redirect(target);
  }
  return authResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
