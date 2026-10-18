import Link from "next/link";

export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 Careerotic</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-indigo-700">Home</Link>
          <Link href="/questions" className="hover:text-indigo-700">Questions</Link>
          <Link href="/account" className="hover:text-indigo-700">My account</Link>
        </nav>
      </div>
    </footer>
  );
}
