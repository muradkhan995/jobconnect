# Test Plan – Release 0.1 (MVP)

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Release criteria | [02-product-strategy/06-mvp-definition.md §5](../02-product-strategy/06-mvp-definition.md) |

## 1. Scope
In: everything in the MVP feature set. Out: Could items, AI agents, browsers other than Chromium until S6.

## 2. Plan by sprint

| Sprint / feature | New test focus | Evidence | Status |
|---|---|---|---|
| Foundation + auth | Sign-up rules, verification, login/logout, reset, rate limits, CSP, CSRF, audit triggers | [auth QA report](qa-reports/2026-11-12-auth-qa-report.md) | ✅ |
| Company verification | Ownership, lifecycle, concurrent decisions, proxy status codes | [company QA report](qa-reports/2026-11-12-company-verification-qa-report.md) | ✅ |
| S1 Jobs | Lifecycle, material edits, 1–90 day window, cross-company 404 | [jobs QA report](qa-reports/2026-11-12-jobs-qa-report.md) | ✅ |
| S2 Search | Visibility rule, stemming, filters, pagination, real 404, p95 | [search QA report](qa-reports/2026-11-12-job-search-qa-report.md) | ✅ |
| S3 Profile, CVs, apply | File type by content, size, 5-CV limit, signed URLs, apply once, deadline, snapshot | – | ⬜ |
| S4 Applicants | "Employer can't see another company's applicants", forward-only status, contact details from SHORTLISTED | – | ⬜ |
| S5 GDPR | Erasure ≤ 30 days, anonymisation, suspension hides jobs | – | ⬜ |
| S6 Release | Full core-loop E2E in CI, backup restore, Firefox/Safari/Edge, accessibility audit | – | ⬜ |

## 3. MVP acceptance tests (release gate)

| Criterion (docs/02-product-strategy/06-mvp-definition.md §5) | Test | Status |
|---|---|---|
| Full core loop as one automated E2E | `e2e/core-loop.spec.ts` | ⬜ S4 |
| Employer cannot see another company's applicants | integration + E2E | ⬜ S4 |
| Candidate cannot see another candidate's applications | integration + E2E | ⬜ S3 |
| All MVP requirements have passing tests | [traceability matrix](../03-requirements/06-traceability-matrix.md) | 🟡 |
| CI passes on main | GitHub Actions | ✅ |
| Deployed over HTTPS | smoke test | ⬜ S6 |
| Backup restored once | restore drill | ⬜ S6 |

## 4. Entry / exit
- **Entry (per sprint):** stories meet the Definition of Ready; previous sprint's suite green.
- **Exit (per sprint):** [test strategy §5](01-test-strategy.md#5-exit-criteria-per-increment).
- **Release exit:** every row in §3 ✅; no open Critical/Major defects ([05-defect-log.md](05-defect-log.md)).

## 5. Risks to testing
| Risk | Mitigation |
|---|---|
| E2E not in CI yet | Run locally per PR; add a CI job in S6 |
| Single browser | Add WebKit/Firefox projects in S6 |
| Machine sleep breaks long local runs | Treat 10+-minute test times as environmental; re-run, don't ignore real failures |
