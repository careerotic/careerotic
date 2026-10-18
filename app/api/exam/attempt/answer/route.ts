import { NextResponse } from "next/server";
import { authorizeCurrentAttempt } from "@/lib/exams/attempt-server";

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function PUT(request: Request) {
  try {
    const access = await authorizeCurrentAttempt();
    if ("error" in access) return jsonError(access.error, access.status);
    if (access.attempt.status !== "in_progress") {
      return jsonError("This attempt is no longer in progress.", 409);
    }
    const body = await request.json() as { questionId?: unknown; optionId?: unknown };
    if (typeof body.questionId !== "string" || typeof body.optionId !== "string") {
      return jsonError("A question and selected option are required.", 400);
    }

    const snapshotResult = await access.admin
      .from("attempt_questions")
      .select("question_id,question_snapshot")
      .eq("attempt_id", access.attempt.id)
      .eq("question_id", body.questionId)
      .maybeSingle();
    if (snapshotResult.error) throw snapshotResult.error;
    if (!snapshotResult.data) return jsonError("Question does not belong to this attempt.", 400);

    const snapshot = snapshotResult.data.question_snapshot as unknown as { options?: { id?: string; option_id?: string }[] };
    const validOption = Array.isArray(snapshot.options) && snapshot.options.some((option) => (option.id ?? option.option_id) === body.optionId);
    if (!validOption) return jsonError("Selected option does not belong to this question.", 400);

    const { error } = await access.admin.from("attempt_answers").upsert({
      attempt_id: access.attempt.id,
      question_id: body.questionId,
      selected_option_id: body.optionId,
    }, { onConflict: "attempt_id,question_id" });
    if (error) throw error;
    return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the answer.";
    const expired = /expired|deadline|no longer in progress|only be changed on an in-progress attempt/i.test(message);
    return jsonError(expired ? "This attempt has expired or is no longer in progress. The database will not accept more answers." : "Could not save this answer. Please retry; if the problem continues, contact support.", expired ? 409 : 500);
  }
}
