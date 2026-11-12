# QA Report – Jobs: posting, approval and moderation (core loop step 2, sprint S1)

| Field | Value |
|---|---|
| Date | 2026-11-12 |
| Build | branch `feat/jobs`, production build (`next build && next start`) |
| Browser | Chromium (Playwright 1.65.0), 1280 × 720 |
| Test suite | [`e2e/jobs.spec.ts`](../../e2e/jobs.spec.ts) – `npm run test:e2e` |
| Result | ✅ **6 / 6 passed** (whole suite 22 / 22), 3 consecutive runs |

Requirements: FR-EMP-006 … 011, FR-ADM-009 … 011, BR §3 (BR-JOB-002/003/004/005/007/008/010), BR-CMP-001.

## Results

| # | Check | Requirement | Result | Screenshot |
|---|---|---|---|---|
| 40 | Verified employer with no jobs sees an empty list and "Post a job" | FR-EMP-013 | ✅ | [40](screenshots/40-employer-jobs-empty.png) |
| 41 | Empty/invalid form shows **all** problems at once, incl. "location unless remote" and "max ≥ min" | BR-JOB-003/010 | ✅ | [41](screenshots/41-job-form-validation.png) |
| 42–43 | Valid job saved as a draft; salary shown as "£45,000 – £55,000 per year" | FR-EMP-006/007 | ✅ | [42](screenshots/42-job-form-filled.png) · [43](screenshots/43-job-draft-saved.png) |
| 44–45 | Submit asks for confirmation; job becomes "Waiting for approval" | FR-EMP-008 | ✅ | [44](screenshots/44-job-submit-confirm.png) · [45](screenshots/45-job-waiting-for-approval.png) |
| 46–48 | Admin dashboard counts; queue; preview "as candidates will see it"; approve | FR-ADM-009/010 | ✅ | [46](screenshots/46-admin-dashboard-jobs.png) · [47](screenshots/47-admin-job-review.png) · [48](screenshots/48-admin-job-approved.png) |
| 49 | Employer emailed "Your job is live"; list shows "Live" | FR-ADM-010 | ✅ | [49](screenshots/49-employer-job-live.png) |
| 50 | Editing a live job explains the re-approval rule; a salary change sends it back to "Waiting for approval" | BR-JOB-004 | ✅ | [50](screenshots/50-job-edit-live-notice.png) |
| 51–52 | Admin rejects with a reason; employer is emailed and sees "Changes needed" + reason | FR-ADM-010 | ✅ | [51](screenshots/51-admin-job-reject-reason.png) · [52](screenshots/52-employer-job-changes-needed.png) |
| 53 | Another company's employer: not-found screen, none of the job in the HTML; API returns `404` | NFR-SEC-003 | ✅ | – |

Also covered by integration tests (real Postgres, 17 tests): drafts before verification but no submit,
1–90-day submit window, past dates refused, cross-company isolation (404 on read, edit and actions),
material vs. deadline-only edits, rejected → draft, pause/resume, close is final, admin remove with
reason, no approval for a company suspended meanwhile, **two simultaneous admin decisions → one wins**,
oldest-first queue, DB CHECKs (salary range, location unless remote, reason when removed).

## Issues found and fixed during this QA round

| Issue | Fix |
|---|---|
| Cross-field errors (location, salary range) only appeared **after** all other fields were valid – users met new errors after fixing the first batch | Zod `when` option: cross-field checks run as soon as the fields they read are valid; unit tests guard it |
| A rejected job showed "No actions available" above the "Edit job" link | Employer panel hidden when there is no lifecycle action |
| Playwright 1.65 (Dependabot) needed a new browser build; E2E couldn't start | `npx playwright install chromium` – add to the local setup notes |

## Known limitation (decision D-20)
Opening another company's job page shows the not-found screen with HTTP **200** (Next.js streaming: a check
inside a page runs after the status is sent). No data is exposed and the **API returns 404**. Public pages in
sprint S2 must not have this problem for search engines (real 404 or `noindex`).

## Not covered yet
- Automatic closing at the deadline (BR-JOB-006 – Release 1.0); search will hide expired jobs anyway.
- Hiding jobs of a suspended company in search (BR-CMP-003) – arrives with search (S2).
- Application counts per job (FR-EMP-013) – arrive with applications (S3).
