-- Full-text search over published jobs (FR-CAN-006, NFR-PERF-001, docs/05-design/01-data-model.md §5 Q1).
--
-- docs/05-design/01-data-model.md planned a generated `search_vector` column. Prisma cannot model generated columns,
-- so the schema-drift check would flag it forever. An expression index on an IMMUTABLE
-- function gives the same speed and keeps the Prisma schema honest (decision D-24).
-- Queries MUST call job_search_document(...) with exactly these arguments to use the index.

CREATE FUNCTION job_search_document(title text, requirements text, description text)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
RETURN
  setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english'::regconfig, coalesce(requirements, '')), 'B') ||
  setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'C');

-- Only published jobs are ever searched (BR-JOB-001), so the index covers only those.
CREATE INDEX "job_search_idx" ON "job"
  USING GIN (job_search_document("title", "requirements", "description"))
  WHERE "status" = 'PUBLISHED';
