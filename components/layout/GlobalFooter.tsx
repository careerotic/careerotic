import Link from "next/link";
const footerGroups = [
  { title: "Explore", links: [{ href: "/", label: "Home" }, { href: "/questions", label: "Question bank" }, { href: "/exams", label: "Published exams" }, { href: "/exam-categories", label: "Exam categories" }, { href: "/subjects", label: "Subjects" }, { href: "/study-guides", label: "Study guides" }, { href: "/current-affairs", label: "Current affairs" }, { href: "/help", label: "Help & FAQ" }, { href: "/search", label: "Search" }] },
  { title: "Policies", links: [{ href: "/privacy", label: "Privacy policy" }, { href: "/terms", label: "Terms of use" }] },
];
export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-4 xl:px-5">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md font-bold tracking-tight text-slate-900 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-700 text-xs font-black text-white">C</span>Careerotic
          </Link>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">A focused space to practise questions, review explanations, and prepare for published exams.</p>
          <p className="mt-2 text-xs text-slate-400">© {new Date().getFullYear()} Careerotic. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4 sm:justify-end">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title}</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 sm:flex-col sm:gap-1.5">
                {group.links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-slate-600 transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">{link.label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
