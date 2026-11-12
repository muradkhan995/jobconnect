# JobConnect – Business Rules

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 1 – Discovery |
| Last updated | 2026-11-11 |

---

## 1. User Account Lifecycle

```
UNVERIFIED ──(verifies email)──▶ ACTIVE ◀──(admin reactivates)── SUSPENDED
                                   │  └──────(admin suspends)──────▶ ▲
                                   └──(user deletes account)──▶ DELETED
```

| ID | Rule |
|---|---|
| BR-USR-001 | An UNVERIFIED account cannot log in. Unverified accounts are deleted after 7 days. |
| BR-USR-002 | A SUSPENDED user cannot log in; their published jobs (if employer) are hidden from search. |
| BR-USR-003 | When a candidate account is DELETED, their profile and CVs are erased and their applications are anonymised ("Candidate removed"). |
| BR-USR-004 | In this release, employers request account deletion through support; an admin performs it. Their open jobs are closed and their personal data (user account, email) is erased; the company name stays on past applications so candidates keep their history. |

## 2. Company Verification Lifecycle

```
PENDING ──(admin verifies)──▶ VERIFIED ──(admin suspends)──▶ SUSPENDED
   ▲  └──(admin rejects)──▶ REJECTED        ▲                  │
   └──────(employer edits & resubmits)──┘     └──(admin reinstates)┘
```

| ID | Rule |
|---|---|
| BR-CMP-001 | Only a VERIFIED company can submit jobs for approval. |
| BR-CMP-002 | Rejection and suspension require a reason, which is shown to the employer. |
| BR-CMP-003 | When a company is SUSPENDED, all its published jobs are hidden from search. Existing applications are kept. |

## 3. Job Lifecycle

```
DRAFT ──(employer submits)──▶ PENDING_APPROVAL ──(admin approves)──▶ PUBLISHED ◀──▶ PAUSED
  ▲                               │                                    │  (employer)    │
  └──(employer edits)── REJECTED ◀┘(admin rejects)                     ▼                ▼
                                                     CLOSED ◀──(employer / deadline passes)
                                                     REMOVED ◀──(admin, policy violation)
```

| ID | Rule |
|---|---|
| BR-JOB-001 | Only PUBLISHED jobs appear in search and accept applications. |
| BR-JOB-002 | The deadline must be at least 1 day and at most 90 days in the future when submitted. |
| BR-JOB-003 | Salary range is required; minimum must be ≤ maximum. Each job states a salary period (per year, day or hour). Currency defaults to GBP. |
| BR-JOB-010 | Every job has a work mode (ON_SITE, HYBRID or REMOTE). Location is required unless the job is REMOTE. |
| BR-JOB-004 | Editing a PUBLISHED job's title, description, requirements or salary sends it back to PENDING_APPROVAL (hidden until re-approved). Existing applications are kept. |
| BR-JOB-005 | Extending the deadline of a PUBLISHED job does not require re-approval. |
| BR-JOB-006 | A PUBLISHED or PAUSED job becomes CLOSED automatically when its deadline passes. |
| BR-JOB-007 | CLOSED and REMOVED are final. An employer cannot reopen them; they can duplicate the job as a new DRAFT. |
| BR-JOB-008 | REMOVED requires an admin reason, shown to the employer. |
| BR-JOB-009 | Employers can still manage applications for CLOSED jobs. |

## 4. Application Lifecycle

```
APPLIED ──▶ UNDER_REVIEW ──▶ SHORTLISTED ──▶ INTERVIEW ──▶ OFFERED
   │             │               │              │
   ├─────────────┴───────────────┴──────────────┴──▶ REJECTED   (employer)
   └─────────────────────────────────────────────▶ WITHDRAWN   (candidate)
```

| ID | Rule |
|---|---|
| BR-APP-001 | A candidate can apply only if: logged in as an ACTIVE candidate, the job is PUBLISHED, the deadline has not passed, and they have at least one CV. |
| BR-APP-002 | A candidate can apply to a given job only once, ever, including after withdrawing. |
| BR-APP-003 | The CV selected when applying is stored as a snapshot; later changes to the candidate's CVs do not affect submitted applications. |
| BR-APP-004 | Employers move applications **forward only** and may skip states (e.g. APPLIED → SHORTLISTED). Moving backwards is not allowed in this release. |
| BR-APP-005 | OFFERED, REJECTED and WITHDRAWN are final states. |
| BR-APP-006 | A candidate can withdraw any application that is not in a final state. |
| BR-APP-007 | Every status change notifies the candidate and is recorded with who, when and (for REJECTED) an optional message. |
| BR-APP-008 | Internal notes are visible only to the employer who owns the job and are never shown to the candidate. |
| BR-APP-009 | Applications for jobs CLOSED more than 12 months ago are anonymised (GDPR storage limitation). |
| BR-APP-010 | An employer sees a candidate's email address only once the application is SHORTLISTED or later (data minimisation). Name, CV and cover letter are visible from APPLIED. |
| BR-AUD-001 | Audit log entries are kept for 24 months, then deleted automatically by a system job. No user, including admins, can delete them earlier. |

## 5. Permission Matrix (who can do what)

**Key:** ✅ = allowed · 🔒 own = only their own records · ❌ = not allowed

| Action | Visitor | Candidate | Employer | Admin |
|---|---|---|---|---|
| Search & view published jobs | ✅ | ✅ | ✅ | ✅ |
| Apply for a job | ❌ | ✅ | ❌ | ❌ |
| View / withdraw applications | ❌ | 🔒 own | ❌ | ❌ |
| Edit candidate profile & CVs | ❌ | 🔒 own | ❌ | ❌ |
| Edit company profile | ❌ | ❌ | 🔒 own | ❌ |
| Create / edit / pause / close jobs | ❌ | ❌ | 🔒 own company | ❌ |
| View applicants & download CVs | ❌ | ❌ | 🔒 own company's jobs | 🔒 only via report (logged) |
| Change application status / add notes | ❌ | ❌ | 🔒 own company's jobs | ❌ |
| Report a job | ❌ | ✅ | ✅ | ❌ |
| Verify companies / approve jobs | ❌ | ❌ | ❌ | ✅ |
| Suspend users / remove jobs | ❌ | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ❌ | ✅ (read-only) |

## 6. Default Decisions (Product Owner may override)
- D1: Candidates cannot re-apply after withdrawing (BR-APP-002).
- D2: Salary range is mandatory on every job (BR-JOB-003).
- D3: Material edits to a published job require re-approval (BR-JOB-004).
- D4: Application status moves forward only (BR-APP-004).
- D5: "HIRED" / offer acceptance tracking is out of scope for this release.