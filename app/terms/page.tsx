import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms that apply when using Careerotic's exam-preparation and question-bank services.",
  alternates: { canonical: "/terms" },
};

const sections = [
  ["Using the service", "Careerotic provides educational resources for independent exam preparation, including questions, explanations, study materials, and practice exams where available. By using the site, you agree to use it lawfully and in accordance with these terms."],
  ["Accounts and security", "You are responsible for information you submit, keeping your sign-in credentials secure, and activity carried out through your account. Do not attempt to access another person's account or bypass security controls."],
  ["Educational content", "Practice questions, answer keys, explanations, study guides, and results are for learning and revision. Content may contain errors or become outdated. Verify important information with official exam notices and the relevant authority. Practice scores do not guarantee an examination result, admission, eligibility, or employment."],
  ["Acceptable use", "Do not disrupt the service, probe or bypass access controls without authorization, introduce malicious code, scrape or overload the site, impersonate another person, or use the service in a way that violates law or another person's rights."],
  ["Intellectual property", "Do not copy, republish, or commercially redistribute Careerotic materials unless you have the necessary rights or permission. Third-party materials remain subject to their respective rights. If you believe content infringes your rights, use the available support routes to report it."],
  ["Availability and changes", "We may update, suspend, or discontinue features to maintain or improve the service. We aim to keep Careerotic available but do not guarantee uninterrupted access, error-free content, or permanent availability of any particular feature."],
  ["Third-party services and advertising", "The site may rely on third-party service providers and may display advertising if enabled. Third-party websites and services are controlled by their own operators. Do not click ads or interact with advertisements in a way that is artificial, misleading, or intended to generate invalid activity."],
  ["Disclaimer and limitation", "To the extent permitted by applicable law, the service is provided on an 'as available' basis without guarantees that all content is complete, current, or suitable for every purpose. Nothing in these terms excludes rights or responsibilities that cannot legally be excluded."],
  ["Updates and contact", "We may revise these terms as the service changes. Continued use after an updated version is published means you are using the then-current service under the revised terms, subject to applicable law. For support options, visit Contact & Support."],
] as const;

export default function TermsPage() {
  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Policies</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Terms of Use</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Please read these terms before using Careerotic's exam-preparation features.</p>
        <p className="mt-3 text-xs text-slate-500">Last updated: October 25, 2026</p>
      </header>
      <article className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        {sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
          </section>
        ))}
      </article>
      <p className="text-sm text-slate-600">Please also review the <Link href="/privacy" className="font-medium text-indigo-700 underline underline-offset-2">Privacy Policy</Link> and <Link href="/disclaimer" className="font-medium text-indigo-700 underline underline-offset-2">Educational Disclaimer</Link>.</p>
    </main>
  );
}
