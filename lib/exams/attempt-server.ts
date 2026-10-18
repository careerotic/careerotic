import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const GUEST_ID_COOKIE = "careerotic_guest_identity";
export const LAST_ATTEMPT_COOKIE = "careerotic_last_attempt";
const attemptCookie = (id: string) => `careerotic_attempt_${id}`;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Exam attempts require a server-only SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variable. Configure it in Vercel Preview and redeploy; never use a NEXT_PUBLIC_ prefix.",
    );
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function getParticipant() {
  const store = await cookies();
  const session = await createSessionClient();
  const { data } = await session.auth.getUser();
  if (data.user) return { userId: data.user.id, guestHash: null as string | null, store, session };

  let rawIdentity = store.get(GUEST_ID_COOKIE)?.value;
  if (!rawIdentity || !/^[a-f0-9]{64}$/.test(rawIdentity)) {
    rawIdentity = randomBytes(32).toString("hex");
    store.set(GUEST_ID_COOKIE, rawIdentity, { ...cookieOptions, maxAge: 60 * 60 * 24 * 365 });
  }
  return { userId: null, guestHash: sha256(rawIdentity), store, session };
}

export function tokenForAttempt(store: Awaited<ReturnType<typeof cookies>>, id: string) {
  return store.get(attemptCookie(id))?.value ?? null;
}

export function saveAttemptCookies(
  store: Awaited<ReturnType<typeof cookies>>,
  id: string,
  token: string,
) {
  store.set(attemptCookie(id), token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
  store.set(LAST_ATTEMPT_COOKIE, id, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
}

export async function authorizeCurrentAttempt() {
  const participant = await getParticipant();
  const id = participant.store.get(LAST_ATTEMPT_COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "No active exam attempt was found.", status: 404 as const };
  }
  const token = tokenForAttempt(participant.store, id);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return { error: "The secure attempt cookie is missing. This attempt cannot be resumed from this browser.", status: 401 as const };
  }

  const admin = createAdminClient();
  const { data: attempt, error } = await admin
    .from("exam_attempts")
    .select("id,exam_id,user_id,guest_identity_hash,attempt_token_hash,status,expires_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !attempt) return { error: "Exam attempt not found.", status: 404 as const };
  const owns = participant.userId
    ? attempt.user_id === participant.userId
    : !attempt.user_id && Boolean(participant.guestHash) && attempt.guest_identity_hash === participant.guestHash;
  if (!owns || sha256(token) !== attempt.attempt_token_hash) {
    return { error: "You are not authorized to access this attempt.", status: 403 as const };
  }
  return { participant, admin, attempt, token, status: 200 as const };
}

export async function readAttemptQuestions(
  session: Awaited<ReturnType<typeof createSessionClient>>,
  id: string,
  token: string,
) {
  const { data, error } = await session.rpc("get_attempt_questions", {
    p_attempt_id: id,
    p_attempt_token: token,
  });
  if (error) throw error;
  return data;
}

export function newAttemptToken() {
  return randomBytes(32).toString("hex");
}
