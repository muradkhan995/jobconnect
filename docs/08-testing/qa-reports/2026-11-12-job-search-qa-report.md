# QA Report – Public job search and job details (sprint S2, core loop step 3 – finding jobs)

| Field | Value |
|---|---|
| Date | 2026-11-12 |
| Build | branch `feat/job-search`, production build (`next build && next start`) |
| Browser | Chromium (Playwright 1.65.0), 1280 × 720 and phone 360 × 780 |
| Test suite | [`e2e/search.spec.ts`](../../../e2e/search.spec.ts) – `npm run test:e2e` |
| Result | ✅ **13 / 13 passed** (whole suite 31 / 31) |

Requirements: FR-CAN-006, FR-CAN-007 (MVP filters), FR-CAN-008, BR-JOB-001, BR-CMP-003, BR-USR-002,
NFR-PERF-001, NFR-UX-001, NFR-SEC-005.

## Results

| # | Check | Requirement | Result | Screenshot |
|---|---|---|---|---|
| 60–61 | Search from the home page; results with company "✓ Verified", salary, closing date | FR-CAN-006 | ✅ | [60](screenshots/60-home-search.png) · [61](screenshots/61-search-results.png) |
| 62–63 | Work-mode filter narrows results; no match → "Try removing a filter" + Clear filters | FR-CAN-007 | ✅ | [62](screenshots/62-search-filtered-remote.png) · [63](screenshots/63-search-no-results.png) |
| 64 | 23 results: 20 shown, "Load more" shows the last 3 (plain link, no JavaScript needed) | API §3 | ✅ | – |
| 65–66 | Job details for a visitor ("Log in to apply"); after login the candidate **returns to the same job** | FR-CAN-008 | ✅ | [65](screenshots/65-job-details-visitor.png) · [66](screenshots/66-job-details-candidate.png) |
| 67 | Paused, unknown and malformed job URLs: **real HTTP 404** on the page and the API; nothing leaked | BR-JOB-001, D-26 | ✅ | – |
| 68 | Candidates land on job search after login; "Find jobs" in the menu | docs/04-design/01-ui-flows.md §2 | ✅ | – |
| 69–70 | Phone (360 px): no sideways scrolling; header links on one line; sticky "Log in to apply" bar | NFR-UX-001 | ✅ | [69](screenshots/69-search-mobile-360px.png) · [70](screenshots/70-job-details-mobile-360px.png) |
| 71 | No Content Security Policy violations on search and details | NFR-SEC-005 | ✅ | – |
| 72 | Public API: search (`total`, `nextCursor`) and details without internal fields | API §4.4 | ✅ | – |

**Integration tests (real Postgres, 18):** the visibility rule hides draft, pending, paused, rejected,
closed, removed, past-deadline, suspended-company and suspended-owner jobs **in search, details and the
proxy alike**; stemming ("nurse" finds "Nursing"); location is case-insensitive and treats `%`/`_` literally;
multiple work modes/job types; SQL-looking input is harmless; pagination visits every result once, newest
first, with a correct total; public shape has no internal fields.

**Performance (NFR-PERF-001):** `npm run perf:search` – 10,000 published jobs (+3,000 unpublished), 50 runs
per query, everything rolled back afterwards:

| Query | p95 |
|---|---|
| Browse newest | 4.2 ms |
| Keyword | 4.5 ms |
| Keyword + location + work mode | 8.8 ms |
| Location only | 7.5 ms |

Target: < 500 ms. ✅

## Issues found and fixed during this sprint

| Issue | How it was found | Fix |
|---|---|---|
| Keyword search p95 **463 ms** (limit 500): the planner skipped the expression index and re-computed every row's search document | Performance script + `EXPLAIN ANALYZE` | Stored generated `search_vector` column + GIN index → **4.5 ms** (D-24) |
| "Log in to apply" lost the job: after login candidates landed on `/jobs` | E2E 65–66 | Login page honours `next`; login uses a full page load (D-27) |
| Logout from `/jobs` sometimes left the user on the old page (navigation race) | E2E 09–10 | Full page load on logout – also drops cached private pages (D-27) |
| Header links wrapped onto two lines at 360 px | Screenshot review (70) | No-wrap links, tighter spacing; E2E checks link height |
| `?next=/\evil.com` would have been accepted as a same-site path | Writing the shared `safeNext` tests | Rejected; unit tests for open-redirect patterns |
| ESLint scanned Playwright's generated report and failed | Local lint after a failed E2E run | Test output folders ignored by ESLint and Prettier |
| Intermittent: an admin's "reject" occasionally got no response within 5 s (2 of 5 runs once) | Repeated E2E runs | Decision emails no longer delay the response (D-28); timing logs added. **Not reproduced in 10 later runs; root cause not proven** – watch CI |

## Not covered yet
- General rate limit on the public search API (API design §5) – before release.
- Salary, experience and industry filters (FR-CAN-007 remainder) – Release 1.0.
- Applying for a job – sprint S3.
- Firefox / Safari / Edge; screen-reader walkthrough.
