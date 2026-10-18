import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Careerotic", template: "%s | Careerotic" },
  description: "Prepare for your next competitive exam with Careerotic.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><AppShell>{children}</AppShell></Suspense>
      </body>
    </html>
  );
}
