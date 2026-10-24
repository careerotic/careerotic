"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
const groups = [
 { label:"Overview", items:[["/admin","Dashboard","▦"],["/admin/analytics","Analytics","◔"]] },
 { label:"Question bank", items:[["/admin/questions","Questions","Q"],["/admin/subjects","Subjects","S"],["/admin/topics","Topics","T"],["/admin/reports","Question reports","⚑"],["/admin/bookmarks","Bookmarks","☆"]] },
 { label:"Exams & results", items:[["/admin/categories","Exam categories","C"],["/admin/exams","Exams","▤"],["/admin/attempts","Attempts","↗"],["/admin/results","Results","▥"],["/admin/resets","Reset history","↺"]] },
 { label:"Account", items:[["/admin/account","My account","◎"]] },
] as const;
export default function AdminNavigation({ onNavigate }: { mobile?: boolean; onNavigate?:()=>void }) {
 const path=usePathname(); const router=useRouter();
 async function signOut(){ await createClient().auth.signOut(); router.replace("/"); router.refresh(); }
 return <nav aria-label="Admin navigation" className="space-y-5">{groups.map(group=><section key={group.label}><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{group.label}</p><div className="space-y-1">{group.items.map(([href,label,icon])=>{const active=href==="/admin"?path===href:path===href||path.startsWith(href+"/");return <Link key={href} href={href} onClick={onNavigate} aria-current={active?"page":undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active?"bg-indigo-50 text-indigo-700":"text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><span className="grid h-6 w-6 place-items-center rounded-md border border-current/10 text-xs">{icon}</span>{label}</Link>})}</div></section>)}<div className="border-t border-slate-200 pt-3"><button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100">↪ Sign out</button></div></nav>;
}
