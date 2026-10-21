import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import AuthAwareAppShell from "@/components/layout/AuthAwareAppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import "./globals.css";
const siteUrl = "https://careerotic.vercel.app";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Careerotic",
  title: { default: "Careerotic — Exam Practice & Question Bank", template: "%s | Careerotic" },
  description: "Prepare for competitive exams with Careerotic. Browse subject-wise questions, reveal answers and explanations, and practise with published exams.",
  openGraph: { type: "website", url: siteUrl, siteName: "Careerotic", title: "Careerotic — Exam Practice & Question Bank", description: "Browse subject-wise questions, review explanations, and practise with published exams.", locale: "en_US" },
  twitter: { card: "summary", title: "Careerotic — Exam Practice & Question Bank", description: "Browse subject-wise questions, review explanations, and practise with published exams." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4338ca" };
export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a href="#main-content" className="sr-only z-[100] rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-700 focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">Skip to main content</a>
        <Suspense fallback={<div className="min-h-screen space-y-4 bg-slate-50 px-3 py-5 sm:px-5 sm:py-7" aria-busy="true" aria-label="Loading application"><div className="mx-auto max-w-7xl space-y-4"><Skeleton className="h-14 rounded-xl border border-slate-200 bg-white" /><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="space-y-3"><Skeleton className="h-8 w-48 rounded bg-slate-200" /><Skeleton className="h-24 rounded-xl border border-slate-200 bg-white" /><Skeleton className="h-44 rounded-xl border border-slate-200 bg-white" /></div><Skeleton className="hidden h-64 rounded-xl border border-slate-200 bg-white lg:block" /></div></div></div>}><AuthAwareAppShell>{children}</AuthAwareAppShell></Suspense>
      </body>
    </html>
  );
}
