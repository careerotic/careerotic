import Link from "next/link";

export default function RightNavigation() {
  return (
    <aside aria-label="Helpful links" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Quick links</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">Pick up where you left off.</p>
      <nav aria-label="Quick links" className="mt-3 space-y-1">
        <Link href="/questions" className="block rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700">Browse questions</Link>
        <Link href="/dashboard" className="block rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700">Your dashboard</Link>
        <Link href="/account" className="block rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700">Account settings</Link>
      </nav>
    </aside>
  );
}
