# State Diagrams

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Rules | [03-requirements/03-business-rules.md](../03-requirements/03-business-rules.md) §1–4 |
| Code | Transition tables: `src/modules/company/rules.ts`, `src/modules/job/rules.ts` |

Every lifecycle is one transition table in code; services refuse anything not in the table and apply changes
with a **guarded update** (`WHERE status = <expected>`), so two people can't both win (docs/05-design/01-data-model.md §4).

## 1. User account ✅ (BR §1)

```mermaid
stateDiagram-v2
  [*] --> Unverified: sign up
  Unverified --> Active: confirms email (link ≤ 24 h)
  Unverified --> [*]: not confirmed in 7 days ⬜ (cleanup job)
  Active --> Suspended: admin suspends (reason) ⬜ S5
  Suspended --> Active: admin reactivates ⬜ S5
  Active --> Deleted: user deletes account ⬜ S5
  Deleted --> [*]: erased ≤ 30 days ⬜
  note right of Unverified
    Stored as email_verified = false,
    not as a status value (D-10)
  end note
  note right of Suspended
    Cannot log in (checked when a
    session is created) ✅
  end note
```

## 2. Company verification ✅ (BR §2)

```mermaid
stateDiagram-v2
  [*] --> PENDING: employer creates profile
  PENDING --> VERIFIED: admin verifies
  PENDING --> REJECTED: admin rejects (reason)
  REJECTED --> PENDING: employer edits = resubmits
  VERIFIED --> SUSPENDED: admin suspends (reason)
  SUSPENDED --> VERIFIED: admin reinstates
  note right of SUSPENDED
    All its jobs hidden from search (BR-CMP-003);
    employer can't edit
  end note
```

## 3. Job ✅ (BR §3)

```mermaid
stateDiagram-v2
  [*] --> DRAFT: employer saves
  DRAFT --> PENDING_APPROVAL: submit (company VERIFIED, deadline 1–90 days)
  PENDING_APPROVAL --> PUBLISHED: admin approves (company still VERIFIED)
  PENDING_APPROVAL --> REJECTED: admin rejects (reason)
  REJECTED --> DRAFT: employer edits
  PUBLISHED --> PAUSED: employer pauses
  PAUSED --> PUBLISHED: employer resumes (deadline in future)
  PUBLISHED --> PENDING_APPROVAL: material edit (title, text, salary)
  PAUSED --> PENDING_APPROVAL: material edit
  PUBLISHED --> CLOSED: employer closes / deadline passes ⬜
  PAUSED --> CLOSED: employer closes
  PENDING_APPROVAL --> REMOVED: admin removes (reason)
  PUBLISHED --> REMOVED: admin removes (reason)
  PAUSED --> REMOVED: admin removes (reason)
  CLOSED --> [*]
  REMOVED --> [*]
```

Visible to the public only when `PUBLISHED` **and** deadline in the future **and** company VERIFIED **and**
owner ACTIVE (`VISIBLE_JOB`, D-25).

## 4. Application ⬜ (BR §4 – sprint S3/S4)

```mermaid
stateDiagram-v2
  [*] --> APPLIED: candidate applies (once per job, before deadline)
  APPLIED --> UNDER_REVIEW
  APPLIED --> SHORTLISTED: may skip forward
  UNDER_REVIEW --> SHORTLISTED
  SHORTLISTED --> INTERVIEW
  INTERVIEW --> OFFERED
  APPLIED --> REJECTED: employer (optional message)
  UNDER_REVIEW --> REJECTED
  SHORTLISTED --> REJECTED
  INTERVIEW --> REJECTED
  APPLIED --> WITHDRAWN: candidate (Release 1.0)
  UNDER_REVIEW --> WITHDRAWN
  SHORTLISTED --> WITHDRAWN
  INTERVIEW --> WITHDRAWN
  OFFERED --> [*]
  REJECTED --> [*]
  WITHDRAWN --> [*]
```

Forward-only; OFFERED, REJECTED and WITHDRAWN are final (BR-APP-004/005).
