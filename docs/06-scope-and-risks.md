# JobConnect – Scope Statement & Risk Register

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 1 – Discovery |
| Last updated | 2026-11-11 |

---

## Part A – Scope Statement

### A1. Release 1.0 – In Scope
- All **Must (M)** and **Should (S)** requirements in `03-functional-requirements.md` and `04-non-functional-requirements.md`.
- Responsive web application (desktop and mobile browsers).
- Three roles: Candidate, Employer, Administrator.
- In-app notifications; transactional emails (verification, password reset).
- Automated tests, CI/CD pipeline, and cloud deployment.
- Project documentation maintained in the GitHub repository.

### A2. Stretch Scope (only if time allows)
- All **Could (C)** requirements, including the three AI agents.

### A3. Out of Scope (Release 1.0)
- Native mobile apps (iOS / Android).
- Payments, paid job adverts or subscriptions.
- Multiple recruiters per company account (FR-EMP-005).
- In-platform chat or video interviews.
- Offer acceptance / "Hired" tracking.
- Social login (Google, LinkedIn) and third-party ATS integrations.
- Multi-language support (English only).

### A4. Constraints
- **Team:** one developer, mentored; part-time availability.
- **Budget:** free tiers or low-cost services (target < £20/month during development).
- **Legal:** UK GDPR and EU AI Act principles apply.
- **Process:** 2-week sprints; all code reaches `main` via pull request with passing CI.

### A5. Change Control Process
1. New idea or change is raised (as a Jira ticket labelled `change-request`).
2. Impact is assessed: effort, affected requirements, risks.
3. Product Owner decides: accept (with MoSCoW priority), defer, or reject.
4. If accepted: requirements docs, backlog and this scope statement are updated.

---

## Part B – Risk Register

**Scale:** L = 1 · M = 2 · H = 3 · **Score = Probability × Impact** · 🔴 ≥ 6 · 🟠 3–4 · 🟢 ≤ 2

| ID | Risk | P | I | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R-01 | Scope creep delays delivery | H | H | 🔴 9 | MoSCoW priorities, change control process, MVP first | PO |
| R-02 | Limited time / loss of momentum (solo developer) | H | H | 🔴 9 | Small sprints, visible progress each sprint, realistic estimates | PO |
| R-03 | Learning curve with new technologies slows progress | H | M | 🔴 6 | Well-documented stack, short learning "spikes", mentoring | Dev |
| R-04 | Security breach exposes candidate CVs / personal data | M | H | 🔴 6 | NFR-SEC rules, authorisation tests, dependency scanning, OWASP Top 10 review | Dev |
| R-05 | GDPR non-compliance | M | H | 🔴 6 | Privacy by design (NFR-PRV), data retention rules, consent records | PO |
| R-06 | AI produces biased or unfair output about candidates | M | H | 🔴 6 | AI is "Could"; no scoring/ranking; human makes every decision | PO |
| R-07 | Fraudulent employers post scam jobs | M | H | 🔴 6 | Company verification, job approval, user reporting | Admin |
| R-08 | Prompt injection via CV or job text manipulates AI | M | M | 🟠 4 | Treat AI input as untrusted; AI output never triggers actions | Dev |
| R-09 | Verification emails land in spam | M | M | 🟠 4 | Reputable email provider; SPF/DKIM/DMARC configured | Dev |
| R-10 | Hosting or AI costs exceed budget | M | M | 🟠 4 | Free tiers, cost caps and alerts | PO |
| R-11 | Over-engineering (building for problems we don't have) | M | M | 🟠 4 | XP "simple design" and YAGNI; review at retrospectives | Dev |
| R-12 | Data loss (database failure) | L | H | 🟠 3 | Daily backups, tested restores (NFR-REL-002) | Dev |
| R-13 | Third-party service outage or lock-in | L | M | 🟢 2 | Wrap external services behind our own interfaces | Dev |

**Review cadence:** 🔴 risks are reviewed at every sprint retrospective.