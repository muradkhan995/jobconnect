# JobConnect – Software Solution Document

> **Living document.** This is the single place that describes what JobConnect is, what is built,
> how it is built, what was decided and what changed. It is updated in the **same pull request** as
> any change to the project (see §14). Detailed designs live in the numbered documents it links to.

| Field | Value |
|---|---|
| Version | 1.8 |
| Status | Current – reflects branch `feat/demo-data` (on top of `main` at `8b02103`, PR #22) |
| Phase | 3 – Build (MVP, release 0.1) |
| Owner | Product Owner |
| Last updated | 2026-11-12 |
| Repository | https://github.com/muradkhan995/jobconnect |

---

## Contents
1. [Status at a glance](#1-status-at-a-glance)
2. [Solution overview](#2-solution-overview)
3. [Architecture as built](#3-architecture-as-built)
4. [Technology stack (pinned versions)](#4-technology-stack-pinned-versions)
5. [Code map](#5-code-map)
6. [Requirements traceability](#6-requirements-traceability)
7. [Data model as built](#7-data-model-as-built)
8. [API and pages as built](#8-api-and-pages-as-built)
9. [Security and privacy controls](#9-security-and-privacy-controls)
10. [Quality: tests, CI and QA](#10-quality-tests-ci-and-qa)
11. [Environments, running and demo users](#11-environments-running-and-demo-users)
12. [Decision log](#12-decision-log)
13. [Change log](#13-change-log)
14. [Open questions, risks and next steps](#14-open-questions-risks-and-next-steps)
15. [How this document is maintained](#15-how-this-document-is-maintained)
16. [Document index](#16-document-index)

---

## 1. Status at a glance

| Area | Status |
|---|---|
| Phase 1 – Discovery (docs 01–07) | ✅ Complete |
| Phase 2 – Design (docs 08–11) | ✅ Complete; 3 open questions (§14) |
| Phase 3 – Build | 🟡 In progress – foundation, auth, company verification, jobs (S1), search (S2), profile/CVs/applying (S3) done |
| `main` CI | ✅ Green (lint, types, unit, integration, build, audit, secret scan) |
| Deployed | ❌ Not yet – runs locally only |
| MVP core loop (docs/02-product-strategy/06-mvp-definition.md §2) | **Steps 1–3 of 5 done**: companies verified; jobs approved; candidates search, apply with a CV and see status. Employers can't review applicants yet (S4) |

**Working today:** sign up as candidate or employer, email confirmation, log in/out, password reset;
employer company profile; admin verification queue with verify / reject (with reason) / suspend /
reinstate; employers write, submit, edit, pause, resume and close jobs; admin job approval queue with
approve / reject / remove (with reasons); emails to the employer for every decision; **public job
search** (keyword, location, work mode, job type, newest first, "Load more") and **job details** with
"Log in to apply"; role dashboards; demo accounts for every role; health check; audit log.

Candidates also have a **profile with up to 5 CVs** (type checked from content, private storage, 5-minute
download links), **apply in two clicks** with a CV snapshot, see **My applications** with a status timeline,
and get a **bottom tab bar on phones**; employers see application counts.

**Next feature:** applicant management for employers (sprint S4, core loop steps 4–5).

---

## 2. Solution overview

**Problem.** Candidates rarely hear back after applying; employers lose applications in email; fake job
adverts erode trust. ([01-project-vision](02-product-strategy/01-vision.md))

**Solution.** A job marketplace where only **verified employers** can publish jobs, and every
application shows its **real status** from submission to decision. Role-specific AI assistants come
later (release 1.1+); humans always make hiring decisions.

| Role | Main jobs | Persona |
|---|---|---|
| Candidate | Search, apply, track applications | Amira ([02](02-product-strategy/02-personas.md)) |
| Employer | Company profile, post jobs, manage applicants | David |
| Administrator | Verify companies, approve jobs, moderate | Sophie |

**Constraints:** one part-time developer · < £20/month · UK/EU hosting and GDPR · TypeScript strict ·
every change via pull request with passing CI. ([06-scope-and-risks](02-product-strategy/05-scope-and-risks.md))

**Releases:** 0.1 MVP (core loop) → 1.0 (all Must + Should) → 1.1+ (AI agents). ([07](02-product-strategy/06-mvp-definition.md))

---

## 3. Architecture as built

A **modular monolith**: one Next.js application (UI + API + later a background worker) in one Docker
image, PostgreSQL for all state. Full design: [08-system-architecture](06-architecture/01-system-architecture.md).

```
Browser ──HTTPS──▶ Next.js app
                    │
                    ├─ src/proxy.ts ─────── request id · CSRF origin check · CSP nonce · role gate for /admin, /employer
                    ├─ next.config.ts ───── static security headers (HSTS, nosniff, frame, referrer…)
                    │
                    ├─ src/app/ ─────────── pages (React Server Components) + route handlers
                    │    ├─ (auth)/…           register, login, check-email, forgot/reset password
                    │    ├─ employer/…         employer dashboard, company profile, jobs (list/new/detail/edit)
                    │    ├─ admin/…            admin dashboard, company + job queues and reviews
                    │    ├─ api/auth/[...all]  Better Auth endpoints
                    │    ├─ api/v1/…           JSON API (apiRoute wrapper: 401/403/400/problem+json)
                    │    └─ api/health         DB ping → 200 / 503
                    │
                    ├─ src/modules/ ─────── business modules (auth, audit, company, job; more per feature)
                    ├─ src/lib/ ─────────── db, auth, env, email, logger, security helpers
                    │
                    ├──▶ PostgreSQL 17 ─── data, sessions, rate limits, append-only audit log
                    └──▶ SMTP ──────────── Mailpit locally; transactional provider in production
```

**Built so far vs. planned:** the background worker (pg-boss), object storage (CVs), Sentry and the
production deployment are designed but **not built yet**. Emails are currently sent inline.

---

## 4. Technology stack (pinned versions)

| Concern | Technology | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | 22 (`.nvmrc`) | |
| Framework | Next.js (App Router, Cache Components) + React | 16.4.6 / 19.3.1 | Every route renders per request (ADR-008) |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) | 5.9.3 | TS 7 blocked: typescript-eslint unsupported (D-14) |
| Styling | Tailwind CSS | 4.3.5 | |
| Database | PostgreSQL | 17 (Docker locally) | Match production major |
| ORM | Prisma + `@prisma/adapter-pg` | 7.10.1 | Not 8.0 RC (D-08) |
| Auth | Better Auth | 1.7.18 | DB sessions, telemetry off |
| Password hashing | `@node-rs/argon2` (Argon2id) | 2.2.2 | m=19456, t=2, p=1 (OWASP) |
| Validation | Zod | 4.6.7 | |
| Logging | pino (JSON) | 10.4.0 | PII redaction |
| Email | nodemailer → SMTP | 10.4.0 | Mailpit v1.32.0 locally |
| Unit / integration tests | Vitest | 5.1 | Integration against real Postgres + Mailpit |
| E2E tests | Playwright (Chromium) | 1.64.1 | Against a production build |
| Lint / format | ESLint + Prettier | 10.14 / 3.10 | Zero warnings allowed |
| CI | GitHub Actions | – | Actions pinned by commit SHA |
| Dependency updates | Dependabot | – | Weekly; majors of `typescript`, `@types/node` ignored |

**Dependency policy:** new dependencies are pinned to a release **at least two weeks old**; Dependabot
proposes newer ones as pull requests, merged **only after CI on the PR is green**.

---

## 5. Code map

| Path | Responsibility |
|---|---|
| `src/proxy.ts` | Runs before every request: request id, CSRF check, CSP nonce |
| `src/app/` | Pages and route handlers only – no business logic |
| `src/modules/auth/` | Sign-up rules, password hashing, emails, error messages, session helper, auth forms |
| `src/modules/audit/` | `recordAudit()` – typed actions, transaction-aware, rejects personal data |
| `src/modules/company/` | Company schemas (Zod), lifecycle table (`rules.ts`), service (ownership, guarded updates, audit, emails), labels, form + decision components |
| `src/modules/job/` | Job schemas (Zod, cross-field rules), lifecycle + material-edit + deadline rules, service, labels/formatting, emails, form, preview, action components |
| `src/modules/auth/policy.ts` | `requireRole()` used by every service |
| `src/components/action-panel.tsx` | Shared choose → confirm (→ reason) → POST panel for lifecycle actions |
| `src/lib/http/page.ts` | `orNotFound()` – service 404 / bad id → page 404 |
| `src/lib/http/api.ts` | `apiRoute()` wrapper for every `/api/v1` endpoint: session, role, Zod body parsing, errors → RFC 9457 |
| `src/lib/http/errors.ts` | `DomainError` + helpers (not found, forbidden role, invalid transition, state changed) |
| `src/lib/client/api.ts` | Browser helper for calling the API and reading problem responses |
| `src/lib/auth.ts` | Better Auth configuration (single place for all auth policy) |
| `src/lib/db.ts` | Lazy, process-wide Prisma client |
| `src/lib/env.ts` | Zod-validated environment (names only in errors, never values) |
| `src/lib/security/` | CSP builder, CSRF origin check |
| `src/lib/http/` | RFC 9457 problem responses, request id |
| `src/lib/logger.ts`, `privacy.ts` | JSON logger; shared list of sensitive field names |
| `src/components/` | Shared UI: button, text/select/textarea fields, alert, status badge, auth card, site header (role nav) |
| `prisma/` | Schema, migrations, demo-user seed |
| `e2e/` | Playwright tests, helpers, global setup |
| `docs/` | This document, discovery/design docs, QA reports |

**Rules:** route handler → service → policy → repository (docs/06-architecture/01-system-architecture.md §2.1); modules talk only through
each other's public service functions; status changes are guarded updates (docs/05-design/01-data-model.md §4).

---

## 6. Requirements traceability

Legend: ✅ done · 🟡 partial · ⬜ not started · ➖ not in MVP

### 6.1 Functional – MVP scope
| Requirement | Status | Where / note |
|---|---|---|
| FR-AUTH-001 Register (candidate / employer) | ✅ | `/register`, E2E 02–04 |
| FR-AUTH-002 No admin self-registration | ✅ | `signup-rules.ts`; integration test |
| FR-AUTH-003 Password policy (≥ 12, breached list) | ✅ | Better Auth + HIBP plugin |
| FR-AUTH-004 No duplicate email | ✅ | Unique `citext`; enumeration-safe response (D-11) |
| FR-AUTH-005 Verification link, 24 h | ✅ | E2E 06–07 |
| FR-AUTH-006 Login only after verification | ✅ | E2E 05 |
| FR-AUTH-007 Log out | ✅ | E2E 09–10 |
| FR-AUTH-008 Password reset, time-limited | ✅ | 1 h link, all sessions revoked; E2E 11–14 |
| FR-AUTH-009 Temporary block after 5 failures (S) | 🟡 | Per-IP rate limit (10/min) only; no per-account lockout |
| FR-ADM-001 Admin created only by script | 🟡 | Local demo seed only; production admin script ⬜ |
| FR-ADM-019 Audit entries | 🟡 | Auth events + company decisions; more admin actions as they are built |
| FR-ADM-021 Audit log can't be edited/deleted | ✅ | DB triggers; integration tests |
| FR-CAN-006 Keyword search | ✅ | Postgres full-text (stemming, title weighted highest); E2E 60–61 |
| FR-CAN-007 Filters (MVP: location, work mode, job type) | ✅ | E2E 62–63; salary/experience/industry filters in Release 1.0 |
| FR-CAN-008 Job details | ✅ | `/jobs/{id}`; E2E 65–66 |
| FR-CAN-001 Profile | ✅ | `/candidate/profile`; E2E 80–81 |
| FR-CAN-005 CVs (≤ 5, PDF/DOCX by content, ≤ 5 MB) | ✅ | `cv-file.ts`, private storage; int (5-CV race); E2E 82–83 |
| FR-CAN-010/011/012 Apply (once, before deadline, snapshot) | ✅ | int (race, snapshot); E2E 84–86 |
| FR-CAN-013 Application history with status | ✅ | E2E 85, 87; candidate privacy E2E 88 |
| FR-CAN-017/018 | ⬜ | Account settings, deletion (S5) |
| FR-EMP-001 Create company profile | ✅ | `/employer/company`; E2E 20–22 |
| FR-EMP-003 Edit company | ✅ | Rejected → back to review; blocked while suspended |
| FR-EMP-004 No jobs until verified | ✅ | Drafts allowed; submit/resume/approve require a VERIFIED company |
| FR-EMP-006 Create job draft | ✅ | `/employer/jobs/new`; E2E 40–43 |
| FR-EMP-007 Deadline in the future (1–90 days at submit) | ✅ | Rules + integration tests |
| FR-EMP-008 Submit for approval | ✅ | E2E 44–45 |
| FR-EMP-009 Edit own jobs (material edit → re-approval) | ✅ | BR-JOB-004/005; E2E 50 |
| FR-EMP-010 Pause / resume | ✅ | Integration tests |
| FR-EMP-011 Close (final) | ✅ | Integration tests |
| FR-EMP-013 Jobs list with application counts | ✅ | E2E 89 |
| FR-ADM-009 Job approval queue | ✅ | `/admin/jobs`, oldest first; E2E 46 |
| FR-ADM-010 Approve / reject with reason, employer notified | ✅ | E2E 47–52 |
| FR-ADM-011 Remove a job with reason | ✅ | Integration tests |
| FR-ADM-007 Company verification queue | ✅ | `/admin/companies`, oldest first; E2E 23–24 |
| FR-ADM-008 Verify / reject with reason, employer notified | ✅ | Emails sent; E2E 25–31 |
| FR-ADM-014 Industries | 🟡 | 13 seeded; admin editing ⬜ |
| FR-EMP-014/015/017/018 | ⬜ | Applicant features |
| FR-ADM-004–006 | ⬜ | User management |

### 6.2 Non-functional (Must unless marked)
| Requirement | Status | Where / note |
|---|---|---|
| SEC-001 Argon2id / bcrypt | ✅ | `password.ts` |
| SEC-002 HTTPS / TLS | 🟡 | HSTS header ready; needs deployment |
| SEC-003 Server-side auth + ownership checks | ✅ | Proxy role gate + `apiRoute` role check + service ownership/role checks; tested per role |
| SEC-004 Input validation, parameterised queries | ✅ | Zod on every `/api/v1` body; Prisma everywhere |
| SEC-005 Output encoding + CSP | ✅ | Nonce CSP; real-browser check (E2E 18) |
| SEC-006 Cookies + CSRF | ✅ | HttpOnly/Secure/SameSite; Origin check |
| SEC-007 Rate limiting | 🟡 | DB-backed 10/min on auth endpoints ✅; the 120/min general limit for public `/api/v1/jobs` (API design §5) ⬜ |
| PERF-001 Search < 500 ms p95 @ 10k jobs (S) | ✅ | `npm run perf:search`: every query p95 < 10 ms (keyword 4.5 ms) |
| SEC-008 Private files, signed URLs | ✅ | Random keys, ownership check, 5-min links (expiry enforced by R2 – verify in S6; s3mock doesn't check signatures) |
| SEC-009 Malware scan (S) | ⬜ | Release 1.0 |
| SEC-010 No secrets in Git | ✅ | `.env*` ignored; gitleaks in CI |
| SEC-011 Dependency scanning (S) | ✅ | `npm audit` + Dependabot |
| PRV-002 Consent recorded | ✅ | Version + timestamp on `user` |
| PRV-003 Erasure ≤ 30 days | ⬜ | With account deletion + worker |
| PRV-004 No PII in logs | ✅ | Redaction + audit metadata guard |
| PRV-005 UK/EU hosting (S) | ⬜ | Deployment |
| SCAL-002 Stateless servers (S) | ✅ | Sessions + rate limits in DB |
| REL-002 Daily backups + tested restore | ⬜ | Deployment |
| OBS-001 Health check | ✅ | `/api/health` |
| OBS-002 JSON logs + request id (S) | ✅ | pino + `x-request-id` |
| OBS-003 Error monitoring (S) | ⬜ | Sentry |
| MNT-001 TS strict + lint in CI | ✅ | |
| MNT-002 PR + passing CI | 🟡 | Practised; **branch protection not enforced on GitHub** |
| MNT-003 Tests per requirement (S) | 🟡 | Done for everything built so far |
| MNT-004 OpenAPI (S) | ⬜ | `/api/v1` exists; spec generation still to do |
| UX-001 Responsive 360–1920 px | 🟡 | Auth pages checked at 360 px |
| UX-002 WCAG 2.2 AA (S) | 🟡 | Labels, focus, live regions; no screen-reader audit yet |
| UX-004 Latest 2 versions of 4 browsers | 🟡 | Chromium only |

---

## 7. Data model as built

Design: [09-data-model](05-design/01-data-model.md). Conventions: UUIDv7 ids, `timestamptz` in UTC, `citext` emails,
hard delete + anonymise.

| Table | Purpose | Migration |
|---|---|---|
| `user` | Account: role, status, consent, verification | `20261112001631_auth` |
| `industry` | 13 seeded industries; deactivate, never delete | `20261112120548_companies` |
| `company` | Employer's company + verification status, reason, verified-at/by | `…_companies` |
| `job` | Job advert + lifecycle status, reason, submitted/published/closed times | `20261112134056_jobs` |
| `job.search_vector` | Stored, generated search document + partial GIN index (published only) | `…_job_search`, `…_job_search_vector` |
| `candidate_profile`, `cv`, `application`, `application_status_history` | Candidate side: profile, CVs (files in object storage), applications with snapshot + history | `20261112163741_candidates_and_applications` |
| `session` | Opaque session tokens | `…_auth` |
| `account` | Credentials (Argon2id hash) | `…_auth` |
| `verification` | Email-verification / reset tokens | `…_auth` |
| `rate_limit` | Rate-limit counters (shared across instances) | `…_auth` |
| `audit_log` | Append-only audit trail; no foreign keys | `20261112000352_audit_log` |
| *(extensions)* | `citext`, database timezone UTC | `20261111000000_init` |

**Database-enforced rules:** unique email (case-insensitive) · suspension needs a reason ·
one company per employer · rejected/suspended company needs a reason · verified company has a
verified-at time · company website must be https · job salary min ≤ max · job location unless remote ·
rejected/removed job needs a reason · published job has a published-at time · job currency GBP ·
audit log: no UPDATE/TRUNCATE, DELETE only after 24 months, timestamp set by DB, action-name format.

**Deviation from docs/05-design/01-data-model.md:** "unverified" is `email_verified = false`, not a status value (D-10).

---

## 8. API and pages as built

Design: [10-api-design](05-design/02-api-design.md), [11-ui-flows](04-design/01-ui-flows.md).

| Endpoint / page | Purpose |
|---|---|
| `POST /api/auth/sign-up/email` · `sign-in/email` · `sign-out` | Account lifecycle |
| `GET /api/auth/verify-email` | Email confirmation link |
| `POST /api/auth/request-password-reset` · `reset-password` | Password reset |
| `GET /api/auth/get-session` | Current session |
| `GET /api/health` | `200 {"status":"ok"}` / `503 {"status":"error"}` |
| `GET /api/v1/industries` | Active industries (public) |
| `GET · POST · PATCH /api/v1/employer/company` | Employer's own company |
| `GET /api/v1/admin/companies?status=` · `GET /api/v1/admin/companies/{id}` | Admin queue and detail |
| `POST /api/v1/admin/companies/{id}/verify · reject · suspend · reinstate` | Admin decisions (`reject`/`suspend` need `{ reason }`) |
| `/`, `/register`, `/check-email`, `/login`, `/forgot-password`, `/reset-password`, `/privacy` | Public / auth pages |
| `/employer`, `/employer/company` | Employer dashboard, company profile form |
| `/admin`, `/admin/companies`, `/admin/companies/{id}` | Admin dashboard, company queue, review |
| `GET · POST /api/v1/employer/jobs` · `GET · PATCH /api/v1/employer/jobs/{id}` | Employer's own jobs |
| `POST /api/v1/employer/jobs/{id}/submit · pause · resume · close` | Employer job lifecycle |
| `GET /api/v1/admin/jobs?status=` · `GET /api/v1/admin/jobs/{id}` | Admin job queue and detail |
| `POST /api/v1/admin/jobs/{id}/approve · reject · remove` | Admin job decisions (`reject`/`remove` need `{ reason }`) |
| `/employer/jobs`, `/employer/jobs/new`, `/employer/jobs/{id}`, `/employer/jobs/{id}/edit` | Employer job pages |
| `/admin/jobs`, `/admin/jobs/{id}` | Admin job queue and review |
| `GET /api/v1/jobs?q=&location=&workMode=&jobType=&cursor=&limit=` | Public search (no login) |
| `GET /api/v1/jobs/{id}` | Public job details – explicit field allow-list; hidden job → 404 |
| `/jobs`, `/jobs/{id}` | Public search and job details (proxy returns a real 404 for hidden jobs); candidates get the apply panel |
| `GET · PUT /api/v1/candidate/profile` · `GET · POST /api/v1/candidate/cvs` · `DELETE /api/v1/candidate/cvs/{id}` · `GET …/download-url` | Candidate profile and CVs |
| `GET · POST /api/v1/candidate/applications` · `GET /api/v1/candidate/applications/{id}` | Apply; my applications |
| `/candidate/profile`, `/candidate/applications`, `/candidate/applications/{id}` | Candidate pages (proxy-gated) |

`/privacy` is a **placeholder** – real policy text is needed before launch.

---

## 9. Security and privacy controls

| Control | Implementation |
|---|---|
| Passwords | Argon2id (OWASP params), ≥ 12 chars, breached-password check (5-char hash prefix sent) |
| Sessions | DB sessions, `HttpOnly; SameSite=Lax`, `Secure` in production; revoked on password reset |
| Account enumeration | Sign-up and password-reset responses identical whether or not the email exists |
| CSRF | `Origin` must equal our origin on every unsafe `/api/*` request (403 problem+json) |
| Authorisation | Three layers: proxy gates `/admin/*`, `/employer/*` (307 / 404 before rendering) · `apiRoute` checks session + role · services check role + ownership |
| Not revealing other roles' pages | Wrong role gets the same `404` as a page that doesn't exist |
| Concurrent edits | Guarded updates: a decision applies only if the status is still what the admin saw (`409 STATE_CHANGED`) |
| XSS | Per-request nonce CSP, `strict-dynamic`, no `unsafe-inline` scripts in production |
| Headers | HSTS (prod), nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, COOP |
| Rate limiting | 10/min on sign-in, sign-up, reset; 120/min default; stored in DB |
| Suspended users | Cannot create sessions (checked on every login) |
| Audit | Sign-up, login, failed login, reset-request, reset, company verified / rejected / suspended / reinstated, job approved / rejected / removed; append-only in DB |
| Logs | JSON, request id, sensitive keys redacted (also one level deep) |
| Secrets | Env vars only; Zod-validated; gitleaks in CI; demo seed refuses non-local DBs |
| Third parties | Better Auth telemetry **off**; HIBP receives only a hash prefix |

---

## 10. Quality: tests, CI and QA

| Layer | Tool | Count | Runs |
|---|---|---|---|
| Unit | Vitest | 118 | `npm test`, CI |
| Integration (real Postgres + Mailpit + s3mock) | Vitest | 83 | `npm run test:integration`, CI |
| End-to-end (real browser, prod build) | Playwright | 40 | `npm run test:e2e`, **local only** |
| Performance | `scripts/perf-search.ts` | 4 queries × 50 runs | `npm run perf:search`, local (rolls back) |

**CI pipeline** (`.github/workflows/ci.yml`, every PR and push to `main`):
format → lint → typecheck → unit tests with coverage → build · migrations + schema-drift check +
integration tests (Postgres 17, Mailpit) · `npm audit` + gitleaks secret scan.

**QA reports:**
- [qa/2026-11-12-auth-qa-report.md](08-testing/qa-reports/2026-11-12-auth-qa-report.md) – authentication, 11/11 passed, 17 screenshots.
- [qa/2026-11-12-company-verification-qa-report.md](08-testing/qa-reports/2026-11-12-company-verification-qa-report.md) – company
  verification, 5/5 passed, 12 screenshots; found wrong status codes on role pages (fixed via proxy gate).
- [qa/2026-11-12-jobs-qa-report.md](08-testing/qa-reports/2026-11-12-jobs-qa-report.md) – jobs (sprint S1), 6/6 passed,
  13 screenshots; found late cross-field validation errors (fixed).
- [qa/2026-11-12-job-search-qa-report.md](08-testing/qa-reports/2026-11-12-job-search-qa-report.md) – public search (sprint S2),
  13/13 passed, 9 screenshots; found 5 issues incl. 'Log in to apply' losing the job (fixed).
- [qa/2026-11-12-candidate-apply-qa-report.md](08-testing/qa-reports/2026-11-12-candidate-apply-qa-report.md) – profile, CVs,
  applying (S3), 9/9 passed, 11 screenshots; found the form/API `null` bug and missing phone navigation (fixed).

---

## 11. Environments, running and demo users

| Environment | Where | Status |
|---|---|---|
| Local | Docker Compose (Postgres 17, Mailpit) + `npm run dev` | ✅ |
| CI | GitHub Actions (Postgres + Mailpit services) | ✅ |
| Staging | – | Not planned for MVP (PO decision) |
| Production | Fly.io or Render (decision pending) + Neon + R2 + Resend + Sentry | ⬜ |

```bash
npm install && cp .env.example .env.local      # then set BETTER_AUTH_SECRET
npm run db:up && npm run db:deploy && npm run db:seed
npm run dev                                     # http://localhost:3000 · inbox http://localhost:8025
```

**Demo users** (local only): candidate, employer and admin – emails and the shared password are in
[`prisma/demo-users.ts`](../prisma/demo-users.ts). Recreate with `npm run db:seed`.

**Demo data** (local only): `npm run db:seed:demo` creates 100 fictional companies (80 verified, 10 pending,
6 rejected, 4 suspended), one employer each (`employer001…100@demo-data.jobconnect.local`), 50 candidates with
profiles, 2 admins and ~210 jobs in every status – deterministic, re-runnable, same password.
`-- --clean-test-data` also removes leftovers of automated test runs.

---

## 12. Decision log

Architecture decisions (detail in [08 §9](06-architecture/01-system-architecture.md#9-architecture-decision-records-summary)):

| ID | Decision |
|---|---|
| ADR-001 | Modular monolith on Next.js |
| ADR-002 | PostgreSQL + Prisma |
| ADR-003 | Postgres full-text search, no search engine |
| ADR-004 | Better Auth with database sessions |
| ADR-005 | pg-boss queue in Postgres (not built yet) |
| ADR-006 | Docker container hosting in the UK (host TBD) |
| ADR-007 | S3-compatible private storage for files |
| ADR-008 | Nonce CSP; every route renders per request |

Product and implementation decisions:

| ID | Date | Decision | By |
|---|---|---|---|
| D-01 | 2026-11-11 | AI agents are "Could" – after the core marketplace | PO |
| D-02 | 2026-11-11 | Job location = free text + `work_mode` (on-site/hybrid/remote) | PO |
| D-03 | 2026-11-11 | Salary has a period (year / day / hour) | PO |
| D-04 | 2026-11-11 | Job search is public; login needed to apply | PO |
| D-05 | 2026-11-11 | Candidate email/phone visible to employers from SHORTLISTED only | PO |
| D-06 | 2026-11-11 | Audit entries deleted after 24 months | PO |
| D-07 | 2026-11-11 | Employer account deletion via support only (MVP); no staging env; candidate mobile tab bar | PO |
| D-08 | 2026-11-11 | Prisma 7.10 stable, not the 8.0 release candidate | Dev |
| D-09 | 2026-11-12 | New dependencies pinned to releases ≥ 2 weeks old | Dev |
| D-10 | 2026-11-12 | "Unverified" = `email_verified = false`, not a status | Dev |
| D-11 | 2026-11-12 | No account enumeration: duplicate sign-up looks like success (replaces `409 EMAIL_TAKEN`) | Dev |
| D-12 | 2026-11-12 | Display name stored on `user` (required by Better Auth) | Dev |
| D-13 | 2026-11-12 | E2E tests run against a production build without the external HIBP check | Dev |
| D-14 | 2026-11-12 | Stay on TypeScript 5.9 until typescript-eslint supports TS 7 | Dev |
| D-15 | 2026-11-12 | Build remaining MVP one feature per PR, pausing for review; deployment after features | PO |
| D-16 | 2026-11-12 | Role areas are gated in the proxy before rendering (streamed pages can't change status after 200) | Dev |
| D-17 | 2026-11-12 | Decision emails are best-effort after commit (failure logged, decision stands) until the worker exists | Dev |
| D-18 | 2026-11-12 | Employers can edit a verified company without re-review; rejected → back to review; suspended → no edits | Dev |
| D-19 | 2026-11-12 | Each role has its own home: `/employer`, `/admin`; candidates stay on `/` until job search exists | Dev |
| D-20 | 2026-11-12 | Per-record "not yours" on logged-in pages shows the not-found screen with HTTP 200 (streaming); the API returns 404 and is the boundary. Public pages must return a real 404 or `noindex` | Dev |
| D-21 | 2026-11-12 | Job deadline = end of the chosen day, 23:59:59 UTC (±1 h vs UK time in summer) | Dev |
| D-22 | 2026-11-12 | Employers may draft jobs before their company is verified; submit/resume/approve need VERIFIED | Dev |
| D-23 | 2026-11-12 | Admins can remove jobs that are pending, published or paused; removal is final | Dev |
| D-24 | 2026-11-12 | Search uses a STORED generated `search_vector` (Prisma: `Unsupported` + `dbgenerated`) + partial GIN index. An expression index alone measured p95 463 ms when the planner skipped it | Dev |
| D-25 | 2026-11-12 | The public visibility rule is one SQL fragment (`VISIBLE_JOB`) used by search, details and the proxy | Dev |
| D-26 | 2026-11-12 | Public job pages: the proxy returns a real 404 for hidden jobs (fixes D-20 for public pages) | Dev |
| D-27 | 2026-11-12 | Login and logout use a full page load (fixes a navigation race; logout also drops cached private pages) | Dev |
| D-28 | 2026-11-12 | Decision emails are sent after the response (`sendEmailInBackground`), never delaying the admin's click | Dev |
| D-29 | 2026-11-12 | Candidates' home is `/jobs`; search works without JavaScript (plain GET form, "Load more" link) | Dev |
| D-30 | 2026-11-12 | Local/CI file storage is `adobe/s3mock` 5.2.3 (MinIO/SeaweedFS publish no versioned tags); production R2. s3mock doesn't verify signatures – link expiry verified on R2 in S6 | Dev |
| D-31 | 2026-11-12 | CV type is detected from the file's bytes; filenames are cleaned and stored only for display; files live under random keys | Dev |
| D-32 | 2026-11-12 | Applied migrations are immutable; CI rejects PRs that change them (after defect #28) | Dev |
| D-33 | 2026-11-12 | Candidates without a profile/CV are sent to Profile & CVs and back (not an inline upload in the apply sheet) | Dev |
| D-34 | 2026-11-12 | Demo data is generated, not hand-written: fictional names, `.example` websites, fixed random seed, local-only guard; test-leftover cleanup only by test-only email prefixes | Dev |

---

## 13. Change log

Newest first. One row per merged pull request.

| Date | PR | Change |
|---|---|---|
| 2026-11-12 | *(open)* | Project guide (`PROJECT_GUIDE.md`): every folder and file explained, request flow, history, "where do I find…"; linked from README and docs map |
| 2026-11-12 | *(open)* | Demo data: `npm run db:seed:demo` – 100 companies, 152 users, ~210 jobs; optional cleanup of automated-test leftovers |
| 2026-11-12 | #22 | Step-by-step system walkthrough: 62 screenshots in journey order (docs/04-design/07) |
| 2026-11-12 | #21 | Sprint S3: candidate profile, CVs (s3mock/R2), apply with snapshot, My applications + timeline, candidate tab bar, employer application counts; CI migration guard; nullish form fix |
| 2026-11-12 | #20 | Fix: restore 4 applied migrations altered by the docs restructure (`fix/restore-applied-migrations`) |
| 2026-11-12 | #19 | Documentation set: folders 01–12 (moved with history), 39 new documents, 63 Mermaid diagrams, generated test catalogue |
| 2026-11-12 | #18 | Sprint S2: public job search (stored search_vector, GIN), job details, public API, real 404s; login/logout/mobile fixes |
| 2026-11-12 | #17 | Jobs – sprint S1 (core loop step 2) + docs sync |
| 2026-11-12 | *(open)* | Agile methodology document (docs/07-implementation/01-agile-methodology.md): Scrum + XP for a solo developer, DoR/DoD, backlog epics E0–E10, sprint plan S1–S6 |
| 2026-11-12 | *(open)* | Company profile + admin verification (core loop step 1): `industry`/`company` tables, `/api/v1` foundation, employer + admin screens, decision emails, proxy role gate, QA report |
| 2026-11-12 | #13 | Software Solution Document, `CLAUDE.md` docs rule, PR template |
| 2026-11-12 | #11 | Demo users (`db:seed`), Playwright E2E suite, auth QA report; fixed email link wrapping and admin home text |
| 2026-11-12 | #10 | Reverted TypeScript 7 → 5.9 (lint crashed); Dependabot ignores TS majors |
| 2026-11-12 | #8 | Dependabot: minor/patch updates (Better Auth 1.7.18, nodemailer 10.4, React 19.3.1, …) |
| 2026-11-12 | #4 | Dependabot: TypeScript 7 (**broke lint on `main`**, reverted by #10) |
| 2026-11-12 | #7 | Security baseline (proxy, CSP, CSRF, headers, logging), append-only audit log, authentication UI |
| 2026-11-12 | #3 | Dependabot: ESLint 10 |
| 2026-11-11 | #6 | Prisma 7 + PostgreSQL, init migration (citext, UTC), DB health check, integration CI job |
| 2026-11-11 | #1 | Next.js scaffold, tooling, CI, Dependabot |
| 2026-11-11 | – | Phase 2 design docs (08–11) and PO decisions |
| 2026-11-11 | – | Phase 1 discovery docs (01–07) |

---

## 14. Open questions, risks and next steps

### Open questions
| # | Question | Owner |
|---|---|---|
| Q1 | Production app host: Fly.io (~£3–6/mo) or Render free tier | PO |
| Q2 | Production domain name (needed for email SPF/DKIM/DMARC) | PO |
| Q3 | Brand / logo | PO |
| Q4 | If the breach-check service (HIBP) is down: block sign-up (current) or allow with a warning? | PO |
| Q5 | Enable GitHub branch protection (require PR + green CI on `main`)? | PO |
| Q6 | Should editing a **verified** company's name or website send it back for review (fraud risk), as job edits do (BR-JOB-004)? Current: no (D-18) | PO |

### Known gaps and risks
| Gap | Impact | Plan |
|---|---|---|
| E2E tests not in CI | Browser regressions caught only locally | Add Playwright job |
| No branch protection | A red PR can be merged (happened with #4) | Q5 |
| Privacy policy is a placeholder | Launch blocker (GDPR) | Write before release |
| Emails sent inline | Slow SMTP slows sign-up | pg-boss worker |
| ESLint 10 vs `eslint-config-next` peer range | Lint may break on a future update | Watch Dependabot PRs |
| Local `npm ci` while the dev server runs can leave a broken `node_modules` | Pages 500 locally | Stop `npm run dev` before reinstalling |
| Playwright upgrades need a matching browser | E2E can't start | Run `npx playwright install chromium` after Dependabot bumps Playwright |
| No general rate limit on public `/api/v1/jobs` yet | Scraping (R-07) | Add before release (API design §5) |
| One intermittent E2E failure (admin reject, response >5 s) not reproduced after D-28 | Possible flaky test | Timing logs added; watch CI |
| E2E data accumulates in the local DB (test companies) | Cluttered local queue | Acceptable locally; CI will use a fresh DB |

### Next steps (in order)
Planned as sprints S1–S6 in [docs/07-implementation/01-agile-methodology.md §15](07-implementation/01-agile-methodology.md#15-release-plan).

1. ~~Company profile + admin verification queue~~ ✅
2. ~~Jobs: create, submit, approve, publish~~ ✅ (sprint S1)
3. ~~Public job search and details~~ ✅ (sprint S2)
4. ~~Candidate profile, CV upload, apply, application history~~ ✅ (sprint S3)
5. Employer applicant management; account deletion + erasure worker
6. Deployment, backups, Sentry; E2E in CI

---

## 15. How this document is maintained

- **Every pull request that changes the project updates this document** in the same PR:
  status (§1), traceability (§6), as-built sections (§3–§11) when affected, decision log (§12),
  change log (§13) and open questions (§14).
- Detailed design changes go into the numbered document they belong to (e.g. a new table in
  docs/05-design/01-data-model.md), and this document links to them.
- The pull-request template includes a checkbox for this; `CLAUDE.md` instructs the AI assistant to
  do the same. The full Definition of Done is in [docs/07-implementation/01-agile-methodology.md §9](07-implementation/01-agile-methodology.md#9-definition-of-done).
- Bump **Version** (minor for content, major for restructuring) and **Last updated** on every change.

---

## 16. Document index

The full map, with every document, is **[docs/README.md](README.md)**. For a guided tour of the whole
repository (every folder and file), read **[PROJECT_GUIDE.md](../PROJECT_GUIDE.md)**. Folders:

| Folder | Contents |
|---|---|
| [01-overview](01-overview/) | Project overview (context diagram), glossary |
| [02-product-strategy](02-product-strategy/) | Vision, personas, user journeys, value proposition, scope & risks, MVP, roadmap & KPIs |
| [03-requirements](03-requirements/) | Functional, non-functional, business rules, use cases, user stories, traceability matrix |
| [04-design](04-design/) | UX/UI: UI flows, sitemap & navigation, user-flow diagrams, screen inventory, design system, accessibility, **step-by-step walkthrough (62 screenshots)** |
| [05-design](05-design/) | Technical: data model, API, state diagrams, sequence diagrams, ER diagram, security design |
| [06-architecture](06-architecture/) | System architecture, C4 diagrams, ADR log (ADR-001…011), technology stack |
| [07-implementation](07-implementation/) | Agile methodology, codebase structure, coding standards, development workflow, feature guide |
| [08-testing](08-testing/) | Test strategy, test plan, test-case catalogue (generated), performance, defect log, QA reports |
| [09-deployment](09-deployment/) | Environments, CI/CD pipeline, release process, database migrations, deployment plan |
| [10-operations](10-operations/) | Runbook, monitoring & alerting, backup & recovery, incident response, maintenance |
| [11-content](11-content/) | Content guidelines, UX copy & messages, email catalogue, legal content, SEO & metadata |
| [12-audit](12-audit/) | Audit logging, security (OWASP), privacy/GDPR, accessibility (WCAG), dependencies & licences |

All diagrams are Mermaid (63 at version 1.5, each verified to render).
