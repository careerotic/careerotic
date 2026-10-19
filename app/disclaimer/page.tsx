import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Educational Disclaimer",
  description: "Important information about Careerotic practice questions, explanations, and exam-preparation materials.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Policies</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Educational Disclaimer</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Careerotic is a study and practice resource. Please read these limitations before relying on its materials.
        </p>
      </header>

      <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 sm:p-5">
        <section>
          <h2 className="font-semibold text-slate-900">For educational purposes</h2>
          <p className="mt-1">Questions, answer keys, explanations, study guides, and practice results are provided to support independent learning. They are not professional, legal, or official recruitment advice.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">Accuracy and completeness</h2>
          <p className="mt-1">We aim to make learning materials useful and accurate, but content may contain mistakes, omissions, or information that becomes outdated. Verify important facts against authoritative sources and report a suspected question or answer issue where the reporting control is available.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">Official exams and outcomes</h2>
          <p className="mt-1">Unless expressly stated otherwise, Careerotic practice exams are not official examinations and Careerotic does not represent a recruiting authority. Practice scores do not guarantee admission, eligibility, employment, or performance in a real examination.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900">External sources</h2>
          <p className="mt-1">Links to external websites are provided for reference. Their content, accuracy, availability, and privacy practices are controlled by their respective operators.</p>
        </section>
      </article>

      <p className="text-sm text-slate-600">
        For questions about using the platform, visit <Link href="/help" className="font-medium text-indigo-700 underline underline-offset-2">Help & FAQ</Link>. See also the <Link href="/terms" className="font-medium text-indigo-700 underline underline-offset-2">Terms of use</Link>.
      </p>
    </main>
  );
}
