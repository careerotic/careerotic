export default function Loading() {
  return (
    <main
      aria-label="Loading page"
      aria-busy="true"
      role="status"
      className="min-h-[12rem] px-3 py-5 sm:px-5 sm:py-7"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        Opening page…
      </span>
    </main>
  );
}
