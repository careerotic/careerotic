"use client";

type QuestionOption = { id: string; option_text: string; option_order?: number };
type CorrectOption = { id?: string; option_id?: string; option_text?: string; text?: string } | null;
export type QuestionBankAnswer = { explanation?: string | null; correct_option?: CorrectOption };

type QuestionBankCardProps = {
  question: { id: string; prompt: string; language: string; question_options: QuestionOption[] };
  subject?: string | null;
  topic?: string | null;
  numberLabel?: string;
  answer?: QuestionBankAnswer;
  isOpen: boolean;
  answerLoading?: boolean;
  answerError?: string;
  bookmarked?: boolean;
  onToggleAnswer: () => void;
  onToggleBookmark?: () => void;
  onReport?: () => void;
};

const iconButtonClass = "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

function isCorrectOption(option: QuestionOption, answer?: QuestionBankAnswer) {
  const correct = answer?.correct_option;
  if (!correct) return false;
  const correctId = correct.id ?? correct.option_id;
  const correctText = correct.option_text ?? correct.text;
  return (Boolean(correctId) && option.id === correctId) ||
    (Boolean(correctText) && option.option_text === correctText);
}

export default function QuestionBankCard({
  question, subject, topic, numberLabel, answer, isOpen, answerLoading = false,
  answerError, bookmarked = false, onToggleAnswer, onToggleBookmark, onReport,
}: QuestionBankCardProps) {
  const correct = answer?.correct_option;
  const correctText = correct?.option_text ?? correct?.text ??
    question.question_options.find((option) => isCorrectOption(option, answer))?.option_text;

  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      {(subject || topic || numberLabel || question.language) && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
          {numberLabel && <span className="mr-1 font-semibold text-slate-500">{numberLabel}</span>}
          {subject && <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">{subject}</span>}
          {topic && <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{topic}</span>}
          <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700">{question.language === "bn" ? "বাংলা" : "English"}</span>
        </div>
      )}

      <h2 className="whitespace-pre-wrap break-words text-[15px] font-medium leading-6 text-slate-900">{question.prompt}</h2>

      <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.question_options.map((option, index) => {
          const correctAnswer = isOpen && isCorrectOption(option, answer);
          const optionNumber = option.option_order && option.option_order > 0 ? option.option_order : index + 1;
          return (
            <li key={option.id} className={`flex min-w-0 items-start gap-2 rounded-md border px-3 py-2 text-sm ${correctAnswer ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700"}`}>
              <span className="shrink-0 text-slate-400">{String.fromCharCode(64 + optionNumber)}.</span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{option.option_text}</span>
              {correctAnswer && <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Correct answer"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </li>
          );
        })}
      </ol>

      {isOpen && (
        <section className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-3 text-sm" aria-live="polite">
          <p className="font-semibold text-emerald-900">{correctText ? `Correct answer: ${correctText}` : answerLoading ? "Answer is loading…" : "Answer details"}</p>
          {answer?.explanation && <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700"><span className="font-semibold">Explanation: </span>{answer.explanation}</p>}
          {!answer && <p className="mt-1 text-slate-500">Please wait a moment and try again.</p>}
        </section>
      )}

      {answerError && <p role="alert" className="mt-2 text-xs text-rose-700">{answerError}</p>}

      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
        <button type="button" onClick={onToggleAnswer} disabled={answerLoading} className="min-h-9 rounded-md px-2.5 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-wait disabled:opacity-60">
          {answerLoading ? "Loading answer…" : isOpen ? "Hide answer" : "Show answer"}
        </button>
        <span className="flex-1" />
        {onToggleBookmark && (
          <button type="button" onClick={onToggleBookmark} className={iconButtonClass} aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"} title={bookmarked ? "Remove bookmark" : "Save bookmark"}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21z" strokeLinejoin="round" /></svg>
          </button>
        )}
        {onReport && (
          <button type="button" onClick={onReport} className={iconButtonClass} aria-label="Report question" title="Report question">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 21V4m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>
    </article>
  );
}
