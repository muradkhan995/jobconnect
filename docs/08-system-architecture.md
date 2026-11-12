# JobConnect – System Architecture

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 2 – Design |
| Status | Proposed – awaiting Product Owner sign-off |
| Last updated | 2026-11-11 |

---

## 1. Architectural Drivers
The decisions below are driven by these Phase 1 constraints:

| Driver | Source | What it forces |
|---|---|---|
| One part-time developer | Scope A4, R-02, R-03 | Fewest moving parts; one language; well-documented tools |
| Budget < £20/month | Scope A4, R-10 | Free tiers / pay-as-you-go; no always-on extras |
| UK/EU data hosting | NFR-PRV-005 | Every provider must offer a UK or EU region |
| TypeScript strict | NFR-MNT-001 | TypeScript end to end |
| Server-enforced authorisation | NFR-SEC-003, BR §5 | One place where every permission check lives |
| Cookie sessions + CSRF | NFR-SEC-006 | Same-origin app; no tokens in localStorage |
| Private CVs via signed URLs | NFR-SEC-008 | Private object storage, not the database or web server disk |
| Append-only audit log | FR-ADM-019/021 | Enforced in the database, not only in code |
| Stateless app servers | NFR-SCAL-002 | Sessions, rate limits and jobs stored in shared services |
| Avoid lock-in, avoid over-engineering | R-11, R-13 | Standard Docker container; external services behind interfaces |

## 2. Architecture Style – Modular Monolith
One **Next.js** application, deployed as **one Docker image**, holds the UI, the API and the background
worker. Inside, code is split into **modules with clear boundaries**, so a module could be extracted later
if it ever needed to be (it probably won't at this scale).

```
                        ┌──────────────────────────────────────────────────────┐
  Browser  ──HTTPS──▶   │  Next.js app  (Docker image, UK region)              │
  (React UI)            │                                                      │
                        │  app/          pages (React Server Components)       │
                        │  app/api/v1/   REST route handlers  (OpenAPI)        │
                        │        │                                             │
                        │        ▼                                             │
                        │  modules/  auth · candidate · employer · job ·       │
                        │            application · admin · audit · files       │
                        │        │   (service → policy → repository)           │
                        │        ▼                                             │
                        │  Prisma ORM                                          │
                        │                                                      │
                        │  worker process (same image): pg-boss jobs           │
                        └───────┬───────────────┬───────────────┬──────────────┘
                                │               │               │
                                ▼               ▼               ▼
                         PostgreSQL       Object storage    Email provider
                     (data, sessions,     (CVs, logos –     (verification,
                      audit log, queue)    private bucket)   reset, notices)

  Cross-cutting: Sentry (errors) · JSON logs · GitHub Actions (CI/CD, nightly backups)
```

### 2.1 Internal layering (every module)
| Layer | Responsibility | Rule |
|---|---|---|
| Route handler / page | Parse request, validate input with Zod, call a service | No business logic, no DB access |
| Service | Business rules and lifecycles (BR-JOB, BR-APP…) | Calls a **policy** before every action |
| Policy | "Can user X do Y to record Z?" – the permission matrix (BR §5) | Pure functions, unit-tested for every role |
| Repository | Prisma queries for this module's tables | Only place SQL/Prisma is used |

Modules talk to each other **only through their service's public functions**, never by reading another
module's tables directly. Example: `application` asks `job.service.isOpenForApplications(jobId)`.

### 2.2 Status lifecycles
Each lifecycle in `05-business-rules.md` (account, company, job, application) is written as **one
transition table** in its module (`from → allowed to[] + who may trigger it`). The service refuses any
transition that isn't in the table. That one table is used by both the code and its tests.

## 3. Technology Stack

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | NFR-MNT-001; one language for UI, API, worker, tests |
| Web framework | **Next.js** (App Router) + React | UI and API in one codebase and deploy; server-side rendering helps LCP (NFR-PERF-002) |
| UI components | Tailwind CSS + shadcn/ui (built on Radix) | Accessible primitives toward WCAG 2.2 AA (NFR-UX-002); no runtime cost |
| Validation | Zod | One schema validates input on the server and generates the OpenAPI spec |
| API docs | OpenAPI generated from Zod schemas | NFR-MNT-004 without hand-maintained YAML |
| Database | **PostgreSQL** | Relational data, transactions for status changes, full-text search, DB-level permissions for the audit log |
| ORM / migrations | Prisma | Typed, parameterised queries (NFR-SEC-004); versioned migrations |
| Search | PostgreSQL full-text search (`tsvector` + GIN index) | Comfortably meets < 500 ms at 10k jobs (NFR-PERF-001); no extra service |
| Authentication | **Better Auth** (DB sessions) | Email verification, password reset, rate limiting, HIBP breached-password check, MFA plugin for admins later (FR-ADM-002) – avoids writing security-critical code ourselves |
| Password hashing | Argon2id | NFR-SEC-001 |
| Background jobs | **pg-boss** (queue stored in PostgreSQL) | Emails, scheduled clean-ups, GDPR erasure – no Redis needed |
| File storage | S3-compatible object storage (private bucket) | Signed short-lived URLs (NFR-SEC-008); same code works locally with MinIO |
| Email | Transactional email API (EU region) | SPF/DKIM/DMARC support (R-09) |
| Logging | pino (JSON) with request ID and PII redaction | NFR-OBS-002, NFR-PRV-004 |
| Error monitoring | Sentry (EU data region) | NFR-OBS-003 |
| Unit / integration tests | Vitest + Testcontainers (real PostgreSQL) | Authorisation tests run against a real database |
| End-to-end tests | Playwright | MVP acceptance criterion (core loop) |
| CI/CD | GitHub Actions | NFR-MNT-002, NFR-SEC-011 |

Exact versions are pinned when the project is scaffolded (Phase 3).

## 4. Hosting & Providers

| Component | Recommended provider | Region | Est. cost (MVP) |
|---|---|---|---|
| App container (web + worker) | Fly.io | London (`lhr`) | ~£3–6 / month |
| PostgreSQL | Neon (managed Postgres) | London (AWS eu-west-2) | Free tier |
| Object storage | Cloudflare R2 (EU jurisdiction bucket) | EU | Free tier (10 GB) |
| Email | Resend | EU | Free tier |
| Error monitoring | Sentry | EU | Free tier |
| Backups storage | Separate R2 bucket with 30-day lifecycle rule | EU | Free tier |
| **Total** | | | **≈ £3–6 / month** (target < £20) |

Prices and free-tier limits must be re-checked at sign-up; they change often.
**Fallback:** the app is a plain Docker image and every provider is S3/Postgres/SMTP-compatible, so
Render, Railway or a small VPS can replace any of them without code changes (R-13).

### 4.1 Environments
| Environment | Where | Data |
|---|---|---|
| Local | `docker compose`: PostgreSQL, MinIO (S3), Mailpit (email catcher) | Seed data |
| CI | GitHub Actions + Testcontainers | Throwaway per run |
| Production | Fly.io + Neon + R2 | Real data |

**Decision (PO, 2026-11-11):** no staging environment for the MVP (YAGNI, R-11); add one before Release 1.0 if needed
(a Neon branch + second Fly app costs almost nothing).

## 5. Key Flows

### 5.1 Request & authorisation
1. Browser sends a request with an `HttpOnly; Secure; SameSite=Lax` session cookie.
2. The Next.js proxy (`src/proxy.ts`, formerly "middleware") adds a request ID and a per-request
   nonce CSP; static security headers (HSTS, nosniff, frame and referrer policies) come from `next.config.ts`.
3. On state-changing requests, the `Origin` header is checked against our domain (CSRF protection,
   alongside SameSite cookies).
4. Route handler validates input with Zod → service → **policy check** → repository.
5. Admin actions and security events write an audit entry **in the same database transaction**.

### 5.2 CV upload & download (NFR-SEC-008)
1. Upload goes through our server (≤ 5 MB). The server checks the file's **magic bytes** (real PDF/DOCX),
   not just the extension, then stores it under a random UUID key in the private bucket.
2. A database row records owner, original name, size, type and `scan_status`.
3. Download: the service checks the policy (owner, or employer of a job the CV was submitted to), then
   returns a **signed URL valid for 5 minutes**.
4. Applying copies the chosen CV to a new immutable object (snapshot, BR-APP-003).
5. Malware scanning (NFR-SEC-009, Should): a worker job scans new files with ClamAV and sets
   `scan_status`. The column exists from the MVP; the scanner is added in Release 1.0.

### 5.3 Background jobs (pg-boss worker)
| Job | Schedule | Rule |
|---|---|---|
| Send email | On demand | FR-AUTH-005/008, notifications |
| Delete unverified accounts | Daily | BR-USR-001 (after 7 days) |
| Erase deleted accounts' data + CV files | Daily | NFR-PRV-003 (within 30 days) |
| Anonymise old applications | Daily | BR-APP-009 (jobs closed > 12 months) |
| Delete old audit entries | Daily | BR-AUD-001 (older than 24 months) |
| Auto-close jobs past deadline | Hourly | BR-JOB-006 (Release 1.0) |

Every job is **idempotent** (safe to run twice) so retries never cause damage.

### 5.4 Audit log (FR-ADM-019/021)
- Table `audit_log` is insert-only. The app's database user is granted `INSERT` and `SELECT` only;
  `UPDATE`/`DELETE` are revoked, and a trigger rejects them as a second safeguard.
- Entries store user ID, action, target, timestamp and IP, and **never** personal data such as CV contents.
- **Retention (BR-AUD-001):** entries older than 24 months are deleted by the daily retention job. It connects
  as a separate database role that may only `DELETE … WHERE occurred_at < now() - interval '24 months'`
  (enforced by the trigger). No user or admin can delete entries (FR-ADM-021); only this system job can.

## 6. Security & Privacy Mapping

| Requirement | Where it is enforced |
|---|---|
| NFR-SEC-001 Password hashing | Better Auth configured with Argon2id |
| NFR-SEC-002 HTTPS | Fly.io TLS + HSTS header |
| NFR-SEC-003 Authorisation | Policy layer, called by every service; tests for every role × action |
| NFR-SEC-004 Input / SQL injection | Zod on every endpoint; Prisma parameterised queries; no raw SQL without review |
| NFR-SEC-005 XSS | React escaping by default; CSP with nonce; no `dangerouslySetInnerHTML` |
| NFR-SEC-006 Cookies / CSRF | Better Auth session cookie flags; Origin check in middleware |
| NFR-SEC-007 Rate limiting | Better Auth rate limiter with **database** storage (works across instances) |
| NFR-SEC-008 Files | §5.2 |
| NFR-SEC-010 Secrets | Fly.io secrets / GitHub Actions secrets; `.env` in `.gitignore`; secret scanning in CI |
| NFR-SEC-011 Dependencies | Dependabot + `npm audit` in CI |
| NFR-PRV-003 Erasure & backups | Erasure job (§5.3); backup bucket lifecycle deletes after 30 days |
| NFR-PRV-004 No PII in logs | pino redaction list; code review checklist |
| NFR-PRV-005 UK/EU hosting | §4 – every provider in UK or EU |

## 7. Reliability & Operations
- **Health check:** `GET /api/health` checks the DB connection (NFR-OBS-001); used by Fly.io.
- **Backups (NFR-REL-002):** Neon's built-in restore covers short-term mistakes. Separately, a **nightly
  GitHub Actions job runs `pg_dump`**, encrypts it and uploads it to the backup bucket (30-day retention).
  Restoring into a fresh database is a documented, scripted step that runs **before each release**.
- **Deploys:** merge to `main` → CI passes → Docker image built → Prisma migrations run → Fly.io rolling
  deploy. Migrations must be backward-compatible with the previous release (expand, then contract).
- **Uptime (NFR-REL-001):** 99.5% is achievable with one app machine plus auto-restart; a second machine
  can be added if measurements show it is needed.

## 8. AI Agents – Prepared, Not Built (Release 1.1+)
The MVP contains **no AI code**. To make adding it later safe and easy:
- A future `modules/ai` hides the provider behind an `AiProvider` interface (R-13).
- AI calls run as **worker jobs**, so a slow or unavailable provider never blocks core features (NFR-AI-001/002).
- AI output is stored as a **suggestion** that a human must accept; it has no way to call services that
  change status (FR-EMP-AI-003, FR-ADM-AI-003, NFR-AI-003).
- Provider choice, data-processing terms (NFR-AI-004) and cost caps (NFR-AI-005) are decided in a separate ADR.

## 9. Architecture Decision Records (summary)

| ADR | Decision | Main alternative rejected | Reason |
|---|---|---|---|
| ADR-001 | Modular monolith on Next.js | React SPA + NestJS API (2 deploys) | Half the setup and deploy work for a solo dev; same-origin cookies make CSRF/CORS simpler |
| ADR-002 | PostgreSQL + Prisma | MongoDB | Data is relational; need transactions and DB-level audit permissions |
| ADR-003 | Postgres full-text search | Elasticsearch / Meilisearch | 10k jobs don't justify another service (R-11) |
| ADR-004 | Better Auth with DB sessions | Hand-written auth; JWT in localStorage | Less security-critical code to write; JWT in localStorage breaks NFR-SEC-006 |
| ADR-005 | pg-boss queue in Postgres | Redis + BullMQ | One fewer service and bill |
| ADR-006 | Docker on Fly.io (London) | Vercel serverless | Long-running worker needed; UK region; portable container (R-13) |
| ADR-007 | S3-compatible private storage | Files in DB or on server disk | Signed URLs, stateless servers, cheap storage |
| ADR-008 | Nonce-based CSP; every route renders per request (`instant = false` on the root layout, Cache Components kept on) | CSP with `'unsafe-inline'` scripts, or experimental hash-based SRI with static shells | Strongest XSS protection for a Must (NFR-SEC-005); pages are mostly personal and dynamic anyway. Cost: no static shells/CDN caching of pages. Revisit for public job pages if NFR-PERF-002 is missed |

**Trade-offs we accept:** one deployable means a bug in one module can affect the whole app (mitigated
by tests and module boundaries); Next.js has a learning curve (R-03; mitigated by its large docs and community);
Postgres search won't scale to millions of jobs (we can add a search service if that ever becomes a real problem).

## 10. Open Questions
- Q1: ✅ **Partly decided (PO, 2026-11-11):** Neon, Cloudflare R2, Resend and Sentry approved. App host
  (Fly.io vs Render) deferred to Phase 3 – see Q4.
- Q2: Custom domain name for production (needed for email SPF/DKIM/DMARC, R-09).
- Q3: ✅ **Decided (PO, 2026-11-11):** no staging environment for the MVP.
- Q4: £0 hosting option – Render free tier instead of Fly.io. Free instances sleep after 15 min idle, which would stop the pg-boss worker; scheduled jobs (GDPR erasure etc.) would then need a GitHub Actions cron trigger. Decide in Phase 3.

## 11. Next Phase-2 Documents
- `09-data-model.md` – entities, relationships, indexes.
- `10-api-design.md` – REST endpoints and error format.
- `11-ui-flows.md` – screens and user journeys.
