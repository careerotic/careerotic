import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

export default async function AuthAwareAppShell({ children }: { children: React.ReactNode }) {
  // The shell reads the request's Supabase session, so this must run in the
  // request context rather than during static prerendering. This also prevents
  // Supabase auth's internal clock reads from triggering Next.js's
  // blocking-prerender-current-time error.
  await connection();

  const supabase = await createClient();
  const [{ data: userResult }, { data: claimsResult }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ]);
  const user = userResult.user;
  const claims = claimsResult?.claims as { app_metadata?: { role?: string } } | undefined;
  const initialUser = user
    ? {
        email: user.email ?? "",
        fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
        isAdmin: claims?.app_metadata?.role === "admin",
      }
    : null;

  return <AppShell initialUser={initialUser}>{children}</AppShell>;
}
