-- Stored search document for jobs (docs/09 §3.6, NFR-PERF-001).
--
-- Replaces the expression index from …_job_search: measured with 10,000 jobs, a plan that
-- skipped that index recomputed to_tsvector for every row (keyword search p95 463 ms, limit 500).
-- A STORED generated column computes the document once, on write.
-- Prisma models it as Unsupported("tsvector") and never writes it (decision D-24).

DROP INDEX "job_search_idx";

ALTER TABLE "job" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (job_search_document("title", "requirements", "description")) STORED;

-- Only published jobs are searched (BR-JOB-001).
CREATE INDEX "job_search_idx" ON "job" USING GIN ("search_vector") WHERE "status" = 'PUBLISHED';
