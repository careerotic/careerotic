"use client";
import { useEffect } from "react";
import LeftNavigation from "./LeftNavigation";
type Props = { open: boolean; onClose: () => void };
export default function MobileNavigationDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close navigation menu" onClick={onClose} className="absolute inset-0 bg-slate-950/35" />
      <section role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title" className="relative h-full w-[min(19rem,88vw)] overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <span id="mobile-navigation-title" className="font-semibold text-slate-900">Navigation</span>
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">Close</button>
        </div>
        <LeftNavigation id="mobile-primary-navigation" onNavigate={onClose} />
      </section>
    </div>
  );
}
