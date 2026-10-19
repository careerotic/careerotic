import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exam result",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ExamResultLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
