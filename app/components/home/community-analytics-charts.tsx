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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const width = 680;
  const height = 190;
  const left = 42;
  const right = 650;
  const top = 16;
  const bottom = 148;
  const values = points.map((point) =>
    mode === "attempts"
      ? point.attempts
      : point.answered
        ? Math.round((point.correct / point.answered) * 100)
        : null,
  );
  const maxValue =
    mode === "attempts"
      ? Math.max(4, ...values.filter((value): value is number => value !== null))
      : 100;
  const x = (index: number) =>
    left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * (right - left));
  const y = (value: number) =>
    bottom - (Math.max(0, Math.min(maxValue, value)) / maxValue) * (bottom - top);
  const paths: string[] = [];
  let activePath = "";
  values.forEach((value, index) => {
    if (value === null) {
      if (activePath) paths.push(activePath);
      activePath = "";
      return;
    }
    activePath += `${activePath ? " L" : "M"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
  });
  if (activePath) paths.push(activePath);
  const color = mode === "attempts" ? "#4f46e5" : "#059669";
  const ticks = mode === "attempts" ? [0, Math.round(maxValue / 2), maxValue] : [0, 50, 100];
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const activeDays = values.filter((value) => value !== null && value > 0).length;
  const validValues = values.filter((value): value is number => value !== null);
  const average =
    mode === "attempts"
      ? total / Math.max(1, points.length)
      : validValues.length
        ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
        : null;
  const selectedIndex = points.findIndex((point) => point.key === selectedKey);
  const selected = selectedIndex >= 0 ? points[selectedIndex] : null;
  const selectedValue = selectedIndex >= 0 ? values[selectedIndex] : null;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {mode === "attempts" ? "দৈনিক জমা পরীক্ষা" : "দৈনিক সঠিক উত্তরের হার"}
        </p>
        <span className="text-[11px] text-slate-500">
          {mode === "attempts"
            ? `মোট ${total.toLocaleString("bn-BD")} · সক্রিয় দিন ${activeDays}`
            : average === null
              ? "পর্যাপ্ত উত্তর নেই"
              : `গড় ${Math.round(average)}%`}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">দিনের বিন্দুতে চাপ দিন বা কিবোর্ড দিয়ে নির্বাচন করুন—বিস্তারিত দেখাবে।</p>
      <svg
        role="group"
        aria-label={mode === "attempts" ? "Daily submitted exam attempts; select a day for details" : "Daily answer accuracy; select a day for details"}
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 block w-full overflow-visible"
      >
        {ticks.map((tick, index) => (
          <g key={`${tick}-${index}`}>
            <line x1={left} y1={y(tick)} x2={right} y2={y(tick)} stroke="#e2e8f0" strokeDasharray="3 4" />
            <text x={left - 8} y={y(tick) + 4} textAnchor="end" fill="#64748b" fontSize="10">
              {tick}{mode === "accuracy" ? "%" : ""}
            </text>
          </g>
        ))}
        {paths.map((path, index) => (
          <path key={index} d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {values.map((value, index) => {
          if (value === null) {
            return (
              <g key={points[index].key}>
                <circle cx={x(index)} cy={bottom} r="2" fill="#cbd5e1" />
                <title>{points[index].label}: কোনো উত্তর জমা হয়নি</title>
              </g>
            );
          }
          const selectedPoint = points[index].key === selectedKey;
          return (
            <circle
              key={points[index].key}
              cx={x(index)}
              cy={y(value)}
              r={selectedPoint ? 6 : 4}
              fill={selectedPoint ? "#fff" : color}
              stroke={color}
              strokeWidth={selectedPoint ? 3 : 1.5}
              role="button"
              tabIndex={0}
              aria-label={`${points[index].label}: ${value}${mode === "accuracy" ? " percent accuracy" : " exams"}`}
              aria-pressed={selectedPoint}
              className="cursor-pointer outline-none focus-visible:stroke-slate-950"
              onClick={() => setSelectedKey(points[index].key)}
              onFocus={() => setSelectedKey(points[index].key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedKey(points[index].key);
                }
              }}
            >
              <title>{points[index].label}: {value}{mode === "accuracy" ? "%" : " exams"}</title>
            </circle>
          );
        })}
        {points.map((point, index) =>
          index % Math.max(1, Math.ceil(points.length / 7)) === 0 || index === points.length - 1 ? (
            <text key={point.key} x={x(index)} y="172" textAnchor="middle" fill="#64748b" fontSize="10">
              {point.label}
            </text>
          ) : null,
        )}
      </svg>
      {selected && (
        <div aria-live="polite" className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-900">{selected.label}</p>
            <button type="button" onClick={() => setSelectedKey(null)} className="min-h-7 rounded px-2 text-[11px] font-medium text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              নির্বাচন সরান
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <p className="text-[10px] text-slate-500">জমা পরীক্ষা</p>
              <p className="text-sm font-bold tabular-nums text-slate-900">{selected.attempts.toLocaleString("bn-BD")}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">উত্তর দেওয়া</p>
              <p className="text-sm font-bold tabular-nums text-slate-900">{selected.answered.toLocaleString("bn-BD")}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">সঠিক</p>
              <p className="text-sm font-bold tabular-nums text-emerald-700">{selected.correct.toLocaleString("bn-BD")}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">{mode === "accuracy" ? "সঠিকতার হার" : "ভুল উত্তর"}</p>
              <p className="text-sm font-bold tabular-nums text-slate-900">
                {mode === "accuracy"
                  ? selectedValue === null ? "—" : `${selectedValue}%`
                  : (selected.answered - selected.correct).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>
        </div>
      )}
      {mode === "accuracy" && (
        <p className="mt-1 text-[10px] leading-4 text-slate-500">যে দিনে কোনো উত্তর জমা হয়নি, সে দিনের হার দেখানো হয় না।</p>
      )}
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
