import { createAdminClient } from "@/lib/exams/attempt-server";
import { createClient } from "@/lib/supabase/server";
import AdminAnalyticsDashboard from "@/components/admin/AdminAnalyticsDashboard";

type AnyRow = Record<string, any>;
type SnapshotQuestion = { question_id?: string; selected_option?: unknown; selected_option_id?: string | null; selected_is_correct?: boolean };
type Snapshot = { questions?: SnapshotQuestion[] };
function snapshotQuestions(value: unknown): SnapshotQuestion[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const questions = (value as Snapshot).questions;
  return Array.isArray(questions) ? questions.filter((item): item is SnapshotQuestion => Boolean(item && typeof item === "object" && !Array.isArray(item))) : [];
}
function hasAnswer(question: SnapshotQuestion) { return Boolean(question.selected_option || question.selected_option_id); }

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as Record<string, any> | undefined;
  if (claimsError || claims?.app_metadata?.role !== "admin") {
    return <section className="rounded-2xl border border-amber-200 bg-white p-6"><h1 className="text-xl font-bold text-slate-900">Administrator access required</h1><p className="mt-2 text-sm text-slate-600">This analytics dashboard is available only to authorized administrators.</p></section>;
  }

  const admin = createAdminClient();
  const [subjectsResult, topicsResult, questionsResult, examsResult, examQuestionsResult, reportsResult, attemptsResult] = await Promise.all([
    admin.from("subjects").select("id,name,slug").order("name"),
    admin.from("topics").select("id,name,slug,subject_id").order("name"),
    admin.from("questions").select("id,prompt,topic_id,status,language,explanation").order("created_at", { ascending: false }),
    admin.from("exams").select("id,status"),
    admin.from("exam_questions").select("exam_id,question_id"),
    admin.from("question_reports").select("id,status,reason,question_id"),
    admin.from("exam_attempts").select("submitted_at,result_snapshot").eq("status", "submitted").not("result_snapshot", "is", null).order("submitted_at", { ascending: false }).limit(500),
  ]);
  const failures = [subjectsResult, topicsResult, questionsResult, examsResult, examQuestionsResult, reportsResult, attemptsResult].filter((result) => result.error);
  if (failures.length) {
    return <section className="rounded-2xl border border-red-200 bg-white p-6"><h1 className="text-xl font-bold text-slate-900">Analytics temporarily unavailable</h1><p className="mt-2 text-sm text-slate-600">The dashboard could not read one or more existing data sources. No data was changed. Check server logs and existing Supabase access policies.</p></section>;
  }

  const subjects = (subjectsResult.data ?? []) as AnyRow[];
  const topics = (topicsResult.data ?? []) as AnyRow[];
  const questions = (questionsResult.data ?? []) as AnyRow[];
  const exams = (examsResult.data ?? []) as AnyRow[];
  const examQuestions = (examQuestionsResult.data ?? []) as AnyRow[];
  const reports = (reportsResult.data ?? []) as AnyRow[];
  const attempts = (attemptsResult.data ?? []) as AnyRow[];
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  // The frozen schema restricts direct reads of question_options.is_correct.
  // Reuse the existing administrator-guarded RPC through the authenticated session.
  const optionsByQuestion = new Map<string, AnyRow[]>();
  for (let offset = 0; offset < questions.length; offset += 8) {
    const batch = questions.slice(offset, offset + 8);
    const detailsResults = await Promise.all(batch.map(async (question) => ({
      questionId: question.id,
      result: await supabase.rpc("admin_get_question_details", { p_question_id: question.id }),
    })));
    if (detailsResults.some(({ result }) => result.error)) {
      return <section className="rounded-2xl border border-red-200 bg-white p-6"><h1 className="text-xl font-bold text-slate-900">Analytics temporarily unavailable</h1><p className="mt-2 text-sm text-slate-600">Question-quality details could not be read through the existing administrator RPC. No data was changed. Check server logs and the active administrator session.</p></section>;
    }
    for (const { questionId, result } of detailsResults) {
      const details = result.data as unknown as AnyRow | null;
      const questionOptions = Array.isArray(details?.options) ? details.options as AnyRow[] : [];
      optionsByQuestion.set(questionId, questionOptions.map((option) => ({
        question_id: questionId,
        is_correct: option.is_correct,
        option_order: option.option_order,
      })));
    }
  }
  const performance = new Map<string, { answered: number; correct: number }>();
  const daily = new Map<string, { attempts: number; answered: number; correct: number }>();
  for (const attempt of attempts) {
    const date = attempt.submitted_at ? new Date(attempt.submitted_at).toISOString().slice(0, 10) : null;
    if (date) { const day = daily.get(date) ?? { attempts: 0, answered: 0, correct: 0 }; day.attempts += 1; daily.set(date, day); }
    for (const question of snapshotQuestions(attempt.result_snapshot)) {
      if (!question.question_id || !hasAnswer(question) || typeof question.selected_is_correct !== "boolean") continue;
      const current = performance.get(question.question_id) ?? { answered: 0, correct: 0 };
      current.answered += 1;
      if (question.selected_is_correct) current.correct += 1;
      performance.set(question.question_id, current);
      if (date) { const day = daily.get(date) ?? { attempts: 0, answered: 0, correct: 0 }; day.answered += 1; if (question.selected_is_correct) day.correct += 1; daily.set(date, day); }
    }
  }

  const questionAnalytics = questions.map((question) => {
    const topic = topicById.get(question.topic_id);
    const subject = topic ? subjectById.get(topic.subject_id) : null;
    const questionOptions = optionsByQuestion.get(question.id) ?? [];
    const stats = performance.get(question.id) ?? { answered: 0, correct: 0 };
    return {
      id: question.id, prompt: String(question.prompt ?? ""), status: String(question.status ?? "unknown"), language: String(question.language ?? "unknown"),
      topicId: String(topic?.id ?? ""), topicName: String(topic?.name ?? "Unassigned topic"), subjectId: String(subject?.id ?? ""), subjectName: String(subject?.name ?? "Unassigned subject"),
      optionCount: questionOptions.length, correctOptionCount: questionOptions.filter((option) => option.is_correct).length,
      hasExplanation: Boolean(String(question.explanation ?? "").trim()), answered: stats.answered, correct: stats.correct,
      incorrect: stats.answered - stats.correct, accuracy: stats.answered ? Math.round(stats.correct / stats.answered * 100) : null,
      incorrectRate: stats.answered ? Math.round((stats.answered - stats.correct) / stats.answered * 100) : null,
    };
  });
  const subjectAnalytics = subjects.map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id);
    const subjectQuestions = questionAnalytics.filter((question) => question.subjectId === subject.id);
    const answered = subjectQuestions.reduce((sum, question) => sum + question.answered, 0);
    const correct = subjectQuestions.reduce((sum, question) => sum + question.correct, 0);
    return { id: subject.id, name: subject.name, slug: subject.slug, topicCount: subjectTopics.length, questionCount: subjectQuestions.length, published: subjectQuestions.filter((question) => question.status === "published").length, draft: subjectQuestions.filter((question) => question.status === "draft").length, answered, correct, accuracy: answered ? Math.round(correct / answered * 100) : null };
  });
  const topicAnalytics = topics.map((topic) => {
    const subject = subjectById.get(topic.subject_id);
    const topicQuestions = questionAnalytics.filter((question) => question.topicId === topic.id);
    const answered = topicQuestions.reduce((sum, question) => sum + question.answered, 0);
    const correct = topicQuestions.reduce((sum, question) => sum + question.correct, 0);
    return { id: topic.id, name: topic.name, slug: topic.slug, subjectId: topic.subject_id, subjectName: String(subject?.name ?? "Unassigned subject"), questionCount: topicQuestions.length, published: topicQuestions.filter((question) => question.status === "published").length, draft: topicQuestions.filter((question) => question.status === "draft").length, answered, correct, accuracy: answered ? Math.round(correct / answered * 100) : null };
  });
  const qualityQuestions = questionAnalytics.map((question) => ({
    ...question,
    issues: [
      question.optionCount !== 4 ? "Options are not exactly four" : null,
      question.correctOptionCount !== 1 ? "Correct option count is not one" : null,
      !question.hasExplanation ? "Missing explanation" : null,
    ].filter((issue): issue is string => issue !== null),
  })).filter((question) => question.issues.length > 0 || (question.answered >= 3 && question.incorrectRate !== null && question.incorrectRate >= 60));
  const totalAnswered = questionAnalytics.reduce((sum, question) => sum + question.answered, 0);
  const totalCorrect = questionAnalytics.reduce((sum, question) => sum + question.correct, 0);
  const pendingReports = reports.filter((report) => report.status === "pending").length;
  const dailyAnalytics = [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, value]) => ({ date, ...value, accuracy: value.answered ? Math.round(value.correct / value.answered * 100) : null }));

  return <AdminAnalyticsDashboard data={{
    summary: {
      subjects: subjects.length, topics: topics.length, questions: questions.length,
      publishedQuestions: questionAnalytics.filter((question) => question.status === "published").length,
      draftQuestions: questionAnalytics.filter((question) => question.status === "draft").length,
      exams: exams.length, publishedExams: exams.filter((exam) => exam.status === "published").length,
      examQuestionLinks: examQuestions.length, reports: reports.length, pendingReports,
      submittedAttempts: attempts.length, answered: totalAnswered, correct: totalCorrect,
      accuracy: totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : null,
      qualityIssues: qualityQuestions.filter((question) => question.issues.length > 0).length,
    },
    subjects: subjectAnalytics, topics: topicAnalytics, questions: qualityQuestions,
    daily: dailyAnalytics,
  }} />;
}
