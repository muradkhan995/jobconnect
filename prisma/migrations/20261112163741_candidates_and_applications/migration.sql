-- CreateEnum
CREATE TYPE "scan_status" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "candidate_profile" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "headline" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "candidate_profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "cv" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "scan_status" "scan_status" NOT NULL DEFAULT 'SKIPPED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "candidate_id" UUID,
    "cv_storage_key" TEXT,
    "cv_original_filename" TEXT,
    "cv_mime_type" TEXT,
    "cv_size_bytes" INTEGER,
    "cover_letter" TEXT,
    "status" "application_status" NOT NULL DEFAULT 'APPLIED',
    "applied_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymised_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "from_status" "application_status",
    "to_status" "application_status" NOT NULL,
    "changed_by_user_id" UUID,
    "message" TEXT,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cv_storage_key_key" ON "cv"("storage_key");

-- CreateIndex
CREATE INDEX "cv_candidate_id_created_at_idx" ON "cv"("candidate_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "application_candidate_id_applied_at_idx" ON "application"("candidate_id", "applied_at" DESC);

-- CreateIndex
CREATE INDEX "application_job_id_applied_at_idx" ON "application"("job_id", "applied_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "application_job_id_candidate_id_key" ON "application"("job_id", "candidate_id");

-- CreateIndex
CREATE INDEX "application_status_history_application_id_changed_at_idx" ON "application_status_history"("application_id", "changed_at");

-- AddForeignKey
ALTER TABLE "candidate_profile" ADD CONSTRAINT "candidate_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv" ADD CONSTRAINT "cv_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profile"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: rules Prisma cannot express (docs/05-design/01-data-model.md §4).
-- ---------------------------------------------------------------------------

-- FR-CAN-005: CVs are PDF or DOCX and at most 5 MB.
ALTER TABLE "cv" ADD CONSTRAINT "cv_mime_type"
  CHECK ("mime_type" IN ('application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
ALTER TABLE "cv" ADD CONSTRAINT "cv_size_bytes" CHECK ("size_bytes" > 0 AND "size_bytes" <= 5242880);

-- Cover letters are at most 5,000 characters.
ALTER TABLE "application" ADD CONSTRAINT "application_cover_letter_length"
  CHECK ("cover_letter" IS NULL OR char_length("cover_letter") <= 5000);

-- A live application always has its candidate and CV snapshot; only anonymisation removes them.
ALTER TABLE "application" ADD CONSTRAINT "application_cv_snapshot"
  CHECK ("anonymised_at" IS NOT NULL OR ("candidate_id" IS NOT NULL AND "cv_storage_key" IS NOT NULL));
