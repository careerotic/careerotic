import Link from "next/link";

export default function Home() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center sm:px-8 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Prepare with confidence</p>
      <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Your exam preparation starts here.</h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Careerotic is your starting point for focused exam preparation. Create an account to get started, or sign in to continue to your dashboard.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/signup" className="rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Create your account</Link>
        <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Sign in</Link>
      </div>
    </section>
  );
}
