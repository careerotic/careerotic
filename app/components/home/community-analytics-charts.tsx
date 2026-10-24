"use client";

import { useMemo, useState } from "react";

type Point = {
  key: string;
  label: string;
  attempts: number;
  answered: number;
  correct: number;
};

function LineChart({
  points,
  mode,
}: {
  points: Point[];
  mode: "attempts" | "accuracy";
}) {
  const width = 680;
  const height = 190;
  const left = 34;
  const right = 650;
  const top = 16;
  const bottom = 148;
  const values = points.map((point) =>
    mode === "attempts" ? point.attempts : point.answered ? Math.round((point.correct / point.answered) * 100) : null,
  );
  const maxValue = mode === "attempts" ? Math.max(4, ...values.filter((value): value is number => value !== null)) : 100;
  const x = (index: number) => left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * (right - left));
  const y = (value: number) => bottom - (Math.max(0, Math.min(maxValue, value)) / maxValue) * (bottom - top);
  const path = values.reduce((result, value, index) => {
    if (value === null) return result;
    return result + `${result ? " L" : "M"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
  }, "");
  const color = mode === "attempts" ? "#4f46e5" : "#059669";
  const ticks = mode === "attempts" ? [0, Math.round(maxValue / 2), maxValue] : [0, 50, 100];
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const activeDays = values.filter((value) => value !== null && value > 0).length;
  const average = mode === "attempts"
    ? (activeDays ? total / points.length : 0)
    : (values.filter((value) => value !== null).length
      ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0) / values.filter((value) => value !== null).length
      : null);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {mode === "attempts" ? "দৈনিক জমা পরীক্ষা" : "দৈনিক সঠিক উত্তরের হার"}
        </p>
        <span className="text-[11px] text-slate-500">
          {mode === "attempts"
            ? `মোট ${total.toLocaleString("bn-BD")} · সক্রিয় দিন ${activeDays}`
            : average === null ? "পর্যাপ্ত উত্তর নেই" : `গড় ${Math.round(average)}%`}
        </span>
      </div>
      <svg role="img" aria-label={mode === "attempts" ? "Daily submitted exam attempts" : "Daily answer accuracy"} viewBox={`0 0 ${width} ${height}`} className="mt-2 block w-full overflow-visible">
        {ticks.map((tick, index) => (
          <g key={`${tick}-${index}`}>
            <line x1={left} y1={y(tick)} x2={right} y2={y(tick)} stroke="#e2e8f0" strokeDasharray="3 4" />
            <text x={left - 8} y={y(tick) + 4} textAnchor="end" fill="#64748b" fontSize="10">{tick}{mode === "accuracy" ? "%" : ""}</text>
          </g>
        ))}
        {path && <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {values.map((value, index) => value === null ? null : (
          <circle key={points[index].key} cx={x(index)} cy={y(value)} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5">
            <title>{points[index].label}: {value}{mode === "accuracy" ? "%" : " exams"}</title>
          </circle>
        ))}
        {points.map((point, index) => index % Math.max(1, Math.ceil(points.length / 7)) === 0 || index === points.length - 1 ? (
          <text key={point.key} x={x(index)} y="172" textAnchor="middle" fill="#64748b" fontSize="10">{point.label}</text>
        ) : null)}
      </svg>
      {mode === "accuracy" && <p className="mt-1 text-[10px] leading-4 text-slate-500">যে দিনে কোনো উত্তর জমা হয়নি, সে দিনের হার দেখানো হয় না।</p>}
    </div>
  );
}

export default function CommunityAnalyticsCharts({ points }: { points: Point[] }) {
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const visiblePoints = useMemo(() => points.slice(-range), [points, range]);
  const options: { label: string; value: 7 | 14 | 30 }[] = [
    { label: "৭ দিন", value: 7 },
    { label: "১৪ দিন", value: 14 },
    { label: "৩০ দিন", value: 30 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">সময়সীমা নির্বাচন করুন</p>
        <div role="group" aria-label="Chart date range" className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
              className={`min-h-8 rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${range === option.value ? "bg-white text-indigo-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-md border border-slate-200 p-3">
          <LineChart points={visiblePoints} mode="attempts" />
        </div>
        <div className="min-w-0 rounded-md border border-slate-200 p-3">
          <LineChart points={visiblePoints} mode="accuracy" />
        </div>
      </div>
    </div>
  );
}
