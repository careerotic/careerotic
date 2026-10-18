import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase public environment variables.");
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies, headers) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  const result = await supabase.auth.getClaims();
  const claims = result.data?.claims as Record<string, any> | undefined;
  const signedIn = Boolean(claims && !result.error);
  const path = request.nextUrl.pathname;
  const admin = path === "/admin" || path.startsWith("/admin/");
  const protectedPath = ["/dashboard", "/account"].some((p) => path === p || path.startsWith(p + "/"));
  if (admin && !signedIn) {
    const target = request.nextUrl.clone(); target.pathname = "/login"; target.search = ""; target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }
  if (admin && claims?.app_metadata?.role !== "admin") {
    const target = request.nextUrl.clone(); target.pathname = "/dashboard"; target.search = ""; target.searchParams.set("error", "admin_required");
    return NextResponse.redirect(target);
  }
  if (protectedPath && !signedIn) {
    const target = request.nextUrl.clone(); target.pathname = "/login"; target.search = ""; target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }
  if (signedIn && ["/signup", "/login", "/forgot-password"].includes(path)) {
    const target = request.nextUrl.clone(); target.pathname = "/dashboard"; target.search = "";
    return NextResponse.redirect(target);
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
