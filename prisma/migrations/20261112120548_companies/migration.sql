-- CreateEnum
CREATE TYPE "company_size" AS ENUM ('SIZE_1_10', 'SIZE_11_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_500_PLUS');

-- CreateEnum
CREATE TYPE "company_status" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "industry" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "industry_id" UUID NOT NULL,
    "size" "company_size" NOT NULL,
    "website" TEXT,
    "location" TEXT NOT NULL,
    "logo_key" TEXT,
    "verification_status" "company_status" NOT NULL DEFAULT 'PENDING',
    "status_reason" TEXT,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ(3),
    "verified_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industry_name_key" ON "industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_owner_user_id_key" ON "company"("owner_user_id");

-- CreateIndex
CREATE INDEX "company_verification_status_submitted_at_idx" ON "company"("verification_status", "submitted_at");

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: constraints Prisma cannot express, and seed data.
-- ---------------------------------------------------------------------------

-- Rejection and suspension always carry a reason shown to the employer (BR-CMP-002).
ALTER TABLE "company"
  ADD CONSTRAINT "company_status_reason"
  CHECK ("verification_status" NOT IN ('REJECTED', 'SUSPENDED') OR "status_reason" IS NOT NULL);

-- A verified company records when it was verified.
ALTER TABLE "company"
  ADD CONSTRAINT "company_verified_at"
  CHECK ("verification_status" <> 'VERIFIED' OR "verified_at" IS NOT NULL);

-- Website, when given, is an https URL (also validated in the app).
ALTER TABLE "company"
  ADD CONSTRAINT "company_website_https"
  CHECK ("website" IS NULL OR "website" ~ '^https://');

-- Starting list of industries (FR-ADM-014: seeded, editable by admins later).
INSERT INTO "industry" ("id", "name", "updated_at") VALUES
  ('01a1cd0d-dc00-7a7b-a129-3bc02dd5503d', 'Accounting & Finance', now()),
  ('01a1cd0d-dc01-7a33-b0aa-4fb4100ec2cf', 'Construction & Property', now()),
  ('01a1cd0d-dc02-747e-93b7-2132f7e5d2af', 'Creative & Design', now()),
  ('01a1cd0d-dc03-75b1-b2d7-8da8ed28e5a1', 'Education & Training', now()),
  ('01a1cd0d-dc04-73a5-a838-4906dc1155d6', 'Engineering & Manufacturing', now()),
  ('01a1cd0d-dc05-72d5-9fa4-79f29d72cd7f', 'Healthcare', now()),
  ('01a1cd0d-dc06-7984-a6bf-8a67e5e4553b', 'Hospitality & Tourism', now()),
  ('01a1cd0d-dc07-78b7-898d-42f24fd57db7', 'Information Technology', now()),
  ('01a1cd0d-dc08-730d-a3f6-36f194ca48b3', 'Legal', now()),
  ('01a1cd0d-dc09-7e6e-965f-d9cbbc47cb30', 'Logistics & Transport', now()),
  ('01a1cd0d-dc0a-718e-a3ef-0bbb69e799cf', 'Marketing & Sales', now()),
  ('01a1cd0d-dc0b-759a-ae36-2633a1612b3a', 'Public Sector & Charity', now()),
  ('01a1cd0d-dc0c-7b18-8bf5-d80876cfe5c7', 'Retail', now());
