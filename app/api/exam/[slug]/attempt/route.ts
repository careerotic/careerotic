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
const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

async function responseForAttempt(session: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>, id: string, token: string, resumed: boolean) {
  const raw = await readAttemptQuestions(session, id, token) as { status?: string; expires_at?: string; questions?: unknown[] };
  if (raw.status !== "in_progress") return jsonError("This attempt has expired or is no longer in progress.", 409);
  return NextResponse.json({ attemptId: id, expiresAt: raw.expires_at, questions: raw.questions ?? [], resumed }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(_request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const participant = await getParticipant();
    const admin = createAdminClient();
    const { data: exam, error: examError } = await admin
      .from("exams")
      .select("id,title,slug,status,duration_minutes,start_at,end_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (examError) throw examError;
    if (!exam) return jsonError("This exam is not published or no longer exists.", 404);
    const now = Date.now();
    if ((exam.start_at && now < new Date(exam.start_at).getTime()) || (exam.end_at && now >= new Date(exam.end_at).getTime())) {
      return jsonError("This exam is outside its scheduled availability window.", 409);
    }

    const assignments = await admin.from("exam_questions").select("question_id,question_order").eq("exam_id", exam.id).order("question_order");
    if (assignments.error) throw assignments.error;
    if (!assignments.data?.length) return jsonError("This exam has no assigned questions yet.", 409);

    let priorQuery = admin.from("exam_attempts").select("id,status,attempt_token_hash,created_at").eq("exam_id", exam.id);
    priorQuery = participant.userId
      ? priorQuery.eq("user_id", participant.userId)
      : priorQuery.eq("guest_identity_hash", participant.guestHash ?? "");
    const priorResult = await priorQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (priorResult.error) throw priorResult.error;
    const prior = priorResult.data;
    if (prior) {
      const savedToken = tokenForAttempt(participant.store, prior.id);
      if (prior.status === "in_progress" && savedToken && sha256(savedToken) === prior.attempt_token_hash) {
        saveAttemptCookies(participant.store, prior.id, savedToken);
        return responseForAttempt(participant.session, prior.id, savedToken, true);
      }
      if (prior.status === "in_progress") {
        return jsonError("An unfinished attempt already exists, but its secure browser token is unavailable. For safety, a second attempt was not created.", 409);
      }
      return jsonError("An attempt for this exam already exists and is no longer in progress. Retakes are not enabled by the current database rules.", 409);
    }

    const token = newAttemptToken();
    const provisionalExpiry = new Date(Date.now() + exam.duration_minutes * 60_000).toISOString();
    const insert = await admin.from("exam_attempts").insert({
      exam_id: exam.id,
      user_id: participant.userId,
      guest_identity_hash: participant.userId ? null : participant.guestHash,
      attempt_token_hash: sha256(token),
      expires_at: provisionalExpiry,
    }).select("id").single();
    if (insert.error) throw insert.error;
    const attemptId = insert.data.id;
    const snapshots = await admin.from("attempt_questions").insert(
      assignments.data.map((item) => ({
        attempt_id: attemptId,
        question_id: item.question_id,
        question_order: item.question_order,
        question_snapshot: {},
      })),
    );
    if (snapshots.error) {
      await admin.from("exam_attempts").delete().eq("id", attemptId);
      throw snapshots.error;
    }

    saveAttemptCookies(participant.store, attemptId, token);
    return responseForAttempt(participant.session, attemptId, token, false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start this exam.";
    const status = /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(message) ? 503 : 500;
    return jsonError(status === 503 ? "Secure exam attempts are not configured on this deployment. Please contact the site administrator." : message, status);
  }
}
