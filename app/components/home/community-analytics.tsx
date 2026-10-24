"use server";

import { createAdminClient } from "@/lib/exams/attempt-server";

type SnapshotQuestion = {
  question_id?: string;
  selected_option?: unknown;
  selected_option_id?: string | null;
  selected_is_correct?: boolean;
};

type AttemptSnapshot = { questions?: SnapshotQuestion[] };
type CommunityAttempt = { submitted_at: string | null; result_snapshot: unknown };
type SubjectRow = {
  id: string;
  topics: { subjects: { name: string; slug: string } | null } | null;
};

type DayPoint = { key: string; label: string; attempts: number; answered: number; correct: number };

function getSnapshotQuestions(value: unknown): SnapshotQuestion[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const questions = (value as AttemptSnapshot).questions;
  return Array.isArray(questions)
    ? questions.filter((question): question is SnapshotQuestion =>
        Boolean(question && typeof question === "object" && !Array.isArray(question)),
      )
    : [];
}

function hasAnswer(question: SnapshotQuestion) {
  return Boolean(question.selected_option || question.selected_option_id);
}

function LineChart({
  points,
  valueKey,
  label,
  color,
  suffix = "",
}: {
  points: { label: string; value: number | null }[];
  valueKey: string;
  label: string;
  color: string;
  suffix?: string;
}) {
  const chartWidth = 680;
  const chartHeight = 190;
  const left = 30;
  const right = 650;
  const top = 16;
  const bottom = 148;
  const values = points.map((point) => point.value).filter((value): value is number => value !== null);
  const maxValue = valueKey === "attempts" ? Math.max(4, ...values) : 100;
  const x = (index: number) => left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * (right - left));
  const y = (value: number) => bottom - (Math.max(0, Math.min(maxValue, value)) / maxValue) * (bottom - top);
  const segments: string[] = [];
  let activeSegment: string[] = [];
  points.forEach((point, index) => {
    if (point.value === null) {
      if (activeSegment.length) segments.push(activeSegment.join(" "));
      activeSegment = [];
      return;
    }
    activeSegment.push(`${activeSegment.length ? "L" : "M"} ${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`);
  });
  if (activeSegment.length) segments.push(activeSegment.join(" "));
  const ticks = valueKey === "attempts"
    ? [0, Math.round(maxValue / 2), maxValue]
    : [0, 50, 100];

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="h-0.5 w-4 rounded" style={{ backgroundColor: color }} />
          {valueKey === "attempts" ? "প্রতি দিন" : "দৈনিক হার"}
        </span>
      </div>
      <svg role="img" aria-label={label} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mt-2 block w-full overflow-visible">
        {ticks.map((tick, index) => (
          <g key={`${tick}-${index}`}>
            <line x1={left} y1={y(tick)} x2={right} y2={y(tick)} stroke="#e2e8f0" strokeDasharray="3 4" />
            <text x={left - 8} y={y(tick) + 4} textAnchor="end" fill="#64748b" fontSize="10">
              {tick}{suffix}
            </text>
          </g>
        ))}
        {segments.map((segment, index) => (
          <path key={index} d={segment} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {points.map((point, index) => point.value === null ? null : (
          <circle key={point.label} cx={x(index)} cy={y(point.value)} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5">
            <title>{point.label}: {point.value}{suffix}</title>
          </circle>
        ))}
        {points.map((point, index) => index % 3 === 0 || index === points.length - 1 ? (
          <text key={point.label} x={x(index)} y="172" textAnchor="middle" fill="#64748b" fontSize="10">{point.label}</text>
        ) : null)}
      </svg>
    </div>
  );
}

export default async function CommunityAnalytics() {
  let rows: CommunityAttempt[] = [];
  let totalAttempts: number | null = null;
  let unavailable = false;

  try {
    const admin = createAdminClient();
    const [attemptResult, countResult] = await Promise.all([
      admin
        .from("exam_attempts")
        .select("result_snapshot,submitted_at")
        .eq("status", "submitted")
        .not("result_snapshot", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(500),
      admin
        .from("exam_attempts")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted")
        .not("result_snapshot", "is", null),
    ]);

    if (attemptResult.error || countResult.error) {
      unavailable = true;
    } else {
      rows = (attemptResult.data ?? []) as CommunityAttempt[];
      totalAttempts = countResult.count ?? 0;
    }
  } catch {
    unavailable = true;
  }

  if (unavailable) {
    return (
      <section aria-labelledby="community-analytics-heading" className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 id="community-analytics-heading" className="text-base font-bold text-slate-950">কমিউনিটি অ্যানালিটিক্স</h2>
        <p role="status" className="mt-1 text-xs leading-5 text-slate-600">এই মুহূর্তে কমিউনিটি পরিসংখ্যান লোড করা যাচ্ছে না। পরে আবার চেষ্টা করুন।</p>
      </section>
    );
  }

  const today = new Date();
  const dayKeys: string[] = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
    dayKeys.push(date.toISOString().slice(0, 10));
  }
  const dayMap = new Map<string, DayPoint>();
  for (const key of dayKeys) {
    const date = new Date(`${key}T12:00:00Z`);
    dayMap.set(key, {
      key,
      label: date.toLocaleDateString("bn-BD", { day: "numeric", month: "short", timeZone: "UTC" }),
      attempts: 0,
      answered: 0,
      correct: 0,
    });
  }

  let answered = 0;
  let correct = 0;
  let incorrect = 0;
  const questionIds = new Set<string>();
  const subjectCounts = new Map<string, { name: string; slug: string; answered: number; correct: number }>();

  for (const row of rows) {
    const dateKey = row.submitted_at ? new Date(row.submitted_at).toISOString().slice(0, 10) : null;
    const day = dateKey ? dayMap.get(dateKey) : undefined;
    if (day) day.attempts += 1;
    for (const question of getSnapshotQuestions(row.result_snapshot)) {
      if (!question.question_id || !hasAnswer(question) || typeof question.selected_is_correct !== "boolean") continue;
      answered += 1;
      if (question.selected_is_correct) correct += 1;
      else incorrect += 1;
      if (day) {
        day.answered += 1;
        if (question.selected_is_correct) day.correct += 1;
      }
      questionIds.add(question.question_id);
    }
  }

  try {
    const ids = [...questionIds].slice(0, 1000);
    if (ids.length) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("questions")
        .select("id,status,topics(name,subjects(name,slug))")
        .eq("status", "published")
        .in("id", ids);
      if (!error) {
        for (const item of (data ?? []) as unknown as (SubjectRow & { status?: string })[]) {
          const subject = item.topics?.subjects;
          if (!subject?.slug || !subject.name) continue;
          const current = subjectCounts.get(subject.slug) ?? {
            name: subject.name,
            slug: subject.slug,
            answered: 0,
            correct: 0,
          };
          subjectCounts.set(subject.slug, current);
        }
        const subjectByQuestion = new Map<string, { name: string; slug: string }>();
        for (const item of (data ?? []) as unknown as SubjectRow[]) {
          const subject = item.topics?.subjects;
          if (subject?.slug && subject.name) subjectByQuestion.set(item.id, subject);
        }
        for (const row of rows) {
          for (const question of getSnapshotQuestions(row.result_snapshot)) {
            if (!question.question_id || !hasAnswer(question) || typeof question.selected_is_correct !== "boolean") continue;
            const subject = subjectByQuestion.get(question.question_id);
            if (!subject) continue;
            const current = subjectCounts.get(subject.slug) ?? {
              name: subject.name,
              slug: subject.slug,
              answered: 0,
              correct: 0,
            };
            current.answered += 1;
            if (question.selected_is_correct) current.correct += 1;
            subjectCounts.set(subject.slug, current);
          }
        }
      }
    }
  } catch {
    // Public totals and timelines remain useful if taxonomy lookup is unavailable.
  }

  const days = [...dayMap.values()];
  const attemptsLine = days.map((day) => ({ label: day.label, value: day.attempts }));
  const accuracyLine = days.map((day) => ({
    label: day.label,
    value: day.answered > 0 ? Math.round((day.correct / day.answered) * 100) : null,
  }));
  const subjectBars = [...subjectCounts.values()]
    .filter((subject) => subject.answered >= 3)
    .map((subject) => ({
      ...subject,
      accuracy: Math.round((subject.correct / subject.answered) * 100),
    }))
    .sort((a, b) => b.answered - a.answered)
    .slice(0, 5);
  const recentAttempts = rows.filter((row) => row.submitted_at && row.submitted_at >= dayKeys[0]).length;

  return (
    <section aria-labelledby="community-analytics-heading" className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-700">Careerotic community</p>
          <h2 id="community-analytics-heading" className="mt-0.5 text-base font-bold tracking-tight text-slate-950">কমিউনিটির শেখার অ্যানালিটিক্স</h2>
          <p className="mt-0.5 text-xs leading-4 text-slate-500">সব দর্শকের জন্য প্রকাশিত সমষ্টিগত পরিসংখ্যান; ব্যক্তিগত ফলাফল এখানে দেখানো হয় না।</p>
        </div>
        <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">সর্বশেষ ৫০০টি জমা পরীক্ষা পর্যন্ত চার্ট</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] leading-4 text-slate-500">মোট জমা পরীক্ষা</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{(totalAttempts ?? 0).toLocaleString("bn-BD")}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] leading-4 text-slate-500">বিশ্লেষিত উত্তর</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{answered.toLocaleString("bn-BD")}</p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50/70 p-3">
          <p className="text-[11px] leading-4 text-emerald-800">সঠিক উত্তর</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{correct.toLocaleString("bn-BD")}</p>
        </div>
        <div className="rounded-md border border-rose-100 bg-rose-50/70 p-3">
          <p className="text-[11px] leading-4 text-rose-800">ভুল উত্তর</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900">{incorrect.toLocaleString("bn-BD")}</p>
        </div>
      </div>

      {answered > 0 && (
        <div className="rounded-md border border-indigo-100 bg-indigo-50/50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-indigo-900">সামগ্রিক সঠিক উত্তরের হার</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-indigo-950">{Math.round((correct / answered) * 100)}%</p>
            </div>
            <div className="h-14 w-14 shrink-0 rounded-full p-1" style={{ background: `conic-gradient(#4f46e5 ${(correct / answered) * 100}%, #e2e8f0 0)` }} aria-label={`${Math.round((correct / answered) * 100)}% correct answers`} role="img">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700">{Math.round((correct / answered) * 100)}%</div>
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-rose-100">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(correct / answered) * 100}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-slate-500">চার্টের নির্ভুলতা সর্বশেষ ৫০০টি জমা পরীক্ষার উপলভ্য উত্তর থেকে গণনা করা হয়েছে।</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-md border border-slate-200 p-3">
          <LineChart points={attemptsLine} valueKey="attempts" label="১৪ দিনের পরীক্ষার প্রবণতা" color="#4f46e5" />
        </div>
        <div className="min-w-0 rounded-md border border-slate-200 p-3">
          <LineChart points={accuracyLine} valueKey="accuracy" label="১৪ দিনের সঠিক উত্তরের হার" color="#059669" suffix="%" />
        </div>
      </div>

      {subjectBars.length > 0 && (
        <div className="rounded-md border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">বিষয়ভিত্তিক পারফরম্যান্স</h3>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">কমপক্ষে ৩টি উত্তর থাকা প্রকাশিত প্রশ্নের বিষয় দেখানো হয়েছে।</p>
          <div className="mt-3 space-y-3">
            {subjectBars.map((subject) => (
              <div key={subject.slug}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-xs font-medium text-slate-700">{subject.name}</span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-slate-900">{subject.accuracy}% · {subject.answered.toLocaleString("bn-BD")} উত্তর</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${subject.accuracy}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] leading-4 text-slate-500">
        {recentAttempts.toLocaleString("bn-BD")}টি জমা পরীক্ষা গত ১৪ দিনের মধ্যে হয়েছে। পুরোনো রেকর্ড মোট পরীক্ষার সংখ্যায় অন্তর্ভুক্ত, তবে চার্টে সর্বশেষ ৫০০টি রেকর্ডের ভিত্তিতে প্রবণতা দেখানো হয়।
      </p>
    </section>
  );
}
