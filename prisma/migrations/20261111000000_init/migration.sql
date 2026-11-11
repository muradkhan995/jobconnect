-- Base database conventions (docs/09-data-model.md §1).

-- Case-insensitive text for emails (FR-AUTH-004).
CREATE EXTENSION IF NOT EXISTS citext;

-- Store and compare timestamps in UTC, whatever the server or client default is.
-- Applies to every new session, including ones opened through a connection pooler.
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'UTC');
END
$$;
