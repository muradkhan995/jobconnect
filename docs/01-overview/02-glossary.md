# Glossary

Terms as they are used in JobConnect's documents and code.

| Term | Meaning |
|---|---|
| **ADR** | Architecture Decision Record – a dated decision with context, options and consequences ([06-architecture/03-adr-log.md](../06-architecture/03-adr-log.md)). |
| **Admin / Administrator** | Platform staff role (persona Sophie). Verifies companies, approves jobs, moderates. Cannot self-register (FR-AUTH-002). |
| **Application** | A candidate's application to one job, with a status lifecycle (BR §4). *Planned – sprint S3.* |
| **Audit log** | Append-only record of security events and admin actions (`audit_log` table, FR-ADM-019/021). |
| **BR-…** | Business rule ID, e.g. BR-JOB-004 ([03-requirements/03-business-rules.md](../03-requirements/03-business-rules.md)). |
| **Candidate** | Job-seeker role (persona Amira). |
| **Company verification** | Admin check that an employer's company is real before its jobs can go live (BR §2). |
| **Core loop** | The MVP's end-to-end flow: verify company → approve job → search & apply → manage applicants → candidate sees status (docs/02-product-strategy/06-mvp-definition.md §2). |
| **CSP / nonce** | Content Security Policy; a random per-request value that allows only our own scripts to run (ADR-008). |
| **CSRF** | Cross-site request forgery; blocked by checking the `Origin` header on state-changing API calls. |
| **Cursor pagination** | Paging by "the last item I saw" (published time + id) instead of page numbers; stable while new jobs arrive. |
| **D-NN** | Product or implementation decision in the decision log ([00 §12](../00-solution-document.md#12-decision-log)). |
| **Definition of Done (DoD)** | Checklist every increment must meet ([07-implementation/01-agile-methodology.md §9](../07-implementation/01-agile-methodology.md#9-definition-of-done)). |
| **Demo users** | Local-only accounts for each role created by `npm run db:seed` (`prisma/demo-users.ts`). |
| **Draft** | A job only its employer can see; may be written before the company is verified (D-22). |
| **E2E test** | End-to-end test in a real browser (Playwright) against a production build. |
| **Employer** | Hiring role (persona David). One company per employer in this release (FR-EMP-005 is Won't). |
| **Epic E0–E10** | Groups of backlog items ([07-implementation/01-agile-methodology.md §5](../07-implementation/01-agile-methodology.md#5-product-backlog)). |
| **FR-… / NFR-…** | Functional / non-functional requirement IDs (docs/03-requirements). |
| **Guarded update** | `UPDATE … WHERE id = ? AND status = <expected>`; 0 rows means someone else changed it first (`409 STATE_CHANGED`). |
| **HIBP** | Have I Been Pwned – breached-password check; only a 5-character hash prefix leaves the server. |
| **Increment** | One merged, working, tested, documented change (usually one PR). |
| **Integration test** | Test against a real PostgreSQL (and Mailpit), not mocks. |
| **Mailpit** | Local email catcher; every email the app sends locally appears at http://localhost:8025. |
| **Material edit** | Changing a live job's title, description, requirements or salary – needs approval again (BR-JOB-004). |
| **MoSCoW** | Must / Should / Could / Won't prioritisation. |
| **MVP / Release 0.1** | The smallest release that completes the core loop. |
| **PO** | Product Owner – decides scope and priorities. |
| **Problem response** | Standard JSON error body (RFC 9457) with a stable `code` and the `requestId`. |
| **Proxy** | `src/proxy.ts` (Next.js "middleware"): runs before every request – request id, CSRF, CSP, role gate, public-job 404. |
| **Published / visible job** | `PUBLISHED`, not past its deadline, company verified, owner active – the single `VISIBLE_JOB` rule (D-25). |
| **QA report** | Per-feature evidence: checks, results, screenshots, issues found ([08-testing/qa-reports](../08-testing/qa-reports/)). |
| **Request id** | Random id given to every request, returned in `x-request-id` and written on every log line. |
| **Sprint S1–S6** | The remaining MVP sprints ([07-implementation/01-agile-methodology.md §15](../07-implementation/01-agile-methodology.md#15-release-plan)). |
| **UUIDv7** | Time-ordered, unguessable id used for every row. |
| **Verified company** | A company an admin has verified; only these can submit, publish or resume jobs. |
