import Link from "next/link";

type QuestionBankPaginationProps = {
  baseHref: string;
  page: number;
  totalPages: number;
  pageSize: number;
  ariaLabel?: string;
};

function pageHref(baseHref: string, page: number) {
  if (page <= 1) return baseHref;
  return `${baseHref}${baseHref.includes("?") ? "&" : "?"}page=${page}`;
}

export default function QuestionBankPagination({
  baseHref,
  page,
  totalPages,
  pageSize,
  ariaLabel = "Question pagination",
}: QuestionBankPaginationProps) {
  const visiblePages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => Math.max(1, Math.min(page - 2, totalPages - 4)) + index,
  );

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
      <p className="text-sm text-slate-500">Page {page} of {totalPages} · {pageSize} per page</p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={pageHref(baseHref, page - 1)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Previous</Link>
        ) : (
          <span aria-disabled="true" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm opacity-40">Previous</span>
        )}
        {visiblePages.map((number) => (
          <Link key={number} href={pageHref(baseHref, number)} aria-current={number === page ? "page" : undefined} className={`rounded-md border px-3 py-2 text-sm font-medium ${number === page ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{number}</Link>
        ))}
        {page < totalPages ? (
          <Link href={pageHref(baseHref, page + 1)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Next</Link>
        ) : (
          <span aria-disabled="true" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm opacity-40">Next</span>
        )}
      </div>
    </nav>
  );
}
