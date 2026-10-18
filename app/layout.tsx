import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Careerotic", template: "%s | Careerotic" },
  description: "Prepare for your next competitive exam with Careerotic.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [{ data: userResult }, { data: claimsResult }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ]);
  const user = userResult.user;
  const initialUser = user
    ? {
        email: user.email ?? "",
        fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
        isAdmin: (claimsResult?.claims as Record<string, unknown> | undefined)?.app_metadata !== undefined
          && ((claimsResult?.claims as { app_metadata?: { role?: string } } | undefined)?.app_metadata?.role === "admin"),
      }
    : null;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
          <AppShell initialUser={initialUser}>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
