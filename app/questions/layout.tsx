import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Questions & MCQ Question Bank",
  description: "Explore published competitive exam practice questions by subject, topic, and language. Review multiple-choice options, answers, and explanations on Careerotic.",
  alternates: { canonical: "/questions" },
  openGraph: {
    title: "Practice Questions & MCQ Question Bank | Careerotic",
    description: "Browse published subject-wise MCQ questions and practise for competitive exams.",
    url: "/questions",
  },
};

export default function QuestionsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
