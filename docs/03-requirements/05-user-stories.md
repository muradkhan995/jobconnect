# User Stories

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Format | [07-implementation/01-agile-methodology.md §6](../07-implementation/01-agile-methodology.md#6-writing-backlog-items) |

Stories per epic, with acceptance criteria (AC) in Given / When / Then form and the evidence that proves
them. ✅ done · ⬜ planned.

## E1 Authentication ✅

| ID | Story | Acceptance criteria | Evidence |
|---|---|---|---|
| JC-101 ✅ | As a **visitor** I want to create an account as a candidate or employer so that I can use JobConnect. | Given the form is valid and the privacy policy accepted, when I submit, then I see "Check your email" and get a 24-hour link. Given I choose a weak or breached password, then I see why. | E2E 02–04; `auth.int.test.ts` |
| JC-102 ✅ | As a **user** I want to confirm my email so that my account is activated. | Given an unconfirmed account, when I log in, then I'm refused and a new link is sent. When I click the link, then I see "Your email is confirmed". | E2E 05–07 |
| JC-103 ✅ | As a **user** I want to log in and out. | Given correct details, when I log in, then I land on my role's home (or the page I came from). Given wrong details, then a generic error. When I log out, then I'm a visitor again. | E2E 08–10, 15–16, 65–66 |
| JC-104 ✅ | As a **user** I want to reset a forgotten password. | Given any email, then the answer is the same. Given the emailed link, when I set a new password, then all my sessions end. | E2E 11–14 |

## E2 Company verification ✅

| ID | Story | Acceptance criteria | Evidence |
|---|---|---|---|
| JC-201 ✅ | As **David** I want to create my company profile so that it can be verified. | Given valid details, when I submit, then it is "Being reviewed". Given I already have one, then 409. | E2E 20–22; `company/service.int.test.ts` |
| JC-202 ✅ | As **Sophie** I want a verification queue, oldest first. | Then pending companies are listed oldest first with how long they've waited. | E2E 23–24 |
| JC-203 ✅ | As **Sophie** I want to verify or reject with a reason. | Given I reject without a reason, then I'm asked for one. When I decide, then the employer is emailed and the decision is audited. | E2E 25–31 |
| JC-204 ✅ | As **David** I want to fix and resubmit a rejected profile. | Given REJECTED, when I save, then it returns to review and the reason clears. | E2E 28–29 |

## E3 Jobs & moderation ✅

| ID | Story | Acceptance criteria | Evidence |
|---|---|---|---|
| JC-301 ✅ | As **David** I want to write job drafts. | Given any company status, when I save, then a draft exists. All field errors appear at once. | E2E 40–43 |
| JC-302 ✅ | As **David** I want to submit a job for approval. | Given VERIFIED and a deadline 1–90 days away, then "Waiting for approval". Otherwise a clear 422 reason. | E2E 44–45; integration |
| JC-303 ✅ | As **Sophie** I want to approve, reject or remove jobs. | Given a decision, then the employer is emailed; reasons required for reject/remove; a suspended company's job can't be approved. | E2E 46–52 |
| JC-304 ✅ | As **David** I want to edit a live job. | Given a title/text/salary change, then it goes back to approval; given only a later deadline, then it stays live. | E2E 50; integration |
| JC-305 ✅ | As **David** I want to pause, resume and close jobs. | Pause hides it; resume shows it again; close is final. | Integration |

## E4 Job search ✅

| ID | Story | Acceptance criteria | Evidence |
|---|---|---|---|
| JC-401 ✅ | As **Amira** I want to search jobs by keyword and place. | Given "nurse", then "Nursing" jobs match. Results are newest first, 20 at a time with a total. | E2E 60–64; `search.int.test.ts` |
| JC-402 ✅ | As **Amira** I want to filter by work mode and job type. | Given filters, then only matching jobs show; no match → "Clear filters". | E2E 62–63 |
| JC-403 ✅ | As **Amira** I want to read a job before applying. | Then I see company (verified), salary, closing date, requirements; hidden jobs are a 404. | E2E 65–67 |

## E5 Profile, CVs, applying ✅ (S3)

| ID | Story | Acceptance criteria | Evidence |
|---|---|---|---|
| JC-501 ✅ | As **Amira** I want a basic profile. | Name required; headline, location, phone optional and editable. | E2E 80–81 |
| JC-502 ✅ | As **Amira** I want to upload up to 5 CVs. | PDF/DOCX only (checked by content), ≤ 5 MB; 6th refused (also under concurrency); download via a 5-minute link. | unit `cv-file`, int, E2E 82–83 |
| JC-503 ✅ | As **Amira** I want to apply with a saved CV. | 2 clicks from job details; once per job ever; refused after the deadline; the CV is snapshotted. | int, E2E 84–86 |
| JC-504 ✅ | As **Amira** I want to see all my applications with status. | List with job, company, status, date; detail with timeline; nobody else can see them. | int, E2E 85, 87–88 |

## E6–E8 ⬜
Written at refinement before S4–S6: applicant management (FR-EMP-013…018), account deletion and admin
users (FR-CAN-017/018, FR-ADM-004…006), deployment and operations (NFR-REL, NFR-OBS).
