"use client";

import { useState } from "react";
import QuestionBankCard from "@/components/questions/QuestionBankCard";

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
      const response = await fetch(`/api/questions/answers?ids=${encodeURIComponent(question.id)}`);
      if (!response.ok) throw new Error("Could not load the answer. Please try again.");
      const payload = await response.json() as { answers?: Record<string, unknown> };
      const answer = parseAnswer(payload.answers?.[question.id]);
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
      {questions.map((question, index) => (
        <QuestionBankCard
          key={question.id}
          question={question}
          numberLabel={`Question ${index + 1}`}
          answer={answers[question.id]}
          isOpen={Boolean(opened[question.id])}
          answerLoading={loadingId === question.id}
          answerError={errors[question.id]}
          onToggleAnswer={() => void reveal(question)}
        />
      ))}
    </div>
  );
}
