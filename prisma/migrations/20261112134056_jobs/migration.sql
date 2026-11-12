-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'PAUSED', 'REJECTED', 'CLOSED', 'REMOVED');

-- CreateEnum
CREATE TYPE "work_mode" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "job_type" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "experience_level" AS ENUM ('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD');

-- CreateEnum
CREATE TYPE "salary_period" AS ENUM ('YEAR', 'DAY', 'HOUR');

-- CreateTable
CREATE TABLE "job" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "location" TEXT,
    "work_mode" "work_mode" NOT NULL,
    "job_type" "job_type" NOT NULL,
    "experience_level" "experience_level" NOT NULL,
    "industry_id" UUID NOT NULL,
    "salary_min" INTEGER NOT NULL,
    "salary_max" INTEGER NOT NULL,
    "salary_period" "salary_period" NOT NULL DEFAULT 'YEAR',
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "deadline" TIMESTAMPTZ(3) NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'DRAFT',
    "status_reason" TEXT,
    "submitted_at" TIMESTAMPTZ(3),
    "published_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_company_id_created_at_idx" ON "job"("company_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: rules and indexes Prisma cannot express (docs/05-design/01-data-model.md §4–5).
-- ---------------------------------------------------------------------------

-- BR-JOB-003: salary range is valid.
ALTER TABLE "job" ADD CONSTRAINT "job_salary_range"
  CHECK ("salary_min" >= 0 AND "salary_min" <= "salary_max");

-- BR-JOB-010: location is required unless the job is remote.
ALTER TABLE "job" ADD CONSTRAINT "job_location_unless_remote"
  CHECK ("work_mode" = 'REMOTE' OR "location" IS NOT NULL);

-- BR-JOB-008 / FR-ADM-010: rejection and removal always carry a reason.
ALTER TABLE "job" ADD CONSTRAINT "job_status_reason"
  CHECK ("status" NOT IN ('REJECTED', 'REMOVED') OR "status_reason" IS NOT NULL);

-- A published job knows when it was published.
ALTER TABLE "job" ADD CONSTRAINT "job_published_at"
  CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);

ALTER TABLE "job" ADD CONSTRAINT "job_title_length"
  CHECK (char_length("title") BETWEEN 3 AND 120);

ALTER TABLE "job" ADD CONSTRAINT "job_currency_gbp"
  CHECK ("currency" = 'GBP');

-- Admin approval queue, oldest first (FR-ADM-009): small partial index.
CREATE INDEX "job_pending_queue_idx" ON "job" ("submitted_at")
  WHERE "status" = 'PENDING_APPROVAL';

-- Public search orders published jobs newest first (docs/05-design/01-data-model.md §5 Q1; used from sprint S2).
CREATE INDEX "job_published_idx" ON "job" ("published_at" DESC)
  WHERE "status" = 'PUBLISHED';
