# JobConnect – Data Model

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 2 – Design |
| Status | Proposed – awaiting Product Owner sign-off |
| Last updated | 2026-11-11 |

Scope: tables needed for the **MVP** (`07-mvp-definition.md`), plus columns that are cheap to add now
and expensive later. Release 1.0 tables are listed in §8 but not designed in detail.

---

## 1. Conventions

| Topic | Convention | Why |
|---|---|---|
| Primary keys | `id uuid`, **UUIDv7** generated in the app | Not guessable in URLs (unlike 1, 2, 3…); time-ordered so indexes stay compact; no dependency on a specific Postgres version |
| Timestamps | `timestamptz`, stored and compared in **UTC**; DB timezone set to UTC | Avoids silent off-by-hours bugs around BST/GMT |
| Every table | `created_at`, `updated_at` (set by Prisma `@default(now())` / `@updatedAt`) | Debugging and admin views |
| Names | `snake_case` tables/columns in Postgres; Prisma maps to `camelCase` in code | Postgres convention |
| Status fields | Postgres `enum` types | DB rejects unknown values |
| Emails | `citext` (case-insensitive text) | `Amira@x.com` and `amira@x.com` are the same user (FR-AUTH-004) |
| Deletion | **Hard delete + anonymise**, no soft-delete flags | GDPR erasure (NFR-PRV-003) means data must really go |
| Money | Integer, whole pounds, plus a `salary_period` (YEAR / DAY / HOUR) | No floating-point rounding; day rates fit contract jobs; currency column kept for later |

## 2. Entity-Relationship Overview

```
                 ┌──────────────┐
                 │     user     │  role: CANDIDATE | EMPLOYER | ADMIN
                 └──────┬───────┘
          1:1 ┌─────────┴──────────┐ 1:1
              ▼                    ▼
   ┌──────────────────┐     ┌─────────────┐        ┌────────────┐
   │ candidate_profile│     │   company   │ N:1 ──▶│  industry  │
   └───┬──────────┬───┘     └──────┬──────┘        └────────────┘
   1:N │          │ 1:N         1:N│                     ▲
       ▼          │                ▼                     │ N:1
   ┌──────┐       │           ┌─────────┐                │
   │  cv  │       │           │   job   │────────────────┘
   └──────┘       │           └────┬────┘
                  │  N:1           │ 1:N
                  └──────▶ ┌───────▼───────┐ 1:N ┌────────────────────────────┐
                           │  application  │────▶│ application_status_history │
                           └───────────────┘     └────────────────────────────┘

   audit_log      – no foreign keys (must survive user deletion, never updated)
   session / account / verification – owned by Better Auth (§3.9)
```

## 3. Tables

### 3.1 `user`
| Column | Type | Rules |
|---|---|---|
| id | uuid PK | |
| name | text | NOT NULL – display name (required by Better Auth); the candidate's full name also lives on `candidate_profile` |
| email | citext | **UNIQUE**, NOT NULL |
| email_verified | boolean | default false (FR-AUTH-006). **This is the "UNVERIFIED" state** of BR §1 |
| role | enum `user_role` | CANDIDATE, EMPLOYER, ADMIN – never ADMIN via signup (FR-AUTH-002) |
| status | enum `user_status` | ACTIVE, SUSPENDED, DELETED. UNVERIFIED is not a status value: it is `email_verified = false`, so verification has one source of truth (changed 2026-11-12) |
| status_reason | text | NULL; required when SUSPENDED (FR-ADM-006) – CHECK |
| privacy_consent_at | timestamptz | NOT NULL (NFR-PRV-002) |
| privacy_policy_version | text | NOT NULL – which policy version they accepted |
| deleted_at | timestamptz | Set when user requests deletion; erasure job runs within 30 days |

`CHECK (status <> 'SUSPENDED' OR status_reason IS NOT NULL)`

### 3.2 `candidate_profile`
| Column | Type | Rules |
|---|---|---|
| user_id | uuid PK, FK → user | 1:1; `ON DELETE CASCADE` |
| full_name | text | NOT NULL |
| headline | text | NULL |
| location | text | NULL |
| phone | text | NULL |

Education, employment history and skills (FR-CAN-002/003/004) are **Release 1.0** – see §8.

### 3.3 `cv`
| Column | Type | Rules |
|---|---|---|
| id | uuid PK | |
| candidate_id | uuid FK → candidate_profile | `ON DELETE CASCADE` |
| storage_key | text | UNIQUE; random key in private bucket – never the original filename |
| original_filename | text | Shown to the user only |
| mime_type | text | `application/pdf` or DOCX type – CHECK |
| size_bytes | integer | CHECK `> 0 AND <= 5242880` (5 MB, FR-CAN-005) |
| scan_status | enum `scan_status` | PENDING, CLEAN, INFECTED, SKIPPED – MVP writes SKIPPED (§5.2 of architecture doc) |

**Max 5 CVs per candidate** is checked in the service inside a transaction that first locks the candidate's
`candidate_profile` row (`SELECT … FOR UPDATE`), so two uploads at the same moment cannot both pass.

### 3.4 `industry`
| Column | Type | Rules |
|---|---|---|
| id | uuid PK | |
| name | text | UNIQUE |
| is_active | boolean | default true – deactivated, never deleted, because jobs reference it (FR-ADM-014) |

Seeded by a migration; editable by admins.

### 3.5 `company`
| Column | Type | Rules |
|---|---|---|
| id | uuid PK | |
| owner_user_id | uuid FK → user | **UNIQUE** – one company per employer in this release (FR-EMP-005 is Won't). NULL only after the owner's account is erased (BR-USR-004); `ON DELETE SET NULL` |
| name | text | NOT NULL |
| description | text | NOT NULL |
| industry_id | uuid FK → industry | `ON DELETE RESTRICT` |
| size | enum `company_size` | `1-10`, `11-50`, `51-200`, `201-500`, `500+` |
| website | text | NULL; must be `https://` URL (validated in app) |
| location | text | NOT NULL |
| logo_key | text | NULL – Release 1.0 (FR-EMP-002) |
| verification_status | enum `company_status` | PENDING, VERIFIED, REJECTED, SUSPENDED (BR §2) |
| status_reason | text | Required when REJECTED or SUSPENDED (BR-CMP-002) – CHECK |
| submitted_at | timestamptz | When it entered PENDING – orders the admin queue |
| verified_at / verified_by | timestamptz / uuid | Who approved it (also in audit log) |

### 3.6 `job`
| Column | Type | Rules |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK → company | `ON DELETE RESTRICT` |
| title | text | NOT NULL, ≤ 120 chars |
| description | text | NOT NULL |
| requirements | text | NOT NULL |
| location | text | NULL only when `work_mode = 'REMOTE'` – CHECK (BR-JOB-010) |
| work_mode | enum `work_mode` | ON_SITE, HYBRID, REMOTE (FR-CAN-007) |
| job_type | enum `job_type` | FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERNSHIP |
| experience_level | enum `experience_level` | ENTRY, JUNIOR, MID, SENIOR, LEAD |
| industry_id | uuid FK → industry | `ON DELETE RESTRICT` |
| salary_min / salary_max | integer | NOT NULL; CHECK `0 <= salary_min <= salary_max` (BR-JOB-003) |
| salary_period | enum `salary_period` | YEAR, DAY, HOUR – default YEAR |
| currency | char(3) | default `GBP` |
| deadline | timestamptz | NOT NULL (the 1–90 day window is checked in the service at submit time, because a CHECK constraint can't compare against "now" reliably) |
| status | enum `job_status` | DRAFT, PENDING_APPROVAL, PUBLISHED, PAUSED, REJECTED, CLOSED, REMOVED (BR §3) |
| status_reason | text | Required when REJECTED or REMOVED (FR-ADM-010/011, BR-JOB-008) – CHECK |
| submitted_at / published_at / closed_at | timestamptz | Lifecycle timestamps |
| search_vector | tsvector | **Generated column** from title (weight A), requirements (B), description (C) |

### 3.7 `application`
| Column | Type | Rules |
|---|---|---|
| id | uuid PK | |
| job_id | uuid FK → job | `ON DELETE RESTRICT` |
| candidate_id | uuid FK → candidate_profile | **NULL after anonymisation**; `ON DELETE SET NULL` (BR-USR-003) |
| cv_storage_key | text | NULL after anonymisation – the **snapshot copy**, not the live CV (BR-APP-003) |
| cv_original_filename / cv_mime_type / cv_size_bytes | text / text / integer | Snapshot metadata |
| cover_letter | text | NULL; ≤ 5,000 chars; cleared on anonymisation |
| status | enum `application_status` | APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW, OFFERED, REJECTED, WITHDRAWN (BR §4) |
| applied_at | timestamptz | NOT NULL |
| anonymised_at | timestamptz | NULL until anonymised (BR-USR-003, BR-APP-009) |

`UNIQUE (job_id, candidate_id)` – one application per candidate per job, **ever**, even after withdrawal
(BR-APP-002). Postgres treats NULLs as different, so many anonymised rows for one job don't clash.

### 3.8 `application_status_history`
| Column | Type | Rules |
|---|---|---|
| id | uuid PK | |
| application_id | uuid FK → application | `ON DELETE CASCADE` |
| from_status | enum `application_status` | NULL for the first entry (APPLIED) |
| to_status | enum `application_status` | NOT NULL |
| changed_by_user_id | uuid | NULL after the user is deleted; no FK (survives erasure) |
| message | text | Optional rejection message (FR-EMP-018), shown to the candidate |
| changed_at | timestamptz | NOT NULL |

One row per status change (BR-APP-007). Release 1.0 notifications read from this table.

### 3.9 Better Auth tables – `session`, `account`, `verification`
Created by Better Auth's schema generator and kept in the same Prisma schema. `account` stores the
Argon2id password hash; `session` stores opaque session tokens (§5.1 of architecture doc); `verification`
stores email-verification and password-reset tokens with expiry (FR-AUTH-005/008). Rate-limit counters
use Better Auth's database storage (NFR-SEC-007). We extend its `user` table with the columns in §3.1
rather than keeping a second user table.

### 3.10 `audit_log`
| Column | Type | Rules |
|---|---|---|
| id | bigint identity PK | Sequential – order of events matters |
| occurred_at | timestamptz | NOT NULL, default `now()` |
| actor_user_id | uuid | NULL for system jobs; **no FK** |
| actor_role | enum `user_role` | Copied at write time |
| action | text | e.g. `company.verified`, `user.suspended`, `auth.login_failed` |
| target_type / target_id | text / uuid | What was acted on |
| ip_address | inet | NULL for system jobs |
| request_id | text | Links to application logs |
| metadata | jsonb | Reasons, old/new status – **never** names, emails or CV content (NFR-PRV-004) |

**Retention (BR-AUD-001):** entries older than 24 months are deleted by a daily system job using a
separate DB role; the trigger allows only that age-based delete. Index on `occurred_at` makes it cheap.

**Why no foreign keys:** a FK to `user` would either block deleting the user or force an `UPDATE` /
`DELETE` on audit rows – both break FR-ADM-021. Append-only is enforced by DB permissions plus a trigger
(architecture doc §5.4).

## 4. Business Rules Enforced in the Database
The service layer checks every rule first (with friendly error messages); the database is the **safety net**
for rules where a bug or a race would cause real harm.

| Rule | DB mechanism |
|---|---|
| FR-AUTH-004 unique email | `UNIQUE (email)` on citext |
| BR-APP-002 apply once | `UNIQUE (job_id, candidate_id)` |
| BR-JOB-003 salary range | `CHECK (0 <= salary_min AND salary_min <= salary_max)` |
| FR-CAN-005 file size | `CHECK` on `cv.size_bytes` |
| Mandatory reasons (FR-ADM-006/008/010/011) | `CHECK (status NOT IN (…) OR status_reason IS NOT NULL)` |
| One company per employer | `UNIQUE (owner_user_id)` |
| FR-ADM-021 audit append-only | Revoked `UPDATE`/`DELETE` + trigger |
| Status lifecycles (BR §1–4) | Service transition table + **guarded update** (below) |

**Guarded update for every status change:**
`UPDATE application SET status = 'SHORTLISTED' WHERE id = $1 AND status = 'UNDER_REVIEW'`
If 0 rows change, someone else changed it first – the service returns a conflict instead of
overwriting. This stops two tabs (or an employer and a withdrawing candidate) from racing.

## 5. Access Patterns & Indexes

| # | Query | Frequency | Index |
|---|---|---|---|
| Q1 | **Job search**: published, deadline in future, company visible, keyword, location, work mode, job type; newest first; paginated | Very high | `GIN (search_vector)`; partial `(published_at DESC) WHERE status = 'PUBLISHED'` |
| Q2 | Candidate's application history (FR-CAN-013) | High | `(candidate_id, applied_at DESC)` |
| Q3 | Applicants for one job (FR-EMP-014) | High | `UNIQUE (job_id, candidate_id)` covers `job_id` lookups; add `(job_id, applied_at DESC)` |
| Q4 | Employer's jobs with application counts (FR-EMP-013) | Medium | `(company_id, created_at DESC)` on job; counts via `GROUP BY job_id` on Q3's index |
| Q5 | Admin company queue (FR-ADM-007) | Low | Partial `(submitted_at) WHERE verification_status = 'PENDING'` |
| Q6 | Admin job queue (FR-ADM-009) | Low | Partial `(submitted_at) WHERE status = 'PENDING_APPROVAL'` |
| Q7 | Admin user search by email / role / status (FR-ADM-004) | Low | `UNIQUE (email)`; `(role, status)` |
| Q8 | Audit log by date / target / actor | Low | `(occurred_at DESC)`, `(target_type, target_id)`, `(actor_user_id)` |
| Q9 | Status history for one application | Medium | `(application_id, changed_at)` |

**Job visibility is defined once.** A job appears in search only if: `job.status = 'PUBLISHED'`,
`job.deadline > now()`, its company is `VERIFIED`, and the company owner is `ACTIVE` (BR-JOB-001,
BR-CMP-003, BR-USR-002). This check lives in one repository function, written as an `EXISTS (…)`
subquery, so no query can forget part of it. Suspending a company therefore hides its jobs **without
changing any job rows**, and reinstating it brings them back.

**Location filter (MVP):** case-insensitive match on `job.location`. At 10,000 jobs, the
`status = 'PUBLISHED'` partial index reduces the rows enough. If measurement shows otherwise, add a
`pg_trgm` index. Every index above is **checked with `EXPLAIN ANALYZE` on 10,000 seeded jobs in Phase 3**
before NFR-PERF-001 is called met.

## 6. Deletion & Anonymisation (GDPR)

| Event | What happens | When |
|---|---|---|
| Candidate deletes account (FR-CAN-018) | `user.status = DELETED`, `deleted_at` set, sessions removed → can't log in | Immediately |
| Erasure job (NFR-PRV-003) | Delete CV files + snapshot files from storage → delete `cv` rows → anonymise applications (`candidate_id`, `cv_*`, `cover_letter` → NULL, `anonymised_at` set) → delete `candidate_profile` → delete `user` row | Daily, ≤ 30 days |
| Job closed > 12 months (BR-APP-009) | Same anonymisation for that job's applications | Daily |
| Unverified > 7 days (BR-USR-001) | Delete `user` row (nothing else exists yet) | Daily |
| Employer deletion via support (BR-USR-004) | Admin closes open jobs → set `company.owner_user_id` to NULL (column becomes nullable) → delete `user` row; company name stays on past applications | On request, ≤ 30 days |
| Audit entries > 24 months (BR-AUD-001) | Delete the entries | Daily |

Files are deleted **before** the database rows that point to them, so a failed run is simply retried
(idempotent) and never leaves orphaned CVs that we've lost track of. Employers see anonymised applications
as "Candidate removed".

## 7. Migrations
- Prisma Migrate, one migration per change, committed to Git, run automatically on deploy.
- Things Prisma can't express (generated `tsvector` column, partial indexes, `CHECK` constraints, audit
  trigger and permissions, `citext` extension) go in hand-written SQL inside the migration files.
- Write migrations for the **Postgres version Neon runs in production** and run CI against that same version.

## 8. Release 1.0 Tables (not in MVP)
`education`, `employment`, `skill` + `candidate_skill` (FR-CAN-002/003/004) · `saved_job` (FR-CAN-009) ·
`notification` (FR-CAN-015, FR-EMP-021) · `interview` (FR-EMP-019) · `application_note` (FR-EMP-020,
never joined into candidate-facing queries) · `job_report` (FR-ADM-012/013).

## 9. Decisions (PO, 2026-11-11)
- Q1 Salary: ✅ whole pounds **plus `salary_period`** (YEAR / DAY / HOUR) – BR-JOB-003.
- Q2 Audit retention: ✅ entries **deleted after 24 months** – BR-AUD-001.
- Q3 Employer deletion: ✅ **via support only** in this release; self-service in Release 1.0 – BR-USR-004.
- Q4 Location: ✅ free-text `location` **plus `work_mode`** (ON_SITE / HYBRID / REMOTE) – BR-JOB-010, FR-CAN-007.
