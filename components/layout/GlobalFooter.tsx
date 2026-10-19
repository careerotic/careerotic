import Link from "next/link";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/questions", label: "Question bank" },
      { href: "/exams", label: "Published exams" },
      { href: "/exam-categories", label: "Exam categories" },
      { href: "/subjects", label: "Subjects & topics" },
      { href: "/study-guides", label: "Study guides" },
      { href: "/current-affairs", label: "Current affairs" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Help & information",
    links: [
      { href: "/about", label: "About Careerotic" },
      { href: "/help", label: "Help & FAQ" },
      { href: "/contact", label: "Contact & support" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-x-5 gap-y-6 px-3 py-5 sm:grid-cols-4 sm:gap-x-6 sm:px-4 xl:px-5">
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <Link
            href="/"
            aria-label="Careerotic home"
            className="inline-flex items-center gap-2 rounded-md font-bold tracking-tight text-slate-900 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-700 text-xs font-black text-white">C</span>
            Careerotic
          </Link>
          <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
            Practise questions, review explanations, and prepare with published exams.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title} className="min-w-0">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.title}
            </h2>
            <ul className="space-y-1.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-sm text-sm leading-5 text-slate-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-3 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-4 xl:px-5">
          <p>© {new Date().getFullYear()} Careerotic. All rights reserved.</p>
          <p>Built for focused exam preparation.</p>
        </div>
      </div>
    </footer>
  );
}
