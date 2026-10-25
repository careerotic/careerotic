import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Careerotic handles account information, cookies, service providers, and advertising technologies.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Information we process",
    body: "Depending on how you use Careerotic, we may process account details you submit, such as your email address and profile information; practice activity, saved questions, and exam-attempt data needed to provide requested features; and technical information such as browser, device, log, and security data. The exact information depends on the features you use.",
  },
  {
    title: "How we use information",
    body: "We use information to operate and secure the service, authenticate accounts, save progress where supported, provide question and exam features, troubleshoot errors, prevent abuse, and maintain the platform. We do not describe optional processing as mandatory where it is not required for a feature.",
  },
  {
    title: "Service providers and hosting",
    body: "Careerotic uses third-party infrastructure providers to host the application and support authentication and application data, including Vercel and Supabase. Those providers may process technical or account-related information as needed to provide their services, subject to their own terms and privacy practices.",
  },
  {
    title: "Cookies, advertising, and Google",
    body: "Careerotic may use essential browser storage or similar technologies for functions such as authentication, security, and remembering service state. If Google AdSense or other advertising services are enabled, Google and its partners may use cookies, web beacons, IP addresses, or other identifiers to deliver, measure, limit, and, depending on settings and applicable rules, personalize ads. Third-party vendors, including Google, may place and read cookies in your browser or use web beacons or IP addresses when serving ads on this site. See our Cookie Policy and Google's information about how it uses data on partner sites.",
  },
  {
    title: "Choices and controls",
    body: "You can manage cookies through your browser settings. Google provides controls for advertising personalization through Google Ads Settings. Where applicable law requires consent for advertising or analytics technologies, those technologies should be configured to respect the required consent choices before they are used. Browser controls may affect sign-in or other site features.",
  },
  {
    title: "Retention and security",
    body: "We retain information for as long as reasonably needed to provide the service, maintain security, meet applicable obligations, and resolve disputes. Retention can vary by data type and feature. We use reasonable safeguards, but no online system can be guaranteed completely secure.",
  },
  {
    title: "Your requests and children",
    body: "Depending on applicable law, you may have rights to request access to, correction of, or deletion of personal information. Use the available account features or visit Contact & Support to find the support routes currently available. Careerotic is designed as a general exam-preparation service, not as a service directed to children under 13.",
  },
  {
    title: "Changes and contact",
    body: "We may update this policy when the service, technology, or applicable requirements change. The updated date below indicates the latest editorial revision. For support options, visit Contact & Support.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Policies</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This policy explains how Careerotic may process information when you browse the site or use its learning features.</p>
        <p className="mt-3 text-xs text-slate-500">Last updated: October 25, 2026</p>
      </header>
      <article className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{section.body}</p>
          </section>
        ))}
        <section>
          <h2 className="text-base font-semibold text-slate-900">Third-party information</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Learn more in <a className="font-medium text-indigo-700 underline underline-offset-2" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use its services</a> and <a className="font-medium text-indigo-700 underline underline-offset-2" href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
        </section>
      </article>
      <p className="text-sm text-slate-600">Related: <Link href="/cookies" className="font-medium text-indigo-700 underline underline-offset-2">Cookie Policy</Link> · <Link href="/terms" className="font-medium text-indigo-700 underline underline-offset-2">Terms of Use</Link> · <Link href="/contact" className="font-medium text-indigo-700 underline underline-offset-2">Contact & Support</Link>.</p>
    </main>
  );
}
