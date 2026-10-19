import { NextResponse } from "next/server";
import {
  createAdminClient,
  getParticipant,
  newAttemptToken,
  readAttemptQuestions,
  saveAttemptCookies,
  sha256,
  tokenForAttempt,
} from "@/lib/exams/attempt-server";

type Context = { params: Promise<{ slug: string }> };
type ExamInfo = {
  title: string;
  description: string | null;
  durationMinutes: number;
  correctMarks: number;
  negativeMarks: number;
};
type MarkSnapshot = { correct_marks_snapshot: number; negative_marks_snapshot: number };
const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
const INACTIVE_GUEST_RETENTION_MS = 24 * 60 * 60 * 1000;

async function responseForAttempt(
  session: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  id: string,
  token: string,
  resumed: boolean,
  exam: ExamInfo,
  marks: MarkSnapshot,
) {
  const raw = await readAttemptQuestions(session, id, token) as {
    status?: string;
    expires_at?: string;
    questions?: unknown[];
  };
  if (raw.status !== "in_progress") {
    return jsonError("This attempt has expired or is no longer in progress.", 409);
  }
  return NextResponse.json({
    attemptId: id,
    expiresAt: raw.expires_at,
    serverNow: new Date().toISOString(),
    questions: raw.questions ?? [],
    resumed,
    exam: {
      title: exam.title,
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      correctMarks: marks.correct_marks_snapshot,
      negativeMarks: marks.negative_marks_snapshot,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(_request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const participant = await getParticipant();
    const admin = createAdminClient();
    const { data: examRow, error: examError } = await participant.session
      .from("exams")
      .select("id,title,description,slug,status,duration_minutes,correct_marks,negative_marks,start_at,end_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (examError) throw examError;
    if (!examRow) return jsonError("This exam is not published or no longer exists.", 404);

    const exam: ExamInfo = {
      title: examRow.title,
      description: examRow.description,
      durationMinutes: examRow.duration_minutes,
      correctMarks: examRow.correct_marks,
      negativeMarks: examRow.negative_marks,
    };

    let priorQuery = admin
      .from("exam_attempts")
      .select("id,status,attempt_token_hash,created_at,last_activity_at,expires_at,correct_marks_snapshot,negative_marks_snapshot")
      .eq("exam_id", examRow.id);
    priorQuery = participant.userId
      ? priorQuery.eq("user_id", participant.userId)
      : priorQuery.eq("guest_identity_hash", participant.guestHash ?? "");
    const priorResult = await priorQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (priorResult.error) throw priorResult.error;

    const prior = priorResult.data;
    const staleIncompleteGuest = Boolean(
      prior &&
      !participant.userId &&
      prior.status !== "submitted" &&
      Date.now() - new Date(prior.last_activity_at).getTime() >= INACTIVE_GUEST_RETENTION_MS
    );

    if (prior && !staleIncompleteGuest) {
      const savedToken = tokenForAttempt(participant.store, prior.id);
      if (prior.status === "submitted") {
        if (savedToken && sha256(savedToken) === prior.attempt_token_hash) {
          saveAttemptCookies(participant.store, prior.id, savedToken);
          return NextResponse.json({ state: "completed", redirectTo: `/result/${encodeURIComponent(slug)}` }, { headers: { "Cache-Control": "no-store" } });
        }
        return NextResponse.json({ state: "completed", error: "This exam has already been submitted. Open the result from the browser used to complete it, where its secure token is stored." }, { status: 409, headers: { "Cache-Control": "no-store" } });
      }
      if (prior.status === "in_progress" && prior.expires_at && Date.now() >= new Date(prior.expires_at).getTime()) {
        return NextResponse.json({ state: "expired", error: "The allowed time for this attempt has ended. This attempt cannot be resumed or submitted." }, { status: 409, headers: { "Cache-Control": "no-store" } });
      }
      if (prior.status === "in_progress" && savedToken && sha256(savedToken) === prior.attempt_token_hash) {
        saveAttemptCookies(participant.store, prior.id, savedToken);
        return responseForAttempt(participant.session, prior.id, savedToken, true, exam, prior);
      }
      if (prior.status === "in_progress") {
        return jsonError("An unfinished attempt already exists, but its secure browser token is unavailable. For safety, a second attempt was not created.", 409);
      }
      return NextResponse.json({ state: "expired", error: "This attempt is no longer active. Its time limit may have ended, or the attempt may have been closed. You cannot resume or submit it." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }

    // Existing attempts must be resolved before checking whether new starts are allowed.
    // This lets submitted users reach their result and existing attempts be restored
    // even if the exam's public start window has since closed.
    const now = Date.now();
    if ((examRow.start_at && now < new Date(examRow.start_at).getTime()) || (examRow.end_at && now >= new Date(examRow.end_at).getTime())) {
      return jsonError("This exam is outside its scheduled availability window.", 409);
    }
    const assignments = await participant.session
      .from("exam_questions")
      .select("question_id,question_order")
      .eq("exam_id", examRow.id)
      .order("question_order");
    if (assignments.error) throw assignments.error;
    if (!assignments.data?.length) return jsonError("This exam has no assigned questions yet.", 409);

    const token = newAttemptToken();
    const provisionalExpiry = new Date(Date.now() + examRow.duration_minutes * 60_000).toISOString();
    const insert = await admin.from("exam_attempts").insert({
      exam_id: examRow.id,
      user_id: participant.userId,
      guest_identity_hash: participant.userId ? null : participant.guestHash,
      attempt_token_hash: sha256(token),
      expires_at: provisionalExpiry,
    }).select("id,correct_marks_snapshot,negative_marks_snapshot").single();

    if (insert.error) {
      if (insert.error.code === "23505") {
        return jsonError("An attempt was started at the same time in another request. Reload this page to resume it.", 409);
      }
      throw insert.error;
    }

    const attemptId = insert.data.id;
    const snapshots = await admin.from("attempt_questions").insert(
      assignments.data.map((item) => ({
        attempt_id: attemptId,
        question_id: item.question_id,
        question_order: item.question_order,
        question_snapshot: {},
      })),
    ).select("question_id");

    if (snapshots.error || snapshots.data?.length !== assignments.data.length) {
      const cleanup = await admin.from("exam_attempts").delete().eq("id", attemptId).select("id");
      if (cleanup.error || cleanup.data?.length !== 1) {
        console.error("[exam-attempt-start] Snapshot creation failed and attempt cleanup could not be confirmed", {
          attemptId,
          snapshotError: snapshots.error?.message ?? "Snapshot count did not match exam assignments",
          cleanupError: cleanup.error?.message ?? "Attempt cleanup did not delete exactly one row",
        });
        return jsonError("The exam could not be initialized safely. Please contact support before trying again.", 500);
      }
      throw snapshots.error ?? new Error("The saved question snapshot count did not match the exam assignments.");
    }

    saveAttemptCookies(participant.store, attemptId, token);
    return responseForAttempt(participant.session, attemptId, token, false, exam, insert.data);
  } catch (error) {
    console.error("[exam-attempt-start] Failed to start attempt", error);
    const message = error instanceof Error ? error.message : "Could not start this exam.";
    const status = /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(message) ? 503 : 500;
    return jsonError(status === 503
      ? "Secure exam attempts are not configured on this deployment. Please contact the site administrator."
      : "Could not start or restore this exam attempt. Please retry; if the problem continues, contact support.", status);
  }
}
