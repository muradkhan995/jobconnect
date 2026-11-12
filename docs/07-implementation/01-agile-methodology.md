# JobConnect – Agile Methodology

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Current |
| Applies to | The whole project – discovery, design, build, release and operation |
| Owner | Product Owner |
| Last updated | 2026-11-12 |

> How JobConnect is planned, built, checked and delivered. The *what* lives in the requirements
> (docs/03-requirements/01-functional-requirements.md–07); the *current state* lives in the [Software Solution Document](../00-solution-document.md).

---

## Contents
1. [Approach in one page](#1-approach-in-one-page)
2. [Roles and responsibilities](#2-roles-and-responsibilities)
3. [Lifecycle and phases](#3-lifecycle-and-phases)
4. [Sprint cadence and ceremonies](#4-sprint-cadence-and-ceremonies)
5. [Product backlog](#5-product-backlog)
6. [Writing backlog items](#6-writing-backlog-items)
7. [Estimation and capacity](#7-estimation-and-capacity)
8. [Definition of Ready](#8-definition-of-ready)
9. [Definition of Done](#9-definition-of-done)
10. [Engineering practices (XP)](#10-engineering-practices-xp)
11. [Workflow: from idea to production](#11-workflow-from-idea-to-production)
12. [Quality and testing](#12-quality-and-testing)
13. [Change control](#13-change-control)
14. [Risk management](#14-risk-management)
15. [Release plan](#15-release-plan)
16. [Metrics](#16-metrics)
17. [Working with an AI pair programmer](#17-working-with-an-ai-pair-programmer)
18. [Increment log](#18-increment-log)
19. [Templates](#19-templates)

---

## 1. Approach in one page

JobConnect uses **Scrum for planning** and **Extreme Programming (XP) for engineering**, scaled down
for a **solo, part-time, mentored developer**.

| Principle | What it means here |
|---|---|
| Deliver working software in small increments | **One feature per pull request**; each one is usable, tested and documented when merged |
| The Product Owner decides *what*, the team decides *how* | Every scope/priority choice is recorded as a PO decision with a date |
| Prioritise ruthlessly | MoSCoW; the MVP is only the **core recruitment loop** (docs/02-product-strategy/06-mvp-definition.md) |
| Build quality in, don't inspect it in | Tests and CI on every change; security and privacy are never deferred |
| Simple design, no speculation (YAGNI) | Build for today's requirement; ADRs record trade-offs (risk R-11) |
| Inspect and adapt | Review after every increment; retrospective every sprint; risks reviewed every sprint |
| Documentation is part of the work | A change isn't done until `docs/00` and the relevant design doc describe it |

**Why this blend:** Scrum gives a predictable rhythm and a clear owner of priorities; XP practices
(TDD, CI, small releases, refactoring, simple design) keep a one-person codebase safe to change. Heavy
Scrum overhead (daily stand-up meetings, multiple reviewers) is replaced by lightweight written versions.

---

## 2. Roles and responsibilities

| Role | Who | Responsibilities |
|---|---|---|
| **Product Owner (PO)** | Project owner | Owns the vision and backlog order; decides scope, priorities and open questions; accepts or rejects increments; approves merges to `main` |
| **Developer** | Solo developer, with an AI pair programmer (§17) | Designs, builds and tests increments; keeps docs current; raises risks and questions early |
| **Scrum Master / Mentor** | Mentor | Protects the process; runs the retrospective; challenges scope creep and over-engineering |
| **Stakeholders** | Candidates, employers, admins (personas), regulator (GDPR) | Represented through personas (docs/02-product-strategy/02-personas.md) and NFRs (docs/03-requirements/02-non-functional-requirements.md); later through user feedback |

In a solo project one person may hold several roles. When they do, the **decision is still written down
under the role that made it** (PO vs Dev) – see the decision log in docs/00 §12.

---

## 3. Lifecycle and phases

```
Phase 1 – Discovery ──▶ Phase 2 – Design ──▶ Phase 3 – Build (sprints) ──▶ Release 0.1 ──▶ 1.0 ──▶ 1.1+
 vision, personas,       architecture,         increments: one feature      MVP live       full     AI
 requirements, rules,    data model, API,      per PR, each tested,                        Must +   agents
 scope, risks, MVP       UI flows              documented, reviewed                        Should
 docs/02-product-strategy/01-vision.md–07              docs/06-architecture/01-system-architecture.md–11            docs/00 tracks progress
```

| Phase | Output | Exit criteria | Status |
|---|---|---|---|
| 1 – Discovery | docs/02-product-strategy/01-vision.md–07 | MVP defined; risks registered; PO sign-off | ✅ Done 2026-11-11 |
| 2 – Design | docs/06-architecture/01-system-architecture.md–11 | Architecture, data model, API, UI flows agreed; PO decisions recorded | ✅ Done 2026-11-11 |
| 3 – Build | Working increments | All MVP acceptance criteria met (docs/02-product-strategy/06-mvp-definition.md §5) | 🟡 In progress |
| Release 0.1 | Public MVP | Deployed over HTTPS; backup restored once; core-loop E2E green | ⬜ |

Discovery and design are **not frozen**: they are revisited through change control (§13) whenever an
increment teaches us something new – e.g. the "no account enumeration" decision (D-11) changed the API
design during build.

---

## 4. Sprint cadence and ceremonies

**Sprint length:** 2 weeks · **Capacity:** ~10 hours/week (≈ 20 hours per sprint).

| Ceremony | When | Time-box | Output |
|---|---|---|---|
| **Backlog refinement** | Mid-sprint, ongoing | 1 h | Next items meet the Definition of Ready (§8) |
| **Sprint planning** | Day 1 | 1 h | Sprint goal + sprint backlog sized to capacity |
| **Async stand-up** | Each working session | 5 min | Written note: done / next / blocked (in the PR or a log) |
| **Increment review** | After every merged PR | 15 min | PO tries the feature (demo users, QA screenshots) and accepts or raises changes |
| **Sprint review** | Last day | 30 min | Demo of the sprint's increments; backlog re-ordered |
| **Retrospective** | Last day | 30 min | 1–3 concrete improvements, added to the next sprint |
| **Risk review** | In the retrospective | 10 min | 🔴 risks re-scored (docs/02-product-strategy/05-scope-and-risks.md Part B) |

The **async stand-up** replaces a daily meeting: one person has nobody to meet daily, but writing three
lines keeps work visible and makes blocks obvious early.

---

## 5. Product backlog

The backlog is ordered by the PO. Items are grouped into **epics** that map to requirement IDs, so
every item traces back to docs/03-requirements/01-functional-requirements.md–05.

| Epic | Scope (requirements) | Release | Status |
|---|---|---|---|
| E0 Foundation | Scaffold, CI, DB, security baseline, logging, audit (NFR-SEC/OBS/MNT, FR-ADM-019/021) | 0.1 | ✅ |
| E1 Authentication | FR-AUTH-001 … 008 | 0.1 | ✅ |
| E2 Company verification | FR-EMP-001/003/004, FR-ADM-007/008 | 0.1 | ✅ |
| E3 Jobs & moderation | FR-EMP-006 … 011, FR-ADM-009 … 011 | 0.1 | ✅ (sprint S1) |
| E4 Job search | FR-CAN-006 … 008 | 0.1 | ✅ (sprint S2, in review) |
| E5 Candidate profile, CVs, applying | FR-CAN-001/005/010 … 013 | 0.1 | ⬜ Next (S3) |
| E6 Applicant management | FR-EMP-013 … 015/017/018 | 0.1 | ⬜ |
| E7 Accounts & GDPR | FR-CAN-017/018, FR-ADM-004 … 006, erasure worker (NFR-PRV-003) | 0.1 | ⬜ |
| E8 Deployment & operations | Hosting, backups, Sentry, E2E in CI (NFR-REL/OBS) | 0.1 | ⬜ |
| E9 Release 1.0 features | Remaining Must + Should (docs/02-product-strategy/06-mvp-definition.md "Deferred") | 1.0 | ⬜ |
| E10 AI agents | FR-*-AI-* (Could) | 1.1+ | ⬜ |

**Where the backlog lives:** Jira (as planned in docs/02-product-strategy/05-scope-and-risks.md A5), one ticket per story, linked to its epic and
requirement IDs. Until the Jira connector is set up, this table plus docs/00 §6 (traceability) is the
source of truth.

---

## 6. Writing backlog items

**User story** – who, what, why, plus testable acceptance criteria in *Given / When / Then* form.

> **JC-301 – Submit a job for approval** · Epic E3 · FR-EMP-008, BR-CMP-001, BR-JOB-002
>
> **As** David (employer) **I want** to submit my draft job for approval **so that** it can be published
> to candidates.
>
> **Acceptance criteria**
> - **Given** my company is VERIFIED and my draft's deadline is 1–90 days away, **when** I submit,
>   **then** the job becomes "Waiting for approval" and appears in the admin queue.
> - **Given** my company is not verified, **when** I try to submit, **then** I see
>   "Available once your company is verified" and nothing changes (`422 COMPANY_NOT_VERIFIED`).
> - **Given** the deadline is outside 1–90 days, **when** I submit, **then** the deadline field explains
>   the rule (`422 DEADLINE_OUT_OF_RANGE`).
>
> **Notes:** audit entry not required (employer action); admin sees it oldest first.

**Other item types:**

| Type | Use for | Example |
|---|---|---|
| Story | User-visible behaviour | "Employer verifies company" |
| Technical task | Enabler with no direct user value | "pg-boss worker for emails" |
| Spike | Time-boxed research (max 4 h) | "CSP nonces with Cache Components" (→ ADR-008) |
| Bug | Defect found in QA or use | "Email link didn't wrap on phones" |
| Change request | New/changed requirement (§13) | "Add work mode to jobs" (D-02) |

**INVEST check:** each story should be Independent, Negotiable, Valuable, Estimable, Small (fits in one
PR / ≤ 5 points) and Testable.

---

## 7. Estimation and capacity

- **Story points** on the Fibonacci scale **1, 2, 3, 5, 8**. 8 means "split it".
- Reference stories: **1** = add a field with its validation and test; **3** = one screen calling an
  existing endpoint; **5** = a new lifecycle (table + service + API + screens + tests), e.g. company
  verification.
- **Velocity** is measured, not assumed: average of the last 3 sprints. Until then, plan ~12 points
  per sprint and adjust after the first real sprint.
- Plan to **80 % of capacity**; the rest absorbs bugs, Dependabot PRs and surprises (e.g. the
  TypeScript 7 breakage, PR #4 → #10).

---

## 8. Definition of Ready

A backlog item may enter a sprint when:

- [ ] It traces to requirement IDs (FR/NFR/BR) or a recorded decision.
- [ ] Acceptance criteria are written and testable.
- [ ] UX is clear: the screen exists in docs/04-design/01-ui-flows.md or a sketch is attached.
- [ ] Data/API impact is known (docs/05-design/01-data-model.md, docs/05-design/02-api-design.md) or the story includes updating them.
- [ ] Open questions are answered by the PO, or explicitly deferred with a default.
- [ ] It is estimated and ≤ 5 points.

---

## 9. Definition of Done

An increment is **done** only when **all** of these are true:

**Code**
- [ ] TypeScript strict, ESLint (zero warnings) and Prettier pass.
- [ ] Server-side validation (Zod) and authorisation (proxy / `apiRoute` / service) for every new path.
- [ ] No secrets in code; no personal data in logs or audit metadata.

**Tests**
- [ ] Unit tests for rules and validation.
- [ ] Integration tests against real PostgreSQL for data and permission rules (incl. "other user can't").
- [ ] E2E test with screenshots for every new user journey; whole suite green locally.
- [ ] CI green on the PR: format, lint, types, unit, integration, build, `npm audit`, secret scan.

**Product**
- [ ] Acceptance criteria demonstrated; QA report (`docs/08-testing/qa-reports/`) for user-facing features.
- [ ] Works at 360 px; labels, focus and error messages accessible.
- [ ] Security headers/CSP unaffected (no new CSP violations).

**Documentation**
- [ ] `docs/00-solution-document.md` updated (status, traceability, decisions, change log).
- [ ] Affected design doc updated (docs/03-requirements/01-functional-requirements.md–11); README if setup changed.

**Delivery**
- [ ] Merged to `main` through a PR after CI is green; branch deleted.

The **MVP's own Definition of Done** (release level) is docs/02-product-strategy/06-mvp-definition.md §5.

---

## 10. Engineering practices (XP)

| Practice | How we apply it |
|---|---|
| **Small releases** | One feature per PR; `main` is always releasable |
| **Continuous integration** | GitHub Actions on every PR and push to `main` |
| **Test-first where it pays** | Rules, validation and permissions are written test-first; UI is covered by E2E |
| **Simple design / YAGNI** | No Redis, no search engine, no microservices until needed (ADR-003/005, R-11) |
| **Refactoring** | Allowed in any PR that keeps tests green; large refactors get their own PR |
| **Collective ownership via review** | Every PR reviewed by the PO (product) and mentor (code) before merge |
| **Coding standards** | Enforced by tools (ESLint, Prettier, TS strict) and `CLAUDE.md` |
| **Sustainable pace** | Plan to 80 % capacity; no "hero" sprints |

---

## 11. Workflow: from idea to production

```
Idea / requirement
   │  refinement: story + acceptance criteria + estimate        (Definition of Ready)
   ▼
Sprint backlog ──▶ branch `feat/<name>` from main
   │  build in small commits: rules + tests → service → API → screens → e2e + screenshots
   │  docs: docs/00 + affected design doc
   ▼
Push ──▶ Pull request (template checklist) ──▶ CI ──▶ green?
   │                                                    │ no → fix on the branch
   ▼ yes
Increment review by PO (demo users, QA report) ──▶ merge to main ──▶ delete branch
   ▼
Release (0.1+): deploy main → smoke test → backup check
```

**Board columns:** Backlog → Ready → In progress (max **1**) → In review (PR open) → Done.
A work-in-progress limit of 1 is deliberate: one developer finishing one thing beats starting three.

**Branch names:** `feat/…` feature · `fix/…` bug · `docs/…` documentation · `chore/…` tooling.
**Commit messages:** Conventional Commits (`feat(company): …`, `fix(deps): …`).

---

## 12. Quality and testing

| Layer | Purpose | Tool | Gate |
|---|---|---|---|
| Static checks | Types, lint, format | TS, ESLint, Prettier | CI |
| Unit | Business rules, validation, helpers | Vitest | CI |
| Integration | DB rules, permissions, races, audit | Vitest + Postgres + Mailpit | CI |
| End-to-end | User journeys in a real browser + screenshots | Playwright (prod build) | Local now; CI in E8 |
| Security | Dependencies, secrets, CSP | npm audit, gitleaks, E2E CSP check | CI / E2E |
| Manual QA | Visual review of screenshots; exploratory | QA report per feature | Increment review |

**Bug policy:** a bug found in QA is fixed **in the same PR** if it is in that feature; otherwise it
becomes a backlog item with severity (Critical blocks release; Major next sprint; Minor ordered by PO).

---

## 13. Change control

Based on docs/02-product-strategy/05-scope-and-risks.md A5, adapted to how work actually flows:

1. A change is raised (backlog item labelled `change-request`, or a question in a PR).
2. The developer assesses impact: effort, affected requirements, risks, docs to change.
3. The **PO decides**: accept (with MoSCoW priority), defer, or reject – recorded in docs/00 §12 with a date.
4. If accepted: requirement docs (03–05), design docs (08–11), backlog and docs/00 are updated **in the
   PR that implements it**.

**Developer decisions** that don't change scope (e.g. pinning Prisma 7 instead of an RC, D-08) are made
by the developer, recorded as "Dev" in the decision log, and reversible by the PO.

---

## 14. Risk management

- The risk register is docs/02-product-strategy/05-scope-and-risks.md Part B (probability × impact).
- 🔴 risks are reviewed **every retrospective**; new risks found during build go into docs/00 §14
  ("Known gaps and risks") and, if lasting, into docs/02-product-strategy/05-scope-and-risks.md.
- Examples of risks that materialised and how the process caught them:

| Risk | What happened | Caught by | Response |
|---|---|---|---|
| R-13 Third-party change | Dependabot TypeScript 7 broke lint on `main` | CI on `main` | Reverted (PR #10); Dependabot rule; branch-protection question Q5 |
| R-04 Security | Role pages returned 200 instead of 404 in production builds | E2E against a prod build | Proxy role gate (D-16) |
| R-10 / R-13 External service | Breach-check outage blocks sign-up | E2E flake investigation | PO question Q4 |

---

## 15. Release plan

| Release | Content | Sprints (estimate) | Exit criteria |
|---|---|---|---|
| **0.1 – MVP** | Epics E0–E8 (core loop) | ~6 remaining | docs/02-product-strategy/06-mvp-definition.md §5 all ticked |
| **1.0 – Full** | E9: remaining Must + Should | ~4 | All Must/Should FRs and NFRs done |
| **1.1+ – Smart** | E10: AI agents, Could items | ~3–4 | AI NFRs (docs/03-requirements/02-non-functional-requirements.md §9) met |

**Remaining MVP sprint plan** (one goal per sprint; re-planned at every sprint review):

| Sprint | Goal | Epic |
|---|---|---|
| S1 | Employers post jobs; admins approve them | E3 |
| S2 | Anyone can search and read published jobs | E4 |
| S3 | Candidates build a profile, upload CVs and apply | E5 |
| S4 | Employers manage applicants; candidates see real status | E6 |
| S5 | Account deletion, erasure worker, admin user management | E7 |
| S6 | Deployed, backed up, monitored; E2E in CI → **Release 0.1** | E8 |

Estimates are re-checked against measured velocity after S1 (§7).

---

## 16. Metrics

Kept small and useful for one developer:

| Metric | Why | Where |
|---|---|---|
| Velocity (points/sprint) | Planning realism | Sprint review |
| Sprint goal met? (yes/no) | Focus | Sprint review |
| Lead time (PR opened → merged) | Flow | GitHub |
| CI pass rate on `main` | Stability (should be 100 %) | GitHub Actions |
| Escaped bugs (found after merge) | Quality of Done | Backlog |
| MVP acceptance criteria ticked | Progress to release | docs/02-product-strategy/06-mvp-definition.md §5, docs/00 §1 |

---

## 17. Working with an AI pair programmer

The developer works with an AI coding assistant (Claude Code). Agile roles stay human:

| Rule | Why |
|---|---|
| **The PO decides scope, priorities and trade-offs**; the assistant proposes options with a recommendation | Accountability (vision A1: humans make the decisions) |
| The assistant follows `CLAUDE.md`: branch per feature, docs updated in the same PR, checks before commit | Same Definition of Done for everyone |
| The assistant states what it **verified** vs what it **could not** (e.g. "browser not checked") | Honest status; no hidden risk |
| Every AI-written change goes through the same PR, CI and review | Quality gates don't depend on who typed the code |
| New dependencies ≥ 2 weeks old; versions checked from the registry, APIs from installed docs | Supply-chain safety; no outdated-memory mistakes |

---

## 18. Increment log

Increments delivered so far (dates are when merged; details in docs/00 §13):

| # | Date | Increment | Epic |
|---|---|---|---|
| 1 | 2026-11-11 | Discovery docs 01–07 | – |
| 2 | 2026-11-11 | Design docs 08–11 + PO decisions | – |
| 3 | 2026-11-11 | Scaffold, tooling, CI (PR #1) | E0 |
| 4 | 2026-11-11 | Database + health check (PR #6) | E0 |
| 5 | 2026-11-12 | Security baseline, audit log, authentication UI (PR #7) | E0, E1 |
| 6 | 2026-11-12 | TypeScript 7 revert (PR #10) | E0 |
| 7 | 2026-11-12 | Demo users, E2E suite, auth QA report (PR #11) | E1 |
| 8 | 2026-11-12 | Solution document + docs rule (PR #13) | – |
| 9 | 2026-11-12 | Company profile + admin verification (PR #15) | E2 |
| 10 | 2026-11-12 | This methodology document (PR #16) | – |
| 11 | 2026-11-12 | Sprint S1: jobs, approval and moderation (PR #17) | E3 |
| 12 | 2026-11-12 | Sprint S2: public job search and details (in review) | E4 |

*The first increments were delivered faster than the 2-week sprint plan assumes, with AI assistance.
Formal sprints with measured velocity start with sprint S1 (§15).*

---

## 19. Templates

**Sprint planning note**
```
Sprint: S_  (dates)          Goal: <one sentence>
Capacity: __ h (~__ points)  Committed: __ points
Items: JC-___ (_ pts) · JC-___ (_ pts) · …
Risks / dependencies:
```

**Async stand-up**
```
Done: …    Next: …    Blocked / need PO decision: …
```

**Retrospective**
```
Sprint: S_    Goal met: yes / no    Velocity: __
Went well: …
Didn't go well: …
We will try (max 3, each with an owner): …
Risks re-scored: …
```

**Increment review (PO)**
```
PR #__  Feature: …
Tried with: demo users / QA screenshots
Acceptance criteria met: yes / no (which not)
Decision: accept / changes needed (list) / reject
```
