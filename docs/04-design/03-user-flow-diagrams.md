# User-Flow Diagrams

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Journeys | J1–J5 in [01-ui-flows.md §3](01-ui-flows.md#3-core-loop-journeys) |

Screens are rectangles, decisions diamonds, system actions rounded. ⬜ = planned.

## J0 – Sign up and confirm email ✅

```mermaid
flowchart TD
  A[/register/] --> B{Valid form?<br/>role · name · email · password ≥ 12 · privacy ticked}
  B -- no --> B1[Errors next to fields] --> A
  B -- yes --> C{Password in a breach?}
  C -- yes --> C1[“This password has appeared in a data breach”] --> A
  C -- no --> D{Email already registered?}
  D -- no --> E([Create account, send 24-h link])
  D -- yes --> E2([Email the existing owner instead])
  E & E2 --> F[/check-email – same screen either way/]
  F --> G[Click link in email] --> H{Link valid?}
  H -- yes --> I[/login?verified=1 “Your email is confirmed”/]
  H -- no --> I2[/login “link expired” – log in to get a new one/]
```

## J1 – Employer gets verified ✅

```mermaid
flowchart TD
  A[/employer: “Create your company profile”/] --> B[/employer/company form/]
  B --> C{Valid?}
  C -- no --> B
  C -- yes --> D([Company = PENDING]) --> E[/employer: “Being reviewed”/]
  E --> F{Admin decision}
  F -- verify --> G([Email: verified]) --> H[/employer: “Verified” → Manage your jobs/]
  F -- reject + reason --> I([Email with reason]) --> J[/employer: “Changes needed” + reason/]
  J --> K[Edit and resubmit] --> D
  H -- admin suspends --> L[/employer: “Suspended” – no edits/]
```

## J2 – Admin verifies a company and approves a job ✅

```mermaid
flowchart TD
  A[/admin dashboard: pending counts/] --> B[/admin/companies – oldest first/]
  B --> C[/Review company/] --> D{Decision}
  D -- verify --> E[Confirm] --> Z([Commit + audit + email]) --> B
  D -- reject --> F[Reason ≥ 10 chars] --> E
  A --> G[/admin/jobs – oldest first/] --> H[/Review job “as candidates will see it”/]
  H --> I{Company still verified?}
  I -- no --> I1[Approval refused – reject or remove]
  I -- yes --> J{Decision}
  J -- approve --> K[Confirm] --> Z2([Publish + audit + email]) --> G
  J -- reject / remove --> L[Reason] --> K
  Z & Z2 -.another admin decided first.-> X[“Updated by someone else. Refresh.”]
```

## J3 – Employer posts and manages a job ✅

```mermaid
flowchart TD
  A[/employer/jobs/] --> B[/Post a job/] --> C{All fields valid?<br/>location unless remote · max ≥ min · future date}
  C -- no --> C1[All errors at once] --> B
  C -- yes --> D([DRAFT]) --> E{Company verified?}
  E -- no --> E1[“Submitting is available once your company is verified”]
  E -- yes --> F{Deadline 1–90 days?}
  F -- no --> F1[Edit the date first] --> B
  F -- yes --> G([PENDING_APPROVAL]) --> H{Admin}
  H -- approve --> I([PUBLISHED – live]) 
  H -- reject --> R([REJECTED + reason]) --> R1[Edit] --> D
  I --> P{Employer action}
  P -- pause --> Q([PAUSED]) -- resume --> I
  P -- close --> X([CLOSED – final])
  P -- edit title/text/salary --> G
  P -- extend deadline only --> I
```

## J4 – Candidate finds a job ✅ and applies ⬜

```mermaid
flowchart TD
  A[/ or /jobs: keyword · place · filters/] --> B{Results?}
  B -- none --> B1[“No jobs match” + Clear filters] --> A
  B -- yes --> C[/Job card list – Load more/] --> D[/jobs/id details/]
  D --> E{Logged in as candidate?}
  E -- no --> F[Log in to apply] --> F1[/login?next=/jobs/id/] --> D
  E -- yes --> G[Apply ⬜] --> H{Has profile + CV? ⬜}
  H -- no --> H1[Inline: name + CV upload ⬜] --> I
  H -- yes --> I{Already applied? deadline passed? ⬜}
  I -- yes --> I1[“Applied on … · status” / “Applications closed” ⬜]
  I -- no --> J[Send application ⬜] --> K[/“Application sent” → My applications ⬜/]
```

## J5 – Employer reviews applicants ⬜ (S4)

```mermaid
flowchart TD
  A[/employer/jobs/id/applicants ⬜/] --> B[Open applicant ⬜] --> C[Download CV snapshot – 5-min link ⬜]
  B --> D{Move to ⬜}
  D -- forward only --> E([UNDER_REVIEW → SHORTLISTED → INTERVIEW → OFFERED ⬜])
  D -- reject + optional message --> F([REJECTED – final ⬜])
  E & F --> G([Candidate sees the new status ⬜])
```
