import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Careerotic",
  description: "Privacy Policy for Careerotic.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/signup" className="text-sm font-semibold text-indigo-700 underline underline-offset-2">← Back to signup</Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-amber-800">Draft policy — review and approve this content before production use.</p>
        <div className="mt-8 space-y-5 leading-7 text-slate-700">
          <section><h2 className="text-lg font-semibold text-slate-900">Information collected</h2><p>When you register, Careerotic collects your name, email address, phone number and date of birth. Supabase Authentication manages your email and password credentials; the password is not stored in your profile metadata.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">How information is used</h2><p>Account information may be used to create and maintain your account, provide exam-preparation features, protect the service, and communicate account-related information.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">Storage and security</h2><p>Careerotic uses Supabase services for authentication and application data. Reasonable technical safeguards should be maintained; no online service can guarantee absolute security.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">Sharing and retention</h2><p>Information may be processed by service providers required to operate Careerotic. Final details about retention periods, legal requests, and any other disclosures must be reviewed and documented before production use.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-900">Your choices and contact</h2><p>Before this policy is finalized, Careerotic should publish a contact method and a process for users to request access, correction, or deletion of personal information where applicable.</p></section>
        </div>
      </article>
    </main>
  );
}
