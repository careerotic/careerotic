import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import AuthAwareAppShell from "@/components/layout/AuthAwareAppShell";
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
  icons: { icon: [{ url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" }, { url: "/brand/careerotic-mark.svg", type: "image/svg+xml" }], shortcut: "/favicon.ico", apple: "/brand/careerotic-mark.svg" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0F172A" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a href="#main-content" className="sr-only z-[100] rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-700 focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          Skip to main content
        </a>
        <AuthAwareAppShell>{children}</AuthAwareAppShell>
      </body>
    </html>
  );
}
