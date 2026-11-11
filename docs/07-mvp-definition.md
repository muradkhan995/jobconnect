# JobConnect – MVP Definition

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 1 – Discovery |
| Last updated | 2026-11-11 |

---

## 1. MVP Goal
Deliver the smallest version of JobConnect that completes the **core recruitment loop** end to end, securely and lawfully.

## 2. Core Loop
1. Employer registers, creates a company profile, and is verified by an admin.
2. Employer creates a job and submits it; admin approves it.
3. Candidate registers, uploads a CV, searches, and applies.
4. Employer views applicants, downloads CVs, and changes application status.
5. Candidate sees the updated status in their application history.

## 3. Hypothesis the MVP Tests
> Candidates value **seeing the real status** of their applications, and employers
> value managing **all applicants for a job in one place**.

## 4. MVP Feature Set

### Authentication
FR-AUTH-001 to FR-AUTH-008 (registration, verification, login, logout, password reset).

### Candidate
| Included | Deferred to Release 1.0 |
|---|---|
| FR-CAN-001 Basic profile | FR-CAN-002/003/004 Education, employment, skills |
| FR-CAN-005 CV upload | FR-CAN-009 Bookmarks |
| FR-CAN-006 Keyword search | FR-CAN-014 Withdraw |
| FR-CAN-007 Filters: **location and job type only** | FR-CAN-007 Remaining filters |
| FR-CAN-008 Job details | FR-CAN-015/016 Notifications |
| FR-CAN-010/011/012 Apply (once, before deadline) | |
| FR-CAN-013 Application history with status | |
| FR-CAN-017 Account settings | |
| FR-CAN-018 Delete account (GDPR) | |

### Employer
| Included | Deferred to Release 1.0 |
|---|---|
| FR-EMP-001/003 Company profile | FR-EMP-002 Logo upload |
| FR-EMP-004 Verification required | FR-EMP-012 Auto-close on deadline |
| FR-EMP-006 to 011 Create, submit, edit, pause, close jobs | FR-EMP-016 Applicant filters |
| FR-EMP-013 Jobs with application counts | FR-EMP-019 Interview invites |
| FR-EMP-014/015 Applicant list, profile, CV download | FR-EMP-020 Internal notes |
| FR-EMP-017/018 Change status, reject | FR-EMP-021 Notifications |
| | FR-EMP-023 Dashboard |

### Administrator
| Included | Deferred to Release 1.0 |
|---|---|
| FR-ADM-001 Secure admin creation (setup script) | FR-ADM-002 MFA |
| FR-ADM-004/005/006 Find, view, suspend users | FR-ADM-012/013 Job reports |
| FR-ADM-007/008 Company verification queue | FR-ADM-016/017 Dashboard and statistics |
| FR-ADM-009/010/011 Job approval queue, removal | FR-ADM-020 Audit log viewer |
| FR-ADM-014 Industries (seeded, editable) | |
| FR-ADM-019/021 Audit logging (append-only) | |

### Non-Functional
**All NFRs with priority M are included.** Security, privacy and backups are never deferred.

### Excluded from MVP
All AI agents · all Could (C) items · everything in Scope A3 (Out of Scope).

## 5. MVP Acceptance Criteria (Definition of "MVP Done")
- [ ] The full core loop runs as an automated end-to-end test (Playwright).
- [ ] An employer cannot see another company's applicants (automated test).
- [ ] A candidate cannot see another candidate's applications (automated test).
- [ ] All MVP requirements have passing automated tests.
- [ ] CI pipeline passes on `main`.
- [ ] The application is deployed to a public URL over HTTPS.
- [ ] A database backup has been restored successfully at least once.

## 6. Release Roadmap
| Release | Contents | Rough estimate* |
|---|---|---|
| **0.1 – MVP** | Core loop (this document) | ~8 sprints (≈ 16 weeks) |
| **1.0 – Full** | Remaining Must + Should requirements | ~4 sprints |
| **1.1+ – Smart** | AI agents (Candidate first, lowest risk) and Could items | ~3–4 sprints |

\* Assumes 10 hours/week, 2-week sprints. This is a rough "T-shirt size" estimate,
refined in Phase 2 with story points, and again after we measure real velocity.