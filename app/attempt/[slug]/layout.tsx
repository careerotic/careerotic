import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exam attempt",
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

export default function ExamAttemptLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
