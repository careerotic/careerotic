import Link from "next/link";

const footerGroups = [
  { title: "Explore", links: [{ href: "/", label: "Home" }, { href: "/questions", label: "Question bank" }, { href: "/exams", label: "Published exams" }, { href: "/exam-categories", label: "Exam categories" }, { href: "/subjects", label: "Subjects" }, { href: "/study-guides", label: "Study guides" }, { href: "/current-affairs", label: "Current affairs" }, { href: "/help", label: "Help & FAQ" }, { href: "/search", label: "Search" }] },
  { title: "Policies", links: [{ href: "/privacy", label: "Privacy policy" }, { href: "/terms", label: "Terms of use" }] },
];

export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="app-page-gutter mx-auto grid w-full max-w-[1760px] grid-cols-1 gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded font-bold tracking-tight text-slate-900 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded bg-indigo-700 text-[10px] font-black text-white">C</span>Careerotic
          </Link>
          <p className="mt-1 text-xs leading-4 text-slate-500">Practise questions, review explanations, and prepare for published exams.</p>
          <p className="mt-1.5 text-[11px] text-slate-400">© {new Date().getFullYear()} Careerotic. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{group.title}</h2>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 sm:flex-col sm:gap-1">
                {group.links.map((link) => <li key={link.href}><Link href={link.href} className="text-xs text-slate-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">{link.label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
