-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CANDIDATE', 'EMPLOYER', 'ADMIN');

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_user_id" UUID,
    "actor_role" "user_role",
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" UUID,
    "ip_address" INET,
    "request_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_occurred_at_idx" ON "audit_log"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_target_type_target_id_idx" ON "audit_log"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_user_id_idx" ON "audit_log"("actor_user_id");

-- ---------------------------------------------------------------------------
-- Append-only enforcement (FR-ADM-021) and retention (BR-AUD-001).
-- Written by hand: Prisma cannot express triggers or CHECK constraints.
-- ---------------------------------------------------------------------------

-- Actions are dotted lower-case names, e.g. "auth.login_failed", "company.verified".
ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_action_format"
  CHECK ("action" ~ '^[a-z][a-z_]*(\.[a-z][a-z_]*)+$');

-- The database's clock decides when an event happened; callers cannot back- or future-date it.
CREATE FUNCTION audit_log_stamp_time() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.occurred_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER audit_log_stamp_time
  BEFORE INSERT ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_stamp_time();

-- Entries are never changed. Only entries older than 24 months may be deleted, which is
-- what the daily retention job does; deleting anything newer is an error.
CREATE FUNCTION audit_log_protect() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_log is append-only: UPDATE is not allowed'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.occurred_at >= now() - interval '24 months' THEN
    RAISE EXCEPTION 'audit_log entries younger than 24 months cannot be deleted'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN OLD;
END
$$;

CREATE TRIGGER audit_log_protect_rows
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_protect();

CREATE FUNCTION audit_log_block_truncate() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: TRUNCATE is not allowed'
    USING ERRCODE = 'insufficient_privilege';
END
$$;

CREATE TRIGGER audit_log_block_truncate
  BEFORE TRUNCATE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_truncate();
