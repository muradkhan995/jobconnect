# User Journeys

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Based on | [Personas](02-personas.md), [UI flows](../04-design/01-ui-flows.md) J1–J5 |

Journey maps show how each persona experiences JobConnect: the steps, how they feel (score 1–5, higher is
better) and where the product must remove friction. Steps marked *(planned)* are not built yet.

## 1. Amira – candidate: from search to a decision

```mermaid
journey
  title Amira finds a job and follows her application
  section Discover
    Searches "software engineer, Manchester": 4: Amira
    Filters to hybrid, full-time: 4: Amira
    Sees "Verified employer" on every job: 5: Amira
  section Decide
    Reads salary, closing date, requirements: 4: Amira
    Clicks "Log in to apply", logs in, returns to the job: 4: Amira
  section Apply (planned S3)
    Picks a saved CV, adds a cover letter: 4: Amira
    Sends in two clicks: 5: Amira
  section Follow up (planned S3–S4)
    Sees "Under review" then "Shortlisted": 5: Amira
    Gets an email on every change (Release 1.0): 5: Amira
```

| Pain point (persona) | Where the journey removes it |
|---|---|
| Applies to 30 jobs, hears back from 3 | Status timeline on every application (FR-CAN-013) |
| Re-types her history on every site | Saved profile and CVs (FR-CAN-001/005) |
| Once applied to a scam | Only verified companies, admin-approved jobs (FR-EMP-004, FR-ADM-009) |

## 2. David – employer: from sign-up to shortlist

```mermaid
journey
  title David gets verified, posts a job and manages applicants
  section Get verified
    Signs up as an employer, confirms email: 3: David
    Creates the company profile: 3: David
    Waits for verification, gets an email: 3: David
  section Post a job
    Writes the job, saves a draft: 4: David
    Submits for approval: 4: David
    Job goes live, email confirms it: 5: David
  section Manage applicants (planned S4)
    Sees all applicants in one list: 5: David
    Downloads CVs, moves people forward: 5: David
    Rejects with an optional message: 4: David
```

| Pain point | Where the journey removes it |
|---|---|
| Applications lost in email | One applicant list per job (FR-EMP-014) |
| No overview for hiring managers | Status per applicant, dashboard (FR-EMP-023, Release 1.0) |
| Unclear why something was refused | Every rejection by an admin carries a reason (BR-CMP-002, BR-JOB-008) |

## 3. Sophie – administrator: keeping scams out

```mermaid
journey
  title Sophie verifies companies and approves jobs
  section Daily queues
    Opens the dashboard: pending counts: 5: Sophie
    Reviews the oldest company first: 4: Sophie
    Verifies or rejects with a reason: 4: Sophie
  section Job approval
    Previews the job exactly as candidates see it: 5: Sophie
    Approves, or rejects / removes with a reason: 4: Sophie
  section Accountability
    Every decision is in the audit log: 5: Sophie
    Suspends a fraudulent company in one step: 4: Sophie
```

## 4. Moments that matter

```mermaid
flowchart LR
  subgraph Candidate
    C1[First search result] --> C2[Trust: verified badge] --> C3[Apply in ≤ 3 clicks] --> C4[First status change]
  end
  subgraph Employer
    E1[Verification email] --> E2[Job is live] --> E3[First applicant]
  end
  subgraph Admin
    A1[Empty queue] --> A2[Scam caught before going live]
  end
```

Each "moment that matters" has a measure in [07-roadmap-and-kpis.md](07-roadmap-and-kpis.md).
