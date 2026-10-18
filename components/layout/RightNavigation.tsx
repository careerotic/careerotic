import Link from "next/link";

const quickLinks = [
  { href: "/questions", eyebrow: "PRACTICE", title: "Browse questions", detail: "Filter by subject and topic", icon: "?" },
  { href: "/exams", eyebrow: "ASSESS", title: "Available exams", detail: "See exams published by admins", icon: "▤" },
  { href: "/dashboard", eyebrow: "YOUR SPACE", title: "Dashboard", detail: "Open your account workspace", icon: "▦" },
  { href: "/account", eyebrow: "PROFILE", title: "Account settings", detail: "Review your account details", icon: "○" },
];

export default function RightNavigation() {
  return (
    <aside aria-label="Learning shortcuts" className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">Shortcuts</p>
          <h2 className="mt-1 text-base font-bold text-slate-900">Keep learning</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Jump directly to a real part of Careerotic.</p>
        </div>
        <nav aria-label="Quick links" className="p-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="group flex gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-700">{link.icon}</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold tracking-[0.12em] text-slate-400">{link.eyebrow}</span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{link.title}</span>
                <span className="mt-0.5 block text-xs leading-4 text-slate-500">{link.detail}</span>
              </span>
            </Link>
          ))}
        </nav>
      </section>
      <section className="rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">A simple routine</p>
        <p className="mt-2 text-sm font-semibold leading-6">Practice a question. Reveal the answer. Read the explanation.</p>
        <p className="mt-2 text-xs leading-5 text-slate-300">Answers and explanations are shown when you choose to reveal them.</p>
        <Link href="/questions" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-indigo-300 underline-offset-4 hover:text-indigo-200">Start practicing <span aria-hidden="true">→</span></Link>
      </section>
    </aside>
  );
}
