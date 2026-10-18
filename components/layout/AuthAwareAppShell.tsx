import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AuthAwareAppShell({ children }: { children: React.ReactNode }) {
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
