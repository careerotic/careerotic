"use client";

import { useMemo, useState } from "react";

type SubjectMetric = { id: string; name: string; slug: string; topicCount: number; questionCount: number; published: number; draft: number; answered: number; correct: number; accuracy: number | null };
type TopicMetric = { id: string; name: string; slug: string; subjectId: string; subjectName: string; questionCount: number; published: number; draft: number; answered: number; correct: number; accuracy: number | null };
type QuestionMetric = { id: string; prompt: string; status: string; language: string; topicId: string; topicName: string; subjectId: string; subjectName: string; optionCount: number; correctOptionCount: number; hasExplanation: boolean; answered: number; correct: number; incorrect: number; accuracy: number | null; incorrectRate: number | null; issues: string[] };
type DailyMetric = { date: string; attempts: number; answered: number; correct: number; accuracy: number | null };
type Data = { summary: { subjects: number; topics: number; questions: number; publishedQuestions: number; draftQuestions: number; exams: number; publishedExams: number; examQuestionLinks: number; reports: number; pendingReports: number; submittedAttempts: number; answered: number; correct: number; accuracy: number | null; qualityIssues: number }; subjects: SubjectMetric[]; topics: TopicMetric[]; questions: QuestionMetric[]; daily: DailyMetric[] };
const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
const fmt = (value: number) => value.toLocaleString("en-US");
function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) { return <div className={card}><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{typeof value === "number" ? fmt(value) : value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>; }
function Bar({ value, max, color = "bg-indigo-600" }: { value: number; max: number; color?: string }) { return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${max ? Math.min(100, value / max * 100) : 0}%` }} /></div>; }

export default function AdminAnalyticsDashboard({ data }: { data: Data }) {
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"coverage" | "quality" | "performance" | "trends">("coverage");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const topics = useMemo(() => data.topics.filter((topic) => (subjectId === "all" || topic.subjectId === subjectId) && (selectedSubject === null || topic.subjectId === selectedSubject)), [data.topics, subjectId, selectedSubject]);
  const filteredQuestions = useMemo(() => data.questions.filter((question) =>
    (subjectId === "all" || question.subjectId === subjectId) &&
    (selectedSubject === null || question.subjectId === selectedSubject) &&
    (selectedTopic === "all" || question.topicId === selectedTopic) &&
    (status === "all" || question.status === status) &&
    (!search.trim() || question.prompt.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) || question.topicName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) || question.subjectName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  ), [data.questions, subjectId, selectedSubject, selectedTopic, status, search]);
  const qualityCount = filteredQuestions.filter((question) => question.issues.length > 0).length;
  const weakQuestions = filteredQuestions.filter((question) => question.answered >= 3 && question.incorrectRate !== null && question.incorrectRate >= 60).sort((a, b) => (b.incorrectRate ?? 0) - (a.incorrectRate ?? 0));
  const displayedQuestions = view === "quality" ? filteredQuestions.filter((question) => question.issues.length > 0) : view === "performance" ? weakQuestions : filteredQuestions;
  const fmtDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
  const clearFilters = () => { setSearch(""); setSubjectId("all"); setStatus("all"); setSelectedTopic("all"); setSelectedSubject(null); };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Admin workspace · Read-only analytics</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Content & learning analytics</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Explore subject and topic coverage, question quality signals, and aggregate learner performance. Metrics use existing database records only; learner-level results are never sent to this dashboard.</p></div>
      <button onClick={clearFilters} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reset filters</button>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Metric label="Subjects" value={data.summary.subjects} detail={`${data.summary.topics} topics`} />
      <Metric label="Questions" value={data.summary.questions} detail={`${fmt(data.summary.publishedQuestions)} published · ${fmt(data.summary.draftQuestions)} draft`} />
      <Metric label="Exams" value={data.summary.exams} detail={`${data.summary.publishedExams} published`} />
      <Metric label="Content quality flags" value={data.summary.qualityIssues} detail="Questions needing content review" />
      <Metric label="Submitted attempts" value={data.summary.submittedAttempts} detail="Latest 500 submitted result records" />
      <Metric label="Answered questions" value={data.summary.answered} detail="Aggregate selected answers in that sample" />
      <Metric label="Community accuracy" value={data.summary.accuracy === null ? "—" : `${data.summary.accuracy}%`} detail={`${fmt(data.summary.correct)} correct answers`} />
      <Metric label="Pending reports" value={data.summary.pendingReports} detail={`${data.summary.reports} total reports`} />
    </div>
    <section className={card + " space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Explore analytics</h2><p className="mt-1 text-xs text-slate-500">Filters apply to the tables and topic coverage view.</p></div><div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Analytics view">
        {([{id:"coverage",label:"Coverage"},{id:"quality",label:"Quality gaps"},{id:"performance",label:"Learner performance"},{id:"trends",label:"Trends"}] as const).map(option => <button key={option.id} onClick={() => setView(option.id)} aria-pressed={view===option.id} className={`rounded-md px-3 py-2 text-xs font-semibold ${view===option.id?"bg-white text-indigo-700 shadow-sm":"text-slate-600 hover:text-slate-900"}`}>{option.label}</button>)}
      </div></div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">Subject<select value={subjectId} onChange={e=>{setSubjectId(e.target.value);setSelectedSubject(null);setSelectedTopic("all");}} className="mt-1.5 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"><option value="all">All subjects</option>{data.subjects.map(subject=><option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Topic<select value={selectedTopic} onChange={e=>setSelectedTopic(e.target.value)} className="mt-1.5 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"><option value="all">All topics</option>{topics.map(topic=><option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Question status<select value={status} onChange={e=>setStatus(e.target.value)} className="mt-1.5 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></label>
      </div>
      <label className="block text-xs font-semibold text-slate-600">Search questions or taxonomy<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search question text, topic, or subject…" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
      {selectedSubject && <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">Subject chart selected. <button className="font-bold underline" onClick={()=>setSelectedSubject(null)}>Clear subject selection</button></p>}
    </section>
    {view==="coverage" && <section className={card}><div className="mb-4"><h2 className="font-bold text-slate-900">Published question coverage by topic</h2><p className="mt-1 text-xs text-slate-500">Select a subject bar to filter the topic and question views. A low count indicates a coverage gap, not necessarily a content error.</p></div>
      <div className="space-y-4">{data.subjects.filter(subject=>subjectId==="all"||subject.id===subjectId).map(subject=><button key={subject.id} onClick={()=>{setSelectedSubject(subject.id===selectedSubject?null:subject.id);setSelectedTopic("all");}} className={`block w-full rounded-lg p-3 text-left ${selectedSubject===subject.id?"bg-indigo-50 ring-1 ring-indigo-200":"hover:bg-slate-50"}`} aria-pressed={selectedSubject===subject.id}><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-900">{subject.name}</span><span className="text-xs tabular-nums text-slate-600">{subject.published} published / {subject.questionCount} total · {subject.topicCount} topics</span></div><Bar value={subject.published} max={Math.max(1,...data.subjects.map(s=>s.published))}/></button>)}</div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Published</th><th className="px-3 py-3">Draft</th><th className="px-3 py-3">Answers</th><th className="px-3 py-3">Accuracy</th></tr></thead><tbody className="divide-y divide-slate-100">{topics.slice().sort((a,b)=>a.published-b.published||a.name.localeCompare(b.name)).map(topic=><tr key={topic.id}><td className="px-3 py-3 font-medium text-slate-900">{topic.name}</td><td className="px-3 py-3 text-slate-600">{topic.subjectName}</td><td className="px-3 py-3 tabular-nums">{topic.published}</td><td className="px-3 py-3 tabular-nums">{topic.draft}</td><td className="px-3 py-3 tabular-nums">{topic.answered}</td><td className="px-3 py-3 tabular-nums">{topic.accuracy===null?"—":`${topic.accuracy}%`}</td></tr>)}</tbody></table></div>
    </section>}
    {view==="trends" && <section className={card}><h2 className="font-bold text-slate-900">Recent community activity</h2><p className="mt-1 text-xs text-slate-500">Daily totals from the latest 500 submitted attempts; dates without records are omitted.</p><div className="mt-4 space-y-3">{data.daily.map(day=><div key={day.date} className="grid grid-cols-[70px_1fr_100px] items-center gap-3"><span className="text-xs text-slate-500">{fmtDate(day.date)}</span><div><Bar value={day.attempts} max={Math.max(1,...data.daily.map(d=>d.attempts))} color="bg-emerald-600"/></div><span className="text-right text-xs tabular-nums text-slate-700">{day.attempts} attempts · {day.accuracy===null?"—":`${day.accuracy}%`}</span></div>)}</div></section>}
    {(view==="quality"||view==="performance") && <section className={card}><div className="mb-4"><h2 className="font-bold text-slate-900">{view==="quality"?"Question quality review":"Questions with high incorrect-answer rates"}</h2><p className="mt-1 text-xs text-slate-500">{view==="quality"?"Structural checks use the current four-option question model.":"Questions need at least three recorded answers and a 60% or higher incorrect-answer rate. Treat this as a review signal, not proof the question is wrong."}</p><p className="mt-2 text-xs text-slate-500">Showing {displayedQuestions.length} questions · {qualityCount} have structural flags</p></div>
      {displayedQuestions.length===0?<p className="rounded-lg bg-slate-50 p-6 text-sm text-slate-600">No questions match these filters.</p>:<div className="space-y-3">{displayedQuestions.slice(0,100).map(question=><article key={question.id} className="rounded-lg border border-slate-200 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-6 text-slate-900">{question.prompt}</p><p className="mt-1 text-xs text-slate-500">{question.subjectName} / {question.topicName} · {question.status} · {question.language.toUpperCase()}</p></div>{question.accuracy!==null&&<span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{question.accuracy}% accuracy</span>}</div>
        <div className="mt-3 flex flex-wrap gap-2">{question.issues.map(issue=><span key={issue} className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{issue}</span>)}{view==="performance"&&<span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800">{question.incorrectRate}% incorrect · {question.answered} answers</span>}</div></article>)}</div>}
    </section>}
    <p className="text-xs leading-5 text-slate-500">Read-only analytics. No database changes are made. Question performance is based on the latest 500 submitted attempts available in the current schema; taxonomy coverage and structural checks use the current question bank. User IDs, guest identity hashes, attempt tokens, and individual result snapshots are not exposed to this page.</p>
  </div>;
}
