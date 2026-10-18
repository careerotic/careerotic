-- Allow the server-side service_role to read exam schedule/status fields.
-- Required by private.guard_attempt_answer_write(), which validates attempt expiry
-- by joining exam_attempts to exams during attempt_answers INSERT/UPDATE.
-- This is a permission-only change: no schema, row data, function, trigger, or RLS policy changes.
GRANT SELECT ON TABLE public.exams TO service_role;
