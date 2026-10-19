import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteProps = { params: Promise<{ subjectSlug: string }> };
type TopicRow = { id: string; name: string; slug: string };
type TopicCountRow = { topic_id: string };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  await connection();
  const { subjectSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("name").eq("slug", subjectSlug).maybeSingle();
  return {
    title: data?.name ? `${data.name} questions and topics` : "Subject",
    description: data?.name ? `Browse topics and published practice questions in ${data.name} on Careerotic.` : "Browse Careerotic subjects and topics.",
    alternates: { canonical: `/subjects/${subjectSlug}` },
  };
}

export default async function SubjectPage({ params }: RouteProps) {
  const { subjectSlug } = await params;
  const supabase = await createClient();
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id,name,slug")
    .eq("slug", subjectSlug)
    .maybeSingle();

  if (subjectError) {
    console.error("Subject lookup failed:", subjectError.message);
    throw new Error("Unable to load this subject.");
  }
  if (!subject) notFound();

  const { data: topicRows, error: topicsError } = await supabase
    .from("topics")
    .select("id,name,slug")
    .eq("subject_id", subject.id)
    .order("name", { ascending: true });

  if (topicsError) {
    console.error("Topic lookup failed:", topicsError.message);
    throw new Error("Unable to load topics for this subject.");
  }

  const topics = (topicRows ?? []) as TopicRow[];
  const topicIds = topics.map((topic) => topic.id);
  let questionCountByTopic = new Map<string, number>();

  // Keep the public topic listing i...[truncated]