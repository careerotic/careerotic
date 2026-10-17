--
-- PROJECT / ARTIFACT METADATA
-- Project: Careerotic — Bangladesh-focused exam preparation and Question Bank platform.
-- Repository: careerotic/careerotic
-- Artifact: supabase/migrations/20261017121257_careerotic_initial_schema.sql
-- Platform: Supabase-managed PostgreSQL with Supabase Auth.
-- Scope: initial schema definition and operational reference; no seed records.
--
-- PRODUCTION ENVIRONMENT REFERENCE (NON-SECRET INFORMATION)
-- Production Supabase project: careerotic (ref: fmebgspzpqnqeyfzeeqj).
-- Production region: ap-south-1 (Mumbai); PostgreSQL major version: 17.
-- The project reference is metadata, not a credential. Never store database passwords,
-- access tokens, service-role keys, or other secrets in this SQL file or Git history.
-- Production deployment must use a reviewed, version-controlled SQL artifact and an
-- explicit release approval. Keep Preview/Development credentials and projects separate.
-- After an approved first-time installation, verify expected tables, constraints,
-- indexes, triggers, RLS policies, grants, required extensions, and exactly one
-- careerotic-attempt-cleanup cron job. Record results in the release/deployment log.
-- This section is documentation only; it does not configure or change the project.
--
--
-- FINALIZED / FROZEN DATABASE DECLARATION
-- Careerotic's database schema is finalized and frozen. This file is the single
-- approved initial schema definition; it is not permission to execute or apply it.
-- Do not modify the database schema, tables, columns, constraints, indexes,
-- functions, triggers, RLS policies, grants, security rules, or database behavior.
-- Do not create, add, or apply any new migration. Do not replay this initial schema.
-- Treat the frozen schema and its existing business/security rules as authoritative.
-- This declaration is documentation only and makes no database changes.
--
-- ENVIRONMENT ISOLATION
-- Keep production, Preview/test, and Development databases isolated. Any inspection
-- must be read-only unless the user explicitly changes this frozen-database directive.
--
-- PLATFORM / DEPLOYMENT PREREQUISITES
-- Supabase Auth must provide auth.users, auth.uid(), and auth.jwt().
-- pgcrypto is used for cryptographic helpers; pg_cron is used to schedule periodic
-- cleanup. Confirm both extensions and required privileges are available in a
-- disposable/test environment before any first-time schema installation.
-- This file registers a cleanup job; verify the job is not duplicated before rerunning.
--
-- SECURITY BOUNDARIES (DOCUMENTATION ONLY)
-- public tables are protected by row-level security and explicit grants below.
-- Keep the private schema out of the Supabase Data API exposed-schema list.
-- Admin authorization is based on the app_metadata role claim, not user-editable metadata.
-- Never expose a Supabase service-role/secret key to browser code.
--
-- DOMAIN MAP
-- * Question Bank: subjects -> topics -> questions -> question_options.
-- * Exam catalog: exam_categories -> exams -> ordered exam_questions.
-- * Attempts: exam_attempts -> attempt_questions snapshots -> attempt_answers.
-- * User features: question_bookmarks and question_reports.
-- * Governance: exam_attempt_admin_resets records explicit admin resets.
--
-- BEHAVIORAL INVARIANTS ALREADY IMPLEMENTED BELOW (DO NOT CHANGE HERE)
-- * Attempt scoring and question/option content are snapshotted for grading.
-- * Authenticated users have one attempt per exam, including after expiry.
-- * A submitted guest attempt is retained; incomplete guest attempts are cleaned
--   after 24 hours of inactivity, releasing the guest/exam uniqueness key.
-- * The cleanup task is scheduled every 15 minutes by the SQL at the end of this file.
--
-- This header documents the existing schema; it does not alter database behavior.
-- Careerotic initial frozen schema.
-- Apply only after the schema PR passes CI and receives explicit approval.
-- No seed data is included.

-- [SCHEMA GUIDE] Required extension for cryptographic helpers used by this schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- [SCHEMA GUIDE] Core Question Bank taxonomy: subjects contain topics; topics contain questions.
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  slug text NOT NULL UNIQUE CHECK (length(btrim(slug)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  slug text NOT NULL CHECK (length(btrim(slug)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT topics_subject_name_key UNIQUE (subject_id, name),
  CONSTRAINT topics_subject_slug_key UNIQUE (subject_id, slug)
);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE RESTRICT,
  prompt text NOT NULL CHECK (length(btrim(prompt)) > 0),
  explanation text,
  language text NOT NULL DEFAULT 'bn' CHECK (language IN ('bn', 'en')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text text NOT NULL CHECK (length(btrim(option_text)) > 0),
  option_order smallint NOT NULL CHECK (option_order BETWEEN 1 AND 4),
  is_correct boolean NOT NULL DEFAULT false,
  CONSTRAINT question_options_question_order_key UNIQUE (question_id, option_order),
  CONSTRAINT question_options_question_id_key UNIQUE (question_id, id)
);

-- [SCHEMA GUIDE] Exam catalog: categories group exams; exam_questions defines each exam's ordered content.
CREATE TABLE public.exam_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  slug text NOT NULL UNIQUE CHECK (length(btrim(slug)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.exam_categories(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  slug text NOT NULL UNIQUE CHECK (length(btrim(slug)) > 0),
  description text,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  correct_marks numeric(8,2) NOT NULL DEFAULT 1 CHECK (correct_marks > 0),
  negative_marks numeric(8,2) NOT NULL DEFAULT 0 CHECK (negative_marks >= 0),
  start_at timestamptz,
  end_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exams_valid_schedule CHECK (
    start_at IS NULL OR end_at IS NULL OR end_at > start_at
  )
);

CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order integer NOT NULL CHECK (question_order > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_questions_exam_question_key UNIQUE (exam_id, question_id),
  CONSTRAINT exam_questions_exam_order_key UNIQUE (exam_id, question_order)
);

-- [SCHEMA GUIDE] Attempt lifecycle and immutable grading inputs/results begin here.
-- Authenticated identity uses user_id; guest identity uses a hash digest.
-- Raw guest bearer tokens are not stored in this table; only their hash is persisted.
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_identity_hash text
    CHECK (guest_identity_hash IS NULL OR guest_identity_hash ~ '^[0-9a-f]{64}$'),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE RESTRICT,
  attempt_token_hash text NOT NULL UNIQUE
    CHECK (attempt_token_hash ~ '^[0-9a-f]{64}$'),
  correct_marks_snapshot numeric(8,2) NOT NULL DEFAULT 1 CHECK (correct_marks_snapshot > 0),
  negative_marks_snapshot numeric(8,2) NOT NULL DEFAULT 0 CHECK (negative_marks_snapshot >= 0),
  result_snapshot jsonb,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'expired')),
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_attempts_expiry_after_start CHECK (expires_at > started_at),
  CONSTRAINT exam_attempts_submission_state CHECK (
    (status = 'submitted' AND submitted_at IS NOT NULL)
    OR (status <> 'submitted' AND submitted_at IS NULL)
  ),
  CONSTRAINT exam_attempts_identity_kind CHECK (
    (user_id IS NOT NULL AND guest_identity_hash IS NULL)
    OR (user_id IS NULL AND guest_identity_hash IS NOT NULL)
  ),
  CONSTRAINT exam_attempts_result_snapshot_state CHECK (
    (status = 'submitted' AND result_snapshot IS NOT NULL AND jsonb_typeof(result_snapshot) = 'object')
    OR (status <> 'submitted' AND result_snapshot IS NULL)
  )
);

-- A user can start each exam only once, even if the attempt expires.
CREATE UNIQUE INDEX exam_attempts_one_user_exam
  ON public.exam_attempts (user_id, exam_id)
  WHERE user_id IS NOT NULL;

-- Guest identity is unique per exam while its attempt record exists. Submitted
-- attempts remain forever; stale incomplete guest attempts are deleted after 24h.
CREATE UNIQUE INDEX exam_attempts_one_guest_exam
  ON public.exam_attempts (guest_identity_hash, exam_id)
  WHERE guest_identity_hash IS NOT NULL;
CREATE INDEX exam_attempts_exam_status_idx
  ON public.exam_attempts (exam_id, status);
CREATE INDEX exam_attempts_cleanup_idx
  ON public.exam_attempts (status, last_activity_at, expires_at);



-- Retake restrictions are removed only through an explicit admin reset.
-- Keep this audit record independent of the attempt row so it survives deletion.
-- [SCHEMA GUIDE] Audit trail for explicit admin resets; independent of attempt-row deletion.
CREATE TABLE public.exam_attempt_admin_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  exam_id uuid NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status text NOT NULL CHECK (previous_status IN ('in_progress', 'submitted', 'expired')),
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 5 AND 1000),
  reset_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exam_attempt_admin_resets_attempt_idx
  ON public.exam_attempt_admin_resets (attempt_id, reset_at DESC);
CREATE INDEX exam_attempt_admin_resets_actor_idx
  ON public.exam_attempt_admin_resets (actor_user_id, reset_at DESC);

-- [SCHEMA GUIDE] Per-attempt question/option snapshot; preserve it for consistent grading.
CREATE TABLE public.attempt_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order integer NOT NULL CHECK (question_order > 0),
  question_snapshot jsonb NOT NULL CHECK (jsonb_typeof(question_snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attempt_questions_attempt_question_key UNIQUE (attempt_id, question_id),
  CONSTRAINT attempt_questions_attempt_order_key UNIQUE (attempt_id, question_order)
);

CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attempt_answers_one_per_question UNIQUE (attempt_id, question_id),
  CONSTRAINT attempt_answers_option_belongs_to_question
    FOREIGN KEY (question_id, selected_option_id)
    REFERENCES public.question_options (question_id, id) ON DELETE RESTRICT
);

CREATE INDEX attempt_answers_attempt_idx ON public.attempt_answers (attempt_id);
CREATE INDEX attempt_answers_question_option_idx
  ON public.attempt_answers (question_id, selected_option_id);

-- Normalize case and whitespace to prevent duplicate Question Bank prompts.
CREATE UNIQUE INDEX questions_prompt_normalized_key
  ON public.questions (lower(regexp_replace(btrim(prompt), '[[:space:]]+', ' ', 'g')));

-- Option text must be unique within each question after normalization.
CREATE UNIQUE INDEX question_options_text_normalized_key
  ON public.question_options (
    question_id,
    lower(regexp_replace(btrim(option_text), '[[:space:]]+', ' ', 'g'))
  );

-- [SCHEMA GUIDE] User features: bookmarks are unique per user/question; reports support moderation.
CREATE TABLE public.question_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_bookmarks_user_question_key UNIQUE (user_id, question_id)
);

CREATE TABLE public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN (
    'incorrect_question',
    'incorrect_option',
    'multiple_correct_answers',
    'no_correct_answer',
    'unclear_question',
    'other'
  )),
  details text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX question_reports_status_created_idx
  ON public.question_reports (status, created_at DESC);
CREATE INDEX question_reports_user_id_idx
  ON public.question_reports (user_id);
CREATE INDEX questions_topic_status_idx
  ON public.questions (topic_id, status);
CREATE INDEX exam_questions_exam_order_idx
  ON public.exam_questions (exam_id, question_order);

-- Cover foreign-key lookups used during deletes and common relationship joins.
CREATE INDEX exams_category_id_idx ON public.exams (category_id);
CREATE INDEX exam_questions_question_id_idx ON public.exam_questions (question_id);
CREATE INDEX attempt_questions_question_id_idx ON public.attempt_questions (question_id);
-- Covered by attempt_answers_question_option_idx (question_id, selected_option_id).
CREATE INDEX question_bookmarks_question_id_idx ON public.question_bookmarks (question_id);
CREATE INDEX question_reports_question_id_idx ON public.question_reports (question_id);

-- Search indexes for published content. Match application queries to these
-- expressions (to_tsvector('simple', ...)) to enable indexed full-text search.
CREATE INDEX questions_published_search_idx
  ON public.questions USING gin (to_tsvector('simple'::regconfig, prompt))
  WHERE status = 'published';
CREATE INDEX question_options_search_idx
  ON public.question_options USING gin (to_tsvector('simple'::regconfig, option_text));
CREATE INDEX exams_published_search_idx
  ON public.exams USING gin (
    to_tsvector('simple'::regconfig, title || ' ' || COALESCE(description, ''))
  )
  WHERE status = 'published';
CREATE INDEX subjects_search_idx
  ON public.subjects USING gin (to_tsvector('simple'::regconfig, name));
CREATE INDEX topics_search_idx
  ON public.topics USING gin (to_tsvector('simple'::regconfig, name));

-- [SCHEMA GUIDE] Maintain updated_at on mutable catalog, answer, and moderation records.
CREATE TRIGGER subjects_set_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER topics_set_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER exam_categories_set_updated_at
  BEFORE UPDATE ON public.exam_categories
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER exams_set_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER attempt_answers_set_updated_at
  BEFORE UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER question_reports_set_updated_at
  BEFORE UPDATE ON public.question_reports
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- [SCHEMA GUIDE] Publication validation rejects incomplete Question Bank content.
CREATE OR REPLACE FUNCTION private.assert_question_publishable(p_question_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_status text;
  v_option_count integer;
  v_correct_count integer;
BEGIN
  SELECT q.status INTO v_status
  FROM public.questions AS q
  WHERE q.id = p_question_id;

  IF v_status IS DISTINCT FROM 'published' THEN
    RETURN;
  END IF;

  SELECT count(*), count(*) FILTER (WHERE qo.is_correct)
    INTO v_option_count, v_correct_count
  FROM public.question_options AS qo
  WHERE qo.question_id = p_question_id;

  IF v_option_count <> 4 OR v_correct_count <> 1 THEN
    RAISE EXCEPTION
      'Published question % must have exactly four options and exactly one correct option',
      p_question_id
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_question_publishable_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF TG_TABLE_NAME = 'questions' THEN
    PERFORM private.assert_question_publishable(NEW.id);
  ELSE
    IF TG_OP <> 'INSERT' THEN
      PERFORM private.assert_question_publishable(OLD.question_id);
    END IF;
    IF TG_OP <> 'DELETE' THEN
      PERFORM private.assert_question_publishable(NEW.question_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER questions_validate_publishable
  AFTER INSERT OR UPDATE ON public.questions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_question_publishable_trigger();
CREATE CONSTRAINT TRIGGER question_options_validate_publishable
  AFTER INSERT OR UPDATE OR DELETE ON public.question_options
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_question_publishable_trigger();

CREATE OR REPLACE FUNCTION private.assert_exam_publishable(p_exam_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_status text;
  v_question_count integer;
  v_unpublished_count integer;
BEGIN
  SELECT e.status INTO v_status
  FROM public.exams AS e
  WHERE e.id = p_exam_id;

  IF v_status IS DISTINCT FROM 'published' THEN
    RETURN;
  END IF;

  SELECT count(*), count(*) FILTER (WHERE q.status <> 'published')
    INTO v_question_count, v_unpublished_count
  FROM public.exam_questions AS eq
  JOIN public.questions AS q ON q.id = eq.question_id
  WHERE eq.exam_id = p_exam_id;

  IF v_question_count = 0 OR v_unpublished_count > 0 THEN
    RAISE EXCEPTION
      'Published exam % must contain at least one published question',
      p_exam_id
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_exam_publishable_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF TG_TABLE_NAME = 'exams' THEN
    PERFORM private.assert_exam_publishable(NEW.id);
  ELSE
    IF TG_OP <> 'INSERT' THEN
      PERFORM private.assert_exam_publishable(OLD.exam_id);
    END IF;
    IF TG_OP <> 'DELETE' THEN
      PERFORM private.assert_exam_publishable(NEW.exam_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER exams_validate_publishable
  AFTER INSERT OR UPDATE ON public.exams
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_exam_publishable_trigger();
CREATE CONSTRAINT TRIGGER exam_questions_validate_publishable
  AFTER INSERT OR UPDATE OR DELETE ON public.exam_questions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_exam_publishable_trigger();


-- Capture exam scoring settings at attempt creation. The client cannot choose
-- or modify the marks used for an attempt.
-- [SCHEMA GUIDE] Attempt creation enforces identity/retake rules, derives timing, and captures scoring settings.
CREATE OR REPLACE FUNCTION private.prepare_attempt_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_exam public.exams%ROWTYPE;
BEGIN
  IF NEW.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Attempts must start in progress'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT e.* INTO v_exam
  FROM public.exams AS e
  WHERE e.id = NEW.exam_id
    AND e.status = 'published'
    AND (e.start_at IS NULL OR e.start_at <= now())
    AND (e.end_at IS NULL OR e.end_at > now());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam is not available'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.user_id IS NULL AND NEW.guest_identity_hash IS NOT NULL THEN
    -- Permit retake only after an incomplete guest attempt has been inactive
    -- for 24 hours. A submitted attempt is never deleted by this rule.
    DELETE FROM public.exam_attempts AS old_attempt
    WHERE old_attempt.user_id IS NULL
      AND old_attempt.guest_identity_hash = NEW.guest_identity_hash
      AND old_attempt.exam_id = NEW.exam_id
      AND old_attempt.status <> 'submitted'
      AND old_attempt.last_activity_at <= now() - interval '24 hours';
  END IF;

  -- Timer values are server-derived; callers cannot extend an exam by
  -- supplying a later expires_at.
  NEW.started_at := COALESCE(NEW.started_at, now());
  NEW.last_activity_at := NEW.started_at;
  NEW.expires_at := NEW.started_at + make_interval(mins => v_exam.duration_minutes);
  IF v_exam.end_at IS NOT NULL THEN
    NEW.expires_at := LEAST(NEW.expires_at, v_exam.end_at);
  END IF;
  IF NEW.expires_at <= NEW.started_at THEN
    RAISE EXCEPTION 'Exam has no remaining time'
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.correct_marks_snapshot := v_exam.correct_marks;
  NEW.negative_marks_snapshot := v_exam.negative_marks;
  NEW.result_snapshot := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER exam_attempts_prepare_before_insert
  BEFORE INSERT ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION private.prepare_attempt_before_insert();

-- Freeze each question and its options when it enters an attempt. The snapshot
-- contains answer keys for server-side grading; direct client SELECT is revoked.
-- [SCHEMA GUIDE] Snapshot the selected exam's question/option content for the attempt.
CREATE OR REPLACE FUNCTION private.snapshot_attempt_question()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.question_id IS DISTINCT FROM OLD.question_id
      OR NEW.question_order IS DISTINCT FROM OLD.question_order
      OR NEW.question_snapshot IS DISTINCT FROM OLD.question_snapshot
    THEN
      RAISE EXCEPTION 'Attempt question snapshots are immutable'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  SELECT jsonb_build_object(
    'question_id', q.id,
    'prompt', q.prompt,
    'explanation', q.explanation,
    'language', q.language,
    'options', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'text', o.option_text,
          'option_order', o.option_order,
          'is_correct', o.is_correct
        ) ORDER BY o.option_order
      )
      FROM public.question_options AS o
      WHERE o.question_id = q.id
    ), '[]'::jsonb)
  )
  INTO NEW.question_snapshot
  FROM public.questions AS q
  WHERE q.id = NEW.question_id
    AND q.status = 'published';

  IF NEW.question_snapshot IS NULL
    OR jsonb_array_length(COALESCE(NEW.question_snapshot->'options', '[]'::jsonb)) <> 4
  THEN
    RAISE EXCEPTION 'Attempt questions must be published and have four options'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER attempt_questions_snapshot_guard
  BEFORE INSERT OR UPDATE ON public.attempt_questions
  FOR EACH ROW EXECUTE FUNCTION private.snapshot_attempt_question();

-- Enforce terminal attempt states and create an immutable result snapshot at
-- submission. Scoring uses the question and marks snapshots, never the live bank.
-- [SCHEMA GUIDE] Submission path validates completeness and persists the result snapshot.
CREATE OR REPLACE FUNCTION private.finalize_attempt_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_exam_end_at timestamptz;
  v_correct_count integer;
  v_incorrect_count integer;
  v_questions jsonb;
BEGIN
  IF OLD.status IN ('submitted', 'expired') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Submitted or expired attempts cannot change state'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.status = 'submitted' THEN
    IF NEW.result_snapshot IS DISTINCT FROM OLD.result_snapshot
      OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
    THEN
      RAISE EXCEPTION 'Submitted results are immutable'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'submitted' THEN
    SELECT e.end_at INTO v_exam_end_at
    FROM public.exams AS e
    WHERE e.id = NEW.exam_id;

    IF NEW.expires_at <= now()
      OR (v_exam_end_at IS NOT NULL AND v_exam_end_at <= now())
    THEN
      RAISE EXCEPTION 'Expired attempts cannot be submitted'
        USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.attempt_questions AS aq WHERE aq.attempt_id = NEW.id
    ) OR EXISTS (
      SELECT 1
      FROM public.attempt_questions AS aq
      WHERE aq.attempt_id = NEW.id
        AND NOT EXISTS (
          SELECT 1 FROM public.attempt_answers AS aa
          WHERE aa.attempt_id = aq.attempt_id AND aa.question_id = aq.question_id
        )
    ) THEN
      RAISE EXCEPTION 'Every question must be answered before submission'
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT
      count(*) FILTER (WHERE (selected_option->>'is_correct')::boolean),
      count(*) FILTER (WHERE NOT (selected_option->>'is_correct')::boolean),
      jsonb_agg(
        jsonb_build_object(
          'question_id', aq.question_snapshot->>'question_id',
          'question_order', aq.question_order,
          'prompt', aq.question_snapshot->>'prompt',
          'explanation', aq.question_snapshot->'explanation',
          'selected_option_id', aa.selected_option_id,
          'selected_option', selected.selected_option,
          'selected_is_correct', (selected.selected_option->>'is_correct')::boolean,
          'correct_option', correct.correct_option,
          'options', aq.question_snapshot->'options'
        ) ORDER BY aq.question_order
      )
    INTO v_correct_count, v_incorrect_count, v_questions
    FROM public.attempt_questions AS aq
    JOIN public.attempt_answers AS aa
      ON aa.attempt_id = aq.attempt_id AND aa.question_id = aq.question_id
    CROSS JOIN LATERAL (
      SELECT opt AS selected_option
      FROM jsonb_array_elements(aq.question_snapshot->'options') AS options(opt)
      WHERE opt->>'id' = aa.selected_option_id::text
      LIMIT 1
    ) AS selected
    CROSS JOIN LATERAL (
      SELECT opt AS correct_option
      FROM jsonb_array_elements(aq.question_snapshot->'options') AS options(opt)
      WHERE (opt->>'is_correct')::boolean
      LIMIT 1
    ) AS correct
    WHERE aq.attempt_id = NEW.id;

    IF v_correct_count IS NULL OR v_incorrect_count IS NULL THEN
      RAISE EXCEPTION 'Unable to grade this attempt'
        USING ERRCODE = 'check_violation';
    END IF;

    NEW.submitted_at := now();
    NEW.result_snapshot := jsonb_build_object(
      'attempt_id', NEW.id,
      'exam_id', NEW.exam_id,
      'submitted_at', NEW.submitted_at,
      'correct_count', v_correct_count,
      'incorrect_count', v_incorrect_count,
      'correct_marks', NEW.correct_marks_snapshot,
      'negative_marks', NEW.negative_marks_snapshot,
      'score', round(
        v_correct_count * NEW.correct_marks_snapshot
        - v_incorrect_count * NEW.negative_marks_snapshot,
        2
      ),
      'questions', COALESCE(v_questions, '[]'::jsonb)
    );
  ELSE
    NEW.result_snapshot := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER exam_attempts_finalize_before_update
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION private.finalize_attempt_before_update();

-- [SCHEMA GUIDE] Guard answer writes against invalid ownership, state, timing, and option/question combinations.
CREATE OR REPLACE FUNCTION private.guard_attempt_answer_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_status text;
  v_expires_at timestamptz;
  v_exam_end_at timestamptz;
BEGIN
  SELECT a.status, a.expires_at, e.end_at
    INTO v_status, v_expires_at, v_exam_end_at
  FROM public.exam_attempts AS a
  JOIN public.exams AS e ON e.id = a.exam_id
  WHERE a.id = NEW.attempt_id
  FOR UPDATE OF a;

  IF NOT FOUND OR v_status <> 'in_progress' THEN
    RAISE EXCEPTION 'Answers can only be changed on an in-progress attempt'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_expires_at <= now() OR (v_exam_end_at IS NOT NULL AND v_exam_end_at <= now()) THEN
    RAISE EXCEPTION 'The attempt or exam has expired'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.attempt_questions aq
    WHERE aq.attempt_id = NEW.attempt_id AND aq.question_id = NEW.question_id
  ) THEN
    RAISE EXCEPTION 'Question is not part of this attempt snapshot'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  UPDATE public.exam_attempts
  SET last_activity_at = now()
  WHERE id = NEW.attempt_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER attempt_answers_guard_write
  BEFORE INSERT OR UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION private.guard_attempt_answer_write();

CREATE OR REPLACE FUNCTION private.assert_attempt_complete_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.attempt_questions aq WHERE aq.attempt_id = NEW.id
    ) OR EXISTS (
      SELECT 1
      FROM public.attempt_questions aq
      WHERE aq.attempt_id = NEW.id
        AND NOT EXISTS (
          SELECT 1 FROM public.attempt_answers aa
          WHERE aa.attempt_id = aq.attempt_id AND aa.question_id = aq.question_id
        )
    ) THEN
      RAISE EXCEPTION 'Every question must be answered before submission'
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.submitted_at IS NULL THEN
      RAISE EXCEPTION 'submitted_at is required when submitting an attempt'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER exam_attempts_validate_submission
  AFTER UPDATE ON public.exam_attempts
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.assert_attempt_complete_trigger();

-- Results are revealed only after submission and only to the attempt owner
-- (authenticated attempts) or a guest presenting the raw bearer token.

-- Return only the server-filtered question payload during an active attempt.
-- The stored snapshot's is_correct fields are stripped before reaching clients.
-- [SCHEMA GUIDE] Attempt RPCs return only data permitted for the current attempt state.
CREATE OR REPLACE FUNCTION private.get_attempt_questions(
  p_attempt_id uuid,
  p_attempt_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_attempt record;
  v_questions jsonb;
BEGIN
  SELECT a.id, a.user_id, a.status, a.expires_at, a.last_activity_at,
         a.attempt_token_hash, a.exam_id
    INTO v_attempt
  FROM public.exam_attempts AS a
  WHERE a.id = p_attempt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not available' USING ERRCODE = 'P0001';
  END IF;

  IF v_attempt.user_id IS NOT NULL THEN
    IF auth.uid() IS DISTINCT FROM v_attempt.user_id THEN
      RAISE EXCEPTION 'Attempt not available' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_attempt_token IS NULL
    OR length(p_attempt_token) < 32
    OR v_attempt.attempt_token_hash <>
      encode(extensions.digest(p_attempt_token, 'sha256'), 'hex')
  THEN
    RAISE EXCEPTION 'Attempt not available' USING ERRCODE = 'P0001';
  END IF;

  IF v_attempt.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Attempt is not in progress' USING ERRCODE = 'P0001';
  END IF;

  IF v_attempt.expires_at <= now()
    OR EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = v_attempt.exam_id AND e.end_at IS NOT NULL AND e.end_at <= now()
    )
  THEN
    UPDATE public.exam_attempts SET status = 'expired' WHERE id = v_attempt.id;
    RETURN jsonb_build_object('status', 'expired', 'questions', '[]'::jsonb);
  END IF;

  IF v_attempt.last_activity_at <= now() - interval '24 hours' THEN
    UPDATE public.exam_attempts SET status = 'expired' WHERE id = v_attempt.id;
    IF v_attempt.user_id IS NULL THEN
      DELETE FROM public.exam_attempts WHERE id = v_attempt.id;
    ELSE
      DELETE FROM public.attempt_answers WHERE attempt_id = v_attempt.id;
      DELETE FROM public.attempt_questions WHERE attempt_id = v_attempt.id;
    END IF;
    RETURN jsonb_build_object('status', 'expired', 'questions', '[]'::jsonb);
  END IF;

  UPDATE public.exam_attempts SET last_activity_at = now() WHERE id = v_attempt.id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'question_id', aq.question_snapshot->'question_id',
      'question_order', aq.question_order,
      'prompt', aq.question_snapshot->'prompt',
      'language', aq.question_snapshot->'language',
      'options', COALESCE((
        SELECT jsonb_agg(
          opt - 'is_correct'
          ORDER BY (opt->>'option_order')::integer
        )
        FROM jsonb_array_elements(aq.question_snapshot->'options') AS options(opt)
      ), '[]'::jsonb),
      'selected_option_id', COALESCE((
        SELECT to_jsonb(aa.selected_option_id)
        FROM public.attempt_answers AS aa
        WHERE aa.attempt_id = aq.attempt_id AND aa.question_id = aq.question_id
      ), 'null'::jsonb)
    ) ORDER BY aq.question_order
  ), '[]'::jsonb)
  INTO v_questions
  FROM public.attempt_questions AS aq
  WHERE aq.attempt_id = v_attempt.id;

  RETURN jsonb_build_object(
    'status', 'in_progress',
    'expires_at', v_attempt.expires_at,
    'questions', v_questions
  );
END;
$$;

-- Public Question Bank answer reveal is intentional, but only for published rows.
-- [SCHEMA GUIDE] Public Question Bank answer reveal is separate from active-exam answer access.
CREATE OR REPLACE FUNCTION private.get_published_question_answer(p_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'question_id', q.id,
    'prompt', q.prompt,
    'explanation', q.explanation,
    'options', (
      SELECT jsonb_agg(
        jsonb_build_object('id', o.id, 'text', o.option_text, 'option_order', o.option_order)
        ORDER BY o.option_order
      )
      FROM public.question_options AS o
      WHERE o.question_id = q.id
    ),
    'correct_option', (
      SELECT jsonb_build_object('id', o.id, 'text', o.option_text)
      FROM public.question_options AS o
      WHERE o.question_id = q.id AND o.is_correct
    )
  )
  INTO v_result
  FROM public.questions AS q
  WHERE q.id = p_question_id AND q.status = 'published';

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Question not available' USING ERRCODE = 'P0001';
  END IF;

  RETURN v_result;
END;
$$;

-- Admin-only question detail RPC supplies fields that are deliberately not
-- granted as direct SELECT columns to ordinary authenticated clients.
-- [SCHEMA GUIDE] Admin detail access is mediated through a guarded RPC, not broad direct column access.
CREATE OR REPLACE FUNCTION private.admin_get_question_details(p_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin'
  THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'question_id', q.id,
    'topic_id', q.topic_id,
    'prompt', q.prompt,
    'explanation', q.explanation,
    'language', q.language,
    'status', q.status,
    'options', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', o.id, 'text', o.option_text,
          'option_order', o.option_order, 'is_correct', o.is_correct
        ) ORDER BY o.option_order
      )
      FROM public.question_options AS o
      WHERE o.question_id = q.id
    )
  )
  INTO v_result
  FROM public.questions AS q
  WHERE q.id = p_question_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Question not available' USING ERRCODE = 'P0001';
  END IF;

  RETURN v_result;
END;
$$;



-- Admin retake reset is explicit, reasoned, and auditable.
-- [SCHEMA GUIDE] Admin reset workflow records an explicit reason and audit event.
CREATE OR REPLACE FUNCTION private.admin_reset_exam_attempt(
  p_attempt_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_attempt record;
BEGIN
  IF auth.uid() IS NULL
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin'
  THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_reason IS NULL OR length(btrim(p_reason)) < 5 OR length(btrim(p_reason)) > 1000 THEN
    RAISE EXCEPTION 'A reset reason between 5 and 1000 characters is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT a.id, a.exam_id, a.status
    INTO v_attempt
  FROM public.exam_attempts AS a
  WHERE a.id = p_attempt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.exam_attempt_admin_resets
    (attempt_id, exam_id, actor_user_id, previous_status, reason)
  VALUES
    (v_attempt.id, v_attempt.exam_id, auth.uid(), v_attempt.status, btrim(p_reason));

  DELETE FROM public.exam_attempts WHERE id = v_attempt.id;

  RETURN jsonb_build_object(
    'reset', true,
    'attempt_id', v_attempt.id,
    'exam_id', v_attempt.exam_id
  );
END;
$$;

-- Submitted results are read exclusively from the immutable result snapshot.
CREATE OR REPLACE FUNCTION private.get_attempt_result(
  p_attempt_id uuid,
  p_attempt_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_attempt record;
BEGIN
  SELECT a.id, a.user_id, a.status, a.submitted_at,
         a.attempt_token_hash, a.result_snapshot
    INTO v_attempt
  FROM public.exam_attempts AS a
  WHERE a.id = p_attempt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Result not available' USING ERRCODE = 'P0001';
  END IF;

  IF v_attempt.user_id IS NOT NULL THEN
    IF auth.uid() IS DISTINCT FROM v_attempt.user_id THEN
      RAISE EXCEPTION 'Result not available' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_attempt_token IS NULL
    OR length(p_attempt_token) < 32
    OR v_attempt.attempt_token_hash <>
      encode(extensions.digest(p_attempt_token, 'sha256'), 'hex')
  THEN
    RAISE EXCEPTION 'Result not available' USING ERRCODE = 'P0001';
  END IF;

  IF v_attempt.status <> 'submitted' OR v_attempt.result_snapshot IS NULL THEN
    RAISE EXCEPTION 'Result not available' USING ERRCODE = 'P0001';
  END IF;

  RETURN v_attempt.result_snapshot;
END;
$$;

-- Public API wrappers run with caller privileges. The privileged implementations
-- live in the non-exposed private schema, keeping SECURITY DEFINER code off the API.
CREATE OR REPLACE FUNCTION public.get_attempt_questions(
  p_attempt_id uuid,
  p_attempt_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT private.get_attempt_questions($1, $2); $$;

CREATE OR REPLACE FUNCTION public.get_published_question_answer(p_question_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT private.get_published_question_answer($1); $$;

CREATE OR REPLACE FUNCTION public.admin_get_question_details(p_question_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT private.admin_get_question_details($1); $$;

CREATE OR REPLACE FUNCTION public.admin_reset_exam_attempt(p_attempt_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT private.admin_reset_exam_attempt($1, $2); $$;

CREATE OR REPLACE FUNCTION public.get_attempt_result(
  p_attempt_id uuid,
  p_attempt_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT private.get_attempt_result($1, $2); $$;

REVOKE ALL ON FUNCTION public.get_attempt_result(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_attempt_result(uuid, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_attempt_questions(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_attempt_questions(uuid, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_published_question_answer(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_published_question_answer(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_question_details(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_question_details(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_reset_exam_attempt(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_exam_attempt(uuid, text) TO authenticated;


-- [SCHEMA GUIDE] Periodic maintenance expires timed-out attempts and removes stale incomplete guest payloads.
CREATE OR REPLACE FUNCTION private.cleanup_expired_attempts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_expired_count integer;
  v_deleted_guest_count integer;
BEGIN
  -- Expire by timer/exam schedule immediately, but retain incomplete payload
  -- until 24 hours after last activity.
  UPDATE public.exam_attempts AS a
  SET status = 'expired'
  FROM public.exams AS e
  WHERE e.id = a.exam_id
    AND a.status = 'in_progress'
    AND (
      a.last_activity_at <= now() - interval '24 hours'
      OR a.expires_at <= now()
      OR (e.end_at IS NOT NULL AND e.end_at <= now())
    );

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  DELETE FROM public.attempt_answers AS aa
  USING public.exam_attempts AS a
  WHERE aa.attempt_id = a.id
    AND a.status = 'expired'
    AND a.last_activity_at <= now() - interval '24 hours';

  DELETE FROM public.attempt_questions AS aq
  USING public.exam_attempts AS a
  WHERE aq.attempt_id = a.id
    AND a.status = 'expired'
    AND a.last_activity_at <= now() - interval '24 hours';

  -- Incomplete guest attempts are removed entirely after 24h inactivity,
  -- which releases the guest+exam uniqueness key. Submitted attempts persist.
  DELETE FROM public.exam_attempts AS a
  WHERE a.user_id IS NULL
    AND a.status = 'expired'
    AND a.last_activity_at <= now() - interval '24 hours';

  GET DIAGNOSTICS v_deleted_guest_count = ROW_COUNT;
  RETURN v_expired_count + v_deleted_guest_count;
END;
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon, authenticated;
-- Invoker wrappers require permission to call these guarded implementations.
-- The private schema must remain absent from the Supabase Data API exposed-schema list.
GRANT USAGE ON SCHEMA private TO postgres, service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_attempt_questions(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_attempt_result(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_published_question_answer(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.admin_get_question_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_reset_exam_attempt(uuid, text) TO authenticated;

-- [SCHEMA GUIDE] Enable RLS and generate admin write policies for the declared table set.
DO $$
DECLARE
  v_table text;
  v_tables text[] := ARRAY[
    'subjects', 'topics', 'questions', 'question_options',
    'exam_categories', 'exams', 'exam_questions',
    'exam_attempts', 'exam_attempt_admin_resets', 'attempt_questions', 'attempt_answers',
    'question_bookmarks', 'question_reports'
  ];
  v_admin_predicate text :=
    '((SELECT auth.jwt()) -> ''app_metadata'' ->> ''role'') = ''admin''';
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);

    IF v_table = 'exam_attempt_admin_resets' THEN
      EXECUTE format(
        'CREATE POLICY admin_full_access ON public.%I FOR ALL TO authenticated
         USING (%s) WITH CHECK (%s)',
        v_table, v_admin_predicate, v_admin_predicate
      );
    ELSIF v_table NOT IN ('question_bookmarks', 'question_reports') THEN
      -- Keep admin write access separate from SELECT policies so SELECT access
      -- can be combined with the existing public/owner policy without overlap.
      EXECUTE format(
        'CREATE POLICY admin_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
        v_table, v_admin_predicate
      );
      EXECUTE format(
        'CREATE POLICY admin_update ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
        v_table, v_admin_predicate, v_admin_predicate
      );
      EXECUTE format(
        'CREATE POLICY admin_delete ON public.%I FOR DELETE TO authenticated USING (%s)',
        v_table, v_admin_predicate
      );
    ELSE
      -- Bookmark/report access is merged into the existing owner policies below.
      NULL;
    END IF;
  END LOOP;
END;
$$;

-- [SCHEMA GUIDE] RLS policy map: public reads are limited to published content; owners
-- read their own attempts/bookmarks/reports; admin writes require app_metadata.role = 'admin'.
CREATE POLICY public_read_subjects ON public.subjects
  FOR SELECT TO anon, authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.topics t
    JOIN public.questions q ON q.topic_id = t.id
    WHERE t.subject_id = subjects.id AND q.status = 'published'
  )) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY public_read_topics ON public.topics
  FOR SELECT TO anon, authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.topic_id = topics.id AND q.status = 'published'
  )) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY public_read_questions ON public.questions
  FOR SELECT TO anon, authenticated USING (status = 'published' OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY public_read_question_options ON public.question_options
  FOR SELECT TO anon, authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.id = question_options.question_id AND q.status = 'published'
  )) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY public_read_exam_categories ON public.exam_categories
  FOR SELECT TO anon, authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.category_id = exam_categories.id AND e.status = 'published'
  )) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY public_read_exams ON public.exams
  FOR SELECT TO anon, authenticated USING (status = 'published' OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY public_read_exam_questions ON public.exam_questions
  FOR SELECT TO anon, authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.exams e
    JOIN public.questions q ON q.id = exam_questions.question_id
    WHERE e.id = exam_questions.exam_id
      AND e.status = 'published' AND q.status = 'published'
  )) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY users_read_own_attempts ON public.exam_attempts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY users_read_own_attempt_questions ON public.attempt_questions
  FOR SELECT TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.exam_attempts a
    WHERE a.id = attempt_questions.attempt_id AND a.user_id = (SELECT auth.uid())
  )) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY users_read_own_answers ON public.attempt_answers
  FOR SELECT TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.exam_attempts a
    WHERE a.id = attempt_answers.attempt_id AND a.user_id = (SELECT auth.uid())
  )) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY users_manage_own_bookmarks ON public.question_bookmarks
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (user_id = (SELECT auth.uid()) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY users_read_own_reports ON public.question_reports
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY users_create_own_reports ON public.question_reports
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY admin_update_reports ON public.question_reports
  FOR UPDATE TO authenticated USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- [SCHEMA GUIDE] SQL privileges complement RLS: column-level grants keep sensitive answer-key
-- and attempt-snapshot fields unavailable through ordinary client table queries.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.subjects, public.topics, public.exam_categories,
  public.exams, public.exam_questions TO anon, authenticated;
REVOKE SELECT ON public.questions FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, topic_id, prompt, language, status, created_at)
  ON public.questions TO anon, authenticated;
REVOKE ALL ON public.question_options FROM anon, authenticated;
GRANT SELECT (id, question_id, option_text, option_order)
  ON public.question_options TO anon, authenticated;

GRANT SELECT ON public.exam_attempts, public.attempt_answers TO authenticated;
GRANT SELECT ON public.exam_attempt_admin_resets TO authenticated;
REVOKE ALL ON public.attempt_questions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.exam_attempts, public.attempt_questions, public.attempt_answers TO service_role;
GRANT ALL ON public.exam_attempts, public.attempt_questions, public.attempt_answers TO service_role;
GRANT SELECT, INSERT, DELETE ON public.question_bookmarks TO authenticated;
GRANT SELECT, INSERT ON public.question_reports TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.subjects, public.topics, public.questions,
  public.exam_categories, public.exams, public.exam_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.question_options TO authenticated;
GRANT UPDATE ON public.question_reports TO authenticated;

-- [SCHEMA GUIDE] Operational scheduling: run stale-attempt cleanup every 15 minutes.
-- Before reapplying in a test environment, check pg_cron for an existing job with this name.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.schedule(
  'careerotic-attempt-cleanup',
  '*/15 * * * *',
  'SELECT private.cleanup_expired_attempts();'
);
