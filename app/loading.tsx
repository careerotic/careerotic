import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main
      aria-label="Loading page"
      aria-busy="true"
      role="status"
      className="space-y-4"
    >
      <span className="sr-only">Loading page…</span>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <Skeleton className="h-3 w-28 rounded bg-slate-200" />
        <Skeleton className="mt-3 h-7 w-56 max-w-full rounded bg-slate-200" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full rounded bg-slate-100" />
      </section>
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <Skeleton className="h-4 w-40 rounded bg-slate-200" />
        <Skeleton className="h-16 rounded-lg bg-slate-100" />
        <Skeleton className="h-16 rounded-lg bg-slate-100" />
        <Skeleton className="h-16 rounded-lg bg-slate-100" />
      </section>
    </main>
  );
}
