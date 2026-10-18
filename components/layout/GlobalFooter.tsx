import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/questions", label: "Question bank" },
  { href: "/exams", label: "Exams" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
];

export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight text-slate-900 hover:text-indigo-700">
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-700 text-xs font-black text-white">C</span>
            Careerotic
          </Link>
          <p className="mt-1 text-xs text-slate-500">Practice with purpose, one question at a time.</p>
          <p className="mt-2 text-xs text-slate-400">© {new Date().getFullYear()} Careerotic</p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-600 transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
