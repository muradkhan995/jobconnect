# Sequence Diagrams

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Components | [06-architecture/02-c4-diagrams.md](../06-architecture/02-c4-diagrams.md) |

## 1. Sign up and email verification ✅

```mermaid
sequenceDiagram
  autonumber
  actor U as Visitor
  participant B as Browser
  participant P as Proxy
  participant A as Better Auth (/api/auth)
  participant H as HIBP
  participant DB as PostgreSQL
  participant M as SMTP (Mailpit)
  U->>B: fill /register
  B->>P: POST /api/auth/sign-up/email (Origin)
  P->>P: CSRF Origin check, request id
  P->>A: forward
  A->>A: rate limit (10/min, DB) · password length
  A->>H: SHA-1 prefix (5 chars)
  H-->>A: matching suffixes
  A->>A: checkSignup(role ≠ ADMIN, current policy)
  A->>DB: insert user (UUIDv7, Argon2id hash) + audit auth.signup
  A->>M: "Confirm your JobConnect email address" (24 h link)
  A-->>B: 200 (same answer if email exists – owner emailed instead)
  B->>U: /check-email
  U->>A: GET /api/auth/verify-email?token=…
  A->>DB: email_verified = true
  A-->>U: 302 /login?verified=1
```

## 2. Log in to a protected page ✅

```mermaid
sequenceDiagram
  autonumber
  actor U as Candidate
  participant P as Proxy
  participant A as Better Auth
  participant DB as PostgreSQL
  participant Pg as Page (/jobs/[id])
  U->>Pg: "Log in to apply" → /login?next=/jobs/123
  U->>A: POST /api/auth/sign-in/email
  A->>DB: session.create.before – user ACTIVE?
  alt suspended / unverified / wrong password
    A-->>U: 403 / 401 (generic) + audit auth.login_failed
  else ok
    A->>DB: insert session + audit auth.login
    A-->>U: Set-Cookie (HttpOnly, SameSite=Lax, Secure in prod)
    U->>U: full page load to safeNext("/jobs/123")
    U->>P: GET /jobs/123
    P->>DB: isJobVisible(123)?
    P-->>U: page (or real 404)
  end
```

## 3. Admin decides on a company ✅

```mermaid
sequenceDiagram
  autonumber
  actor S as Admin
  participant P as Proxy
  participant R as apiRoute
  participant Svc as company service
  participant DB as PostgreSQL
  participant M as SMTP
  S->>P: POST /api/v1/admin/companies/{id}/reject {reason}
  P->>P: Origin check · /admin gate needs ADMIN session
  P->>R: forward
  R->>R: session (401) · role ADMIN (403) · Zod body (400)
  R->>Svc: decideCompany(admin, id, "reject", reason)
  Svc->>DB: read company (status must be PENDING else 409)
  rect rgb(240,240,240)
    Svc->>DB: BEGIN
    Svc->>DB: UPDATE … WHERE id AND status = PENDING
    alt 0 rows (someone else decided)
      Svc-->>R: 409 STATE_CHANGED (rollback)
    end
    Svc->>DB: INSERT audit_log company.rejected
    Svc->>DB: COMMIT
  end
  Svc-->>R: company
  R-->>S: 200
  Svc-)M: decision email in background (D-28), logged
```

## 4. Employer submits → admin approves a job ✅

```mermaid
sequenceDiagram
  autonumber
  actor E as Employer
  actor S as Admin
  participant J as job service
  participant DB as PostgreSQL
  participant M as SMTP
  E->>J: POST /employer/jobs/{id}/submit
  J->>DB: own job? (else 404) · status DRAFT? · company VERIFIED? · deadline 1–90 d?
  J->>DB: guarded UPDATE → PENDING_APPROVAL, submitted_at
  J-->>E: 200 "Waiting for approval"
  S->>J: POST /admin/jobs/{id}/approve
  J->>DB: company still VERIFIED? (else 422)
  J->>DB: tx: guarded UPDATE → PUBLISHED, published_at + audit job.approved
  J-->>S: 200
  J-)M: "Your job is live" (background)
```

## 5. Public search ✅

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitor
  participant Pg as /jobs page (server)
  participant S as searchJobs
  participant DB as PostgreSQL
  V->>Pg: GET /jobs?q=nurse&location=leeds&workMode=REMOTE
  Pg->>S: parseSearchParams (lenient: bad values dropped)
  par page of results
    S->>DB: SELECT … WHERE VISIBLE_JOB AND search_vector @@ websearch_to_tsquery($q) AND location ILIKE $loc … ORDER BY published_at DESC, id DESC LIMIT 21
  and total
    S->>DB: SELECT count(*) … same WHERE
  end
  DB-->>S: rows (GIN index job_search_idx)
  S-->>Pg: items, nextCursor, total
  Pg-->>V: HTML (works without JavaScript)
```

## 6. Apply for a job ⬜ (sprint S3 – design)

```mermaid
sequenceDiagram
  autonumber
  actor C as Candidate
  participant Ap as application service
  participant DB as PostgreSQL
  participant OS as Object storage
  C->>Ap: POST /candidate/applications {jobId, cvId, coverLetter}
  Ap->>DB: job visible? deadline? already applied? (UNIQUE job_id, candidate_id)
  Ap->>OS: copy CV → immutable snapshot (BR-APP-003)
  Ap->>DB: tx: insert application APPLIED + status history
  Ap-->>C: 201 "Application sent"
```
