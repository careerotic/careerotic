import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import QuestionsClient from "./QuestionsClient";

export const metadata: Metadata = {
  title: "Practice Questions",
  description: "Browse published competitive exam questions by subject, topic, and language. Review options and explanations on Careerotic.",
  alternates: { canonical: "/questions" },
};

export default async function QuestionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id,topic_id,prompt,language,created_at,topics!inner(id,name,subject_id,subjects!inner(id,name)),question_options(id,question_id,option_text,option_order)", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(0, 19);

  const initialQuestions = (data ?? []).map((question) => ({
    ...question,
    question_options: [...(question.question_options ?? [])].sort((a, b) => a.option_order - b.option_order),
  }));

  return <QuestionsClient initialQuestions={initialQuestions as never[]} initialLoadFailed={Boolean(error)} />;
}
