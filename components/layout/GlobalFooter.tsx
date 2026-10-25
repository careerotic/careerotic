import Image from "next/image";
import Link from "next/link";

const footerGroups = [
  {
    title: "Practice",
    links: [
      { href: "/questions", label: "Question bank" },
      { href: "/exams", label: "Published exams" },
      { href: "/exam-categories", label: "Exam categories" },
      { href: "/subjects", label: "Browse subjects" },
    ],
  },
  {
    title: "Learning",
    links: [
      { href: "/study-guides", label: "Study guides" },
      { href: "/current-affairs", label: "Current affairs" },
      { href: "/study-plan", label: "Study plan" },
      { href: "/search", label: "Search Careerotic" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help & FAQ" },
      { href: "/about", label: "About Careerotic" },
      { href: "/contact", label: "Contact & support" },
      { href: "/disclaimer", label: "Educational disclaimer" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
    ],
  },
];

export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="h-1 w-full bg-gradient-to-r from-slate-900 via-blue-600 to-sky-400" aria-hidden="true" />
      <div className="app-page-gutter mx-auto w-full max-w-[1760px] py-5 sm:py-7">
        <div className="grid grid-cols-3 gap-x-4 gap-y-5 sm:gap-y-6 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
          <div className="col-span-3 min-w-0 lg:col-span-1">
            <Link
              href="/"
              aria-label="Careerotic home"
              className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Image src="/brand/careerotic-mark.svg" alt="" width={36} height={36} className="h-9 w-9" />
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Career<span className="text-blue-600">otic</span>
              </span>
            </Link>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
              Build confidence for competitive exams with subject-wise practice, clear explanations, and published exam preparation.
            </p>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-900">{group.title}</h2>
              <ul className="mt-2 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex max-w-full rounded text-sm leading-5 text-slate-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center sm:text-left">© 2026 Careerotic. All rights reserved.</p>
          <p className="text-center sm:text-right">Designed and developed by <Link href="https://www.facebook.com/FarukislamYT" target="_blank" rel="noopener noreferrer" className="rounded underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Faruk Islam</Link></p>
        </div>
      </div>
    </footer>
  );
}
