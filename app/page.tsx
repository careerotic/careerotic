import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-700">Careerotic</Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign in</Link>
            <Link href="/signup" className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">Create account</Link>
          </nav>
        </header>
        <section className="py-20 text-center sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Prepare with confidence</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Your exam preparation starts here.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">Careerotic is your starting point for focused exam preparation. Create an account to get started, or sign in to continue to your dashboard.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800">Create your account</Link>
            <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50">Sign in</Link>
          </div>
        </section>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} Careerotic</footer>
      </div>
    </main>
  );
}
