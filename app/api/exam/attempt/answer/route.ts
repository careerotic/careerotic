import { NextResponse } from "next/server";
import { authorizeCurrentAttempt } from "@/lib/exams/attempt-server";

export async function PUT(request: Request) {
  try {
    const access = await authorizeCurrentAttempt();
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
    if (access.attempt.status !== "in_progress") return NextResponse.json({ error: "This attempt is no longer in progress." }, { status: 409 });
    const body = await request.json() as { questionId?: unknown; optionId?: unknown };
    if (typeof body.questionId !== "string" || typeof body.optionId !== "string") {
      return NextResponse.json({ error: "A question and selected option are required." }, { status: 400 });
    }

    const snapshotResult = await access.admin
      .from("attempt_questions")
      .select("question_id,question_snapshot")
      .eq("attempt_id", access.attempt.id)
      .eq("question_id", body.questionId)
      .maybeSingle();
    if (snapshotResult.error) throw snapshotResult.error;
    if (!snapshotResult.data) return NextResponse.json({ error: "Question does not belong to this attempt." }, { status: 400 });
    const snapshot = snapshotResult.data.question_snapshot as unknown as { options?: { id?: string; option_id?: string }[] };
    const validOption = Array.isArray(snapshot.options) && snapshot.options.some((option) => (option.id ?? option.option_id) === body.optionId);
    if (!validOption) return NextResponse.json({ error: "Selected option does not belong to this question." }, { status: 400 });

    const { error } = await access.admin.from("attempt_answers").upsert({
      attempt_id: access.attempt.id,
      question_id: body.questionId,
      selected_option_id: body.optionId,
    }, { onConflict: "attempt_id,question_id" });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the answer.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
