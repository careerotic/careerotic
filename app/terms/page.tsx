import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Careerotic",
  description: "Terms of Service for Careerotic.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/signup" className="text-sm font-semibold text-indigo-700 underline underline-offset-2">← Back to signup</Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-amber-800">Draft policy — review and approve this content before production use.</p>
        <div className="mt-8 space-y-5 leading-7 text-slate-700">
          <section><h2 className="text-lg font-semibold text-slate-900">Using Careerotic</h2><p>Careerotic provides exam-preparation resources and practice questions. Use the platform lawfully and provide accurate information when creating an account.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">Account security</h2><p>You are responsible for keeping your login credentials secure and for activity carried out through your account. Contact the platform team if you suspect unauthorized access.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">Content and availability</h2><p>Practice materials are provided for educational purposes. We aim to keep the service available and content accurate, but cannot guarantee uninterrupted service or that every item is error-free.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2><p>Do not misuse the platform, interfere with its operation, attempt unauthorized access, or copy and redistribute content in violation of applicable rights or law.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">Updates and contact</h2><p>These draft terms need review and a designated contact method before they are treated as the final terms governing Careerotic accounts.</p></section>
        </div>
      </article>
    </main>
  );
}
