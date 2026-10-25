import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

export default async function AuthAwareAppShell({ children }: { children: React.ReactNode }) {
  // This shell only needs the verified identity claims used by the header.
  // getClaims verifies the access token without a separate user-profile request
  // when the project uses asymmetric signing keys.
  await connection();

  const supabase = await createClient();
  const { data: claimsResult } = await supabase.auth.getClaims();
  const claims = claimsResult?.claims as {
    sub?: string;
    email?: string;
    user_metadata?: { full_name?: unknown };
    app_metadata?: { role?: string };
  } | undefined;
  const initialUser = claims?.sub
    ? {
        email: typeof claims.email === "string" ? claims.email : "",
        fullName: typeof claims.user_metadata?.full_name === "string" ? claims.user_metadata.full_name : "",
        isAdmin: claims.app_metadata?.role === "admin",
      }
    : null;

  return <AppShell initialUser={initialUser}>{children}</AppShell>;
}
