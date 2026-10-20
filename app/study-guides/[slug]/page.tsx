import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const guides: Record<string, { title: string; intro: string; sections: { title: string; items: string[] }[] }> = {
  "bcs-preliminary-strategy": {
    title: "BCS Preliminary Study Strategy",
    intro: "A repeatable system for planning practice and revision.",
    sections: [
      { title: "Use available material", items: ["Use the existing subjects, topics, published questions, and published exams as the source of your plan.", "Check which topics are actually present; do not assume the bank covers every syllabus item."] },
      { title: "Practise active recall", items: ["Attempt a question before revealing its answer and explain why your choice is right or wrong.", "Bookmark difficult questions and revisit them after a delay."] },
      { title: "Review weekly", items: ["Separate errors into knowledge gaps, misreading, calculation, and time management.", "Adjust next week's focus using your actual practice, not invented progress scores."] },
    ],
  },
  "bangla-grammar": {
    title: "Bangla Grammar Revision",
    intro: "Structure grammar revision around rules and examples.",
    sections: [
      { title: "Create a topic checklist", items: ["Choose topics from the existing Bangla subject taxonomy.", "Write each rule in your own words and add a correct example."] },
      { title: "Practise and revisit", items: ["Attempt questions before opening explanations.", "Revisit missed questions the next day and again later in the week."] },
    ],
  },
  "english-grammar": {
    title: "English Grammar Practice",
    intro: "Improve accuracy with focused practice and review.",
    sections: [
      { title: "Work in short sets", items: ["Choose a topic from the existing English taxonomy.", "State the rule that supports your answer before checking it."] },
      { title: "Keep an error log", items: ["Record the pattern, the rule missed, and a corrected example.", "Repeat difficult questions after a delay rather than memorizing option letters."] },
    ],
  },
  "math-and-mental-ability": {
    title: "Mathematics & Mental Ability",
    intro: "Improve speed without sacrificing reasoning.",
    sections: [
      { title: "Build accuracy first", items: ["Write down the steps or mental shortcut before revealing the answer.", "Identify the exact step that caused a calculation or concept error."] },
      { title: "Practise timing", items: ["Start with untimed accuracy work, then move to short timed sets.", "Re-solve missed questions without looking at previous work."] },
    ],
  },
  "general-knowledge": {
    title: "General Knowledge Revision",
    intro: "Keep stable knowledge distinct from dated developments.",
    sections: [
      { title: "Verify facts", items: ["Prefer official publications for government decisions, exam notices, and institutional announcements.", "For current affairs, record the event date, publication date, and primary source."] },
      { title: "Turn reading into recall", items: ["Close the source and summarize from memory.", "Create practice questions only after checking the fact and its source."] },
    ],
  },
};

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides[slug];

  if (!guide) {
    return { title: "Study guide not found", robots: { index: false, follow: false } };
  }

  const canonical = `/study-guides/${slug}`;
  return {
    title: guide.title,
    description: guide.intro,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: guide.title,
      description: guide.intro,
    },
    twitter: {
      card: "summary",
      title: guide.title,
      description: guide.intro,
    },
  };
}

export default async function StudyGuideDetail({ params }: RouteProps) {
  const { slug } = await params;
  const guide = guides[slug];
  if (!guide) notFound();

  return (
    <main className="space-y-4">
      <header className="rounded-xl border bg-white p-4">
        <Link href="/study-guides" className="text-xs font-semibold text-indigo-700">← All study guides</Link>
        <h1 className="mt-3 text-2xl font-bold">{guide.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{guide.intro}</p>
      </header>
      {guide.sections.map((section) => (
        <section key={section.title} className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">{section.title}</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}
      <Link href="/questions" className="inline-flex rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">Practise questions</Link>
    </main>
  );
}
