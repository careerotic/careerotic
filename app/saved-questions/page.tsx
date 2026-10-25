"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { GuestAccessPrompt } from "@/components/auth/GuestAccessPrompt";

type Saved = {
  question_id: string;
  questions: {
    id: string;
    prompt: string;
    language: string;
    question_options: { id: string; option_text: string; option_order: number }[] | null;
    topics: { name: string; subjects: { name: string } | null } | null;
  } | null;
};

export default function SavedQuestionsPage() {
  const [rows, setRows] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSavedQuestions() {
      try {
        const db = createClient();

        // A missing session is expected for guests, not an application error.
        const { data: sessionData, error: sessionError } = await db.auth.getSession();
        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;
        if (!user) {
          if (active) setSignedIn(false);
          return;
        }

        const { data, error: queryError } = await db
          .from("question_bookmarks")
          .select("question_id,questions(id,prompt,language,question_options(id,option_text,option_order),topics(name,subjects(name)))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        if (active) {
          setSignedIn(true);
          setRows((data ?? []) as unknown as Saved[]);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Saved questions could not be loaded.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSavedQuestions();
    return () => { active = false; };
  }, []);

  async function remove(questionId: string) {
    setBusy(questionId);
    setError("");

    try {
      const db = createClient();
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData.session?.user;
      if (!user) {
        setSignedIn(false);
        return;
      }

      const { error: deleteError } = await db
        .from("question_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("question_id", questionId);

      if (deleteError) throw deleteError;
      setRows(current => current.filter(row => row.question_id !== questionId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove the saved question.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="space-y-4">
      <header className="rounded-xl border bg-white p-4">
        <p className="text-xs font-bold uppercase text-indigo-700">Personal study</p>
        <h1 className="mt-1 text-2xl font-bold">Saved Questions</h1>
        <p className="mt-1 text-sm text-slate-600">Keep important questions together for later revision.</p>
      </header>

      {loading ? (
        <div role="status" aria-label="Loading saved questions" aria-busy="true" className="space-y-2">
          {[1, 2, 3].map(index => (
            <section key={index} className="rounded-xl border bg-white p-3">
              <Skeleton className="h-3 w-32 rounded bg-slate-200" />
              <Skeleton className="mt-3 h-4 w-5/6 rounded bg-slate-200" />
              <Skeleton className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Skeleton className="h-9 rounded-md bg-slate-100" />
                <Skeleton className="h-9 rounded-md bg-slate-100" />
              </div>
            </section>
          ))}
        </div>
      ) : signedIn === false ? (
        <GuestAccessPrompt
          eyebrow="Personal study"
          title="Log in to view saved questions"
          description="Your saved questions are connected to your account. Log in to revisit them anytime, or create a free account to start building your personal question collection."
          returnTo="/saved-questions"
        />
      ) : error ? (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>
      ) : rows.length ? (
        <div className="space-y-2">
          {rows.map(row => {
            const question = row.questions;
            return (
              <article key={row.question_id} className="rounded-xl border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      {question?.topics?.subjects?.name ?? "Question bank"}
                      {question?.topics?.name ? ` · ${question.topics.name}` : ""}
                      {question?.language ? ` · ${question.language}` : ""}
                    </p>
                    <h2 className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-6">
                      {question?.prompt ?? "Question unavailable"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    disabled={busy === row.question_id}
                    onClick={() => void remove(row.question_id)}
                    className="shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
                  >
                    {busy === row.question_id ? "Removing…" : "Remove"}
                  </button>
                </div>
                {question?.question_options?.length ? (
                  <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {[...question.question_options].sort((a, b) => a.option_order - b.option_order).map((option, index) => (
                      <li key={option.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                        <span className="mr-2 text-xs font-semibold text-slate-500">{String.fromCharCode(65 + index)}.</span>
                        {option.option_text}
                      </li>
                    ))}
                  </ol>
                ) : null}
                <Link href="/questions" className="mt-3 inline-flex text-xs font-semibold text-indigo-700">
                  Open question bank →
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center">
          <h2 className="font-semibold">No saved questions yet</h2>
          <p className="mt-1 text-sm text-slate-600">Use the bookmark icon in the question bank to save items for revision.</p>
          <Link href="/questions" className="mt-4 inline-flex rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">
            Browse questions
          </Link>
        </section>
      )}
    </main>
  );
}
