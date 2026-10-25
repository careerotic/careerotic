import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Information about browser storage, cookies, and advertising technologies that may be used by Careerotic and its providers.",
  alternates: { canonical: "/cookies" },
};

export default function CookiePolicyPage() {
  return (
    <main className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Policies</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Cookie Policy</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This page describes cookies and similar technologies that may be used when you visit Careerotic.</p>
        <p className="mt-3 text-xs text-slate-500">Last updated: October 25, 2026</p>
      </header>
      <article className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <section>
          <h2 className="text-base font-semibold text-slate-900">What cookies are</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Cookies are small text files stored by a website in your browser. Similar technologies, including local storage and identifiers, may also store or read information on your device.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-900">Essential site functionality</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Careerotic and its service providers may use cookies or similar browser storage to support sign-in, maintain session state, protect accounts, and provide features you request. Blocking all storage may prevent some features from working correctly.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-900">Advertising cookies and third parties</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">If Google AdSense or another advertising provider is enabled, that provider and its partners may use cookies, web beacons, IP addresses, or other identifiers to deliver ads, limit repeated ads, measure performance, detect invalid traffic, and—depending on your settings and applicable law—personalize advertising. Third parties may place and read cookies in your browser as a result of ad serving on this site.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-900">Manage your choices</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">You can control or delete cookies using your browser settings. You can review Google's advertising controls at <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 underline underline-offset-2">Google Ads Settings</a>. Where applicable law requires consent for non-essential cookies or advertising technologies, the site's advertising setup must collect and respect that consent before the relevant technologies are used.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-slate-900">Learn more</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Read <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 underline underline-offset-2">How Google uses cookies</a> and our <Link href="/privacy" className="font-medium text-indigo-700 underline underline-offset-2">Privacy Policy</Link> for more detail about data processing.</p>
        </section>
      </article>
      <p className="text-sm text-slate-600">For additional information about using Careerotic, see our <Link href="/terms" className="font-medium text-indigo-700 underline underline-offset-2">Terms of Use</Link> or <Link href="/contact" className="font-medium text-indigo-700 underline underline-offset-2">Contact & Support</Link>.</p>
    </main>
  );
}
