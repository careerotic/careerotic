import { NextResponse } from "next/server";
import { authorizeCurrentAttempt } from "@/lib/exams/attempt-server";

export async function POST() {
  try {
    const access = await authorizeCurrentAttempt();
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
    if (access.attempt.status !== "in_progress") return NextResponse.json({ error: "This attempt is no longer in progress." }, { status: 409 });
    const { data, error } = await access.admin
      .from("exam_attempts")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", access.attempt.id)
      .eq("status", "in_progress")
      .select("id,status")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "The attempt could not be submitted. It may have expired." }, { status: 409 });
    return NextResponse.json({ submitted: true, attemptId: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit this exam.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
