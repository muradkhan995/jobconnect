# QA Report – Company profile & verification (core loop step 1)

| Field | Value |
|---|---|
| Date | 2026-11-12 |
| Build | branch `feat/company-verification`, production build (`next build && next start`) |
| Browser | Chromium (Playwright 1.64.1), 1280 × 720 |
| Test suite | [`e2e/company.spec.ts`](../../e2e/company.spec.ts) – `npm run test:e2e` |
| Result | ✅ **5 / 5 passed** (whole suite 16 / 16), 3 consecutive runs |

Requirements: FR-EMP-001, FR-EMP-003, FR-EMP-004, FR-ADM-007, FR-ADM-008, BR §2, BR-CMP-002.

## Results

| # | Check | Requirement | Result | Screenshot |
|---|---|---|---|---|
| 20 | New employer lands on their dashboard and is asked to create a company | FR-EMP-001 | ✅ | [20](screenshots/20-employer-no-company.png) |
| 21 | Empty form: every invalid field is marked with a plain-language message | NFR-UX | ✅ | [21](screenshots/21-company-form-validation.png) |
| 22 | Submitting creates the company as "Being reviewed" | FR-EMP-001/004 | ✅ | [22](screenshots/22-company-being-reviewed.png) |
| 23–24 | Admin dashboard and verification queue (oldest first, status tabs with counts) | FR-ADM-007 | ✅ | [23](screenshots/23-admin-dashboard.png) · [24](screenshots/24-admin-verification-queue.png) |
| 25–26 | Admin review page; rejecting needs a reason ≥ 10 chars; confirmation names the consequence | FR-ADM-008, BR-CMP-002 | ✅ | [25](screenshots/25-admin-review-company.png) · [26](screenshots/26-admin-reject-with-reason.png) |
| 27 | Employer is emailed the rejection with the reason | FR-ADM-008 | ✅ | [27](screenshots/27-email-company-rejected.png) |
| 28 | Employer dashboard shows "Changes needed" and the admin's reason | BR-CMP-002 | ✅ | [28](screenshots/28-employer-changes-needed.png) |
| 29 | Editing a rejected company resubmits it ("Saving sends your company back…") | BR §2 | ✅ | [29](screenshots/29-employer-edit-and-resubmit.png) |
| 30–31 | Admin verifies; employer sees "Verified" | FR-ADM-008 | ✅ | [30](screenshots/30-admin-company-verified.png) · [31](screenshots/31-employer-verified.png) |
| 32 | An employer opening `/admin/companies` gets a real `404` | NFR-SEC-003 | ✅ | – |

Also covered by integration tests (real Postgres, 14 tests): one company per employer, employers see only
their own company, admin-only decisions, lifecycle transitions, mandatory reasons, audit entry in the same
transaction, **two simultaneous decisions → exactly one wins, no stray audit entry**, DB CHECK constraints.

## Issues found and fixed during this QA round

| Issue | Fix |
|---|---|
| Role-gated pages returned **200** (not 404/307) in production builds: with streaming, a check inside the page runs after the status is sent. No data leaked (empty not-found page), but status codes were wrong and the login redirect needed JavaScript | Role areas `/admin/*` and `/employer/*` are now checked in the proxy before rendering → real `307`/`404`; pages and API still check too |
| Stale validation message stayed visible after the admin typed a valid reason | Errors clear as soon as the field is edited (company form and decision panel) |
| Local install was missing `@tailwindcss/turbopack/dist/index.mjs` (left over from an interrupted `npm ci`); all pages returned 500 locally | Clean reinstall. CI unaffected (it installs fresh) |
| E2E suite exceeded the 10-logins-per-minute limit (limit works as designed) | Tests clear local rate-limit counters before each test |

## Not covered yet
- Suspend / reinstate through the UI (covered by integration tests only).
- Hiding a suspended company's jobs (BR-CMP-003) – arrives with jobs.
- Employer emails are sent inline and best-effort; failures are logged, not retried (worker pending).
