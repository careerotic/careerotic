import { NextResponse } from "next/server";
import { authorizeCurrentAttempt } from "@/lib/exams/attempt-server";

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST() {
  try {
    const access = await authorizeCurrentAttempt();
    if ("error" in access) return jsonError(access.error, access.status);
    if (access.attempt.status !== "in_progress") {
      return jsonError("This attempt is no longer in progress.", 409);
    }

    const { data, error } = await access.admin
      .from("exam_attempts")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", access.attempt.id)
      .eq("status", "in_progress")
      .select("id,status")
      .maybeSingle();
    if (error) {
      const message = error.message ?? "";
      if (/expired|deadline|every question must be answered|unable to grade/i.test(message)) {
        return jsonError(/every question must be answered/i.test(message)
          ? "Every question must have a saved answer before submission."
          : "This attempt has expired. The database does not accept submissions after its deadline.", 409);
      }
      throw error;
    }
    if (!data) return jsonError("The attempt could not be submitted. It may have expired or already changed state.", 409);
    return NextResponse.json({ submitted: true, attemptId: data.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit this exam.";
    const expired = /expired|deadline|every question must be answered|unable to grade/i.test(message);
    return jsonError(expired
      ? (/every question must be answered/i.test(message) ? "Every question must have a saved answer before submission." : "This attempt has expired. The database does not accept submissions after its deadline.")
      : "Could not submit this exam. Please retry; if the problem continues, contact support.", expired ? 409 : 500);
  }
}
