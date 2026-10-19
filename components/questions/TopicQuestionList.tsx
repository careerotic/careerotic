"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Option = { id: string; option_text: string; option_order: number };
type Question = { id: string; prompt: string; language: string; question_options: Option[] };
type Answer = {
  explanation?: string | null;
  correct_option?: { id?: string; option_id?: string; option_text?: string; text?: string } | null;
};

function parseAnswer(value: unknown): Answer | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const nested = raw.data && typeof raw.data === "object" ? raw.data as Record<string, unknown> : raw;
  return {
    explanation: typeof nested.explanation === "string" ? nested.explanation : null,
    correct_option: nested.correct_option && typeof nested.correct_option === "object"
      ? nested.correct_option as Answer["correct_option"]
      : null,
  };
}

export default function TopicQuestionList({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [loadingId, setLoadingId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function reveal(question: Question) {
    if (opened[question.id]) {
      setOpened((current) => ({ ...current, [question.id]: false }));
      return;
    }
    if (answers[question.id]) {
      setOpened((current) => ({ ...current, [question.id]: true }));
      return;
    }

    setLoadingId(question.id);
    setErrors((current) => ({ ...current, [question.id]: "" }));
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_published_question_answer", { p_question_id: question.id });
      if (error) throw error;
      const answer = parseAnswer(data);
      if (!answer?.correct_option) throw new Error("The answer is not available for this question.");
      setAnswers((current) => ({ ...current, [question.id]: answer }));
      setOpened((current) => ({ ...current, [question.id]: true }));
    } catch (caught) {
      setErrors((current) => ({
        ...current,
        [question.id]: caught instanceof Error ? caught.message : "Could not load the answer. Please try again.",
      }));
    } finally {
      setLoadingId("");
    }
  }

  return (
    <div className="space-y-3">
      {questions.map((question, index) => {
        const answer = answers[question.id];
        const isOpen = Boolean(opened[question.id]);
        const correct = answer?.correct_option;
        const correctId = correct?.id ?? correct?.option_id;
        const correctText = correct?.option_text ?? correct?.text
          ?? question.question_options.find((option) => option.id === correctId)?.option_text;

        return (
          <article key={question.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">Question {index + 1}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{question.language === "bn" ? "বাংলা" : "English"}</span>
            </div>
            <h2 className="whitespace-pre-wrap text-[15px] font-medium leading-6 text-slate-900">{question.prompt}</h2>
            <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {question.question_options.map((option, optionIndex) => {
                const isCorrect = isOpen && Boolean(correctText) && option.option_text === correctText;
                return (
                  <li key={option.id} className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700"}`}>
                    <span className="shrink-0 font-semibold text-slate-400">{String.fromCharCode(65 + optionIndex)}.</span>
                    <span className="min-w-0 whitespace-pre-wrap">{option.option_text}</span>
                    {isCorrect && <span className="ml-auto shrink-0 text-xs font-semibold text-emerald-700">Correct</span>}
                  </li>
                );
              })}
            </ol>

            {isOpen && answer && (
              <section className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3" aria-live="polite">
                <p className="text-sm font-semibold text-emerald-900">Answer: {correctText ?? "Correct option"}</p>
                {answer.explanation && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700"><span className="font-semibold">Explanation: </span>{answer.explanation}</p>}
              </section>
            )}
            {errors[question.id] && <p role="alert" className="mt-2 text-xs text-rose-700">{errors[question.id]}</p>}
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => void reveal(question)} disabled={loadingId === question.id} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-wait disabled:opacity-60">
                {loadingId === question.id ? "Loading answer…" : isOpen ? "Hide answer" : "Show answer"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
