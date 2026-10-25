import Link from "next/link";

const actions = [
  { href: "/", label: "Go to homepage", primary: true },
  { href: "/questions", label: "Browse questions", primary: false },
  { href: "/exams", label: "Explore exams", primary: false },
  { href: "/help", label: "Visit Help & FAQ", primary: false },
];

export default function NotFound() {
  return (
    <section className="flex min-h-[55vh] items-center justify-center py-8 sm:py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm sm:px-10 sm:py-14">
        <div aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-3xl font-black tracking-tight text-indigo-700 sm:h-24 sm:w-24 sm:text-4xl">404</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Page not found</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Looks like this page took a wrong turn.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
          The page may have moved, been removed, or the address may be incorrect. Try one of the links below to continue preparing with Careerotic.
        </p>
        <nav aria-label="Helpful pages" className="mt-7 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className={action.primary
              ? "inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              : "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            }>{action.label}</Link>
          ))}
        </nav>
        <p className="mt-7 text-xs text-slate-500">If you typed the address yourself, check it for spelling mistakes.</p>
      </div>
    </section>
  );
}
