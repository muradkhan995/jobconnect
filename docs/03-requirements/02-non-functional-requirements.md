# JobConnect – Non-Functional Requirements

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 1 – Discovery |
| Last updated | 2026-11-11 |

**Priority key (MoSCoW):** M = Must · S = Should · C = Could · W = Won't (this release)

---

## 1. Security (SEC)
| ID | Requirement | Priority |
|---|---|---|
| NFR-SEC-001 | Passwords shall be hashed with Argon2id or bcrypt and never stored or logged in plain text. | M |
| NFR-SEC-002 | All traffic shall use HTTPS (TLS 1.2 or higher). | M |
| NFR-SEC-003 | Every API endpoint shall enforce authentication, role and ownership checks on the server. The frontend is never trusted. | M |
| NFR-SEC-004 | All input shall be validated on the server; all database queries shall be parameterised (SQL injection protection). | M |
| NFR-SEC-005 | All user-generated content shall be output-encoded, and a Content Security Policy header applied (XSS protection). | M |
| NFR-SEC-006 | Session cookies shall be HttpOnly, Secure and SameSite; state-changing requests shall be CSRF-protected. | M |
| NFR-SEC-007 | Login, registration and password reset shall be rate-limited (max 10 requests per minute per IP). | M |
| NFR-SEC-008 | Uploaded files shall be validated by content (not just extension), size-limited, stored privately with random names, and served only via short-lived signed URLs to authorised users. | M |
| NFR-SEC-009 | Uploaded files should be scanned for malware before being made available. | S |
| NFR-SEC-010 | Secrets (DB passwords, API keys) shall be stored in environment variables or a secret manager and never committed to Git. | M |
| NFR-SEC-011 | Dependencies should be scanned for known vulnerabilities in CI. | S |

## 2. Privacy & GDPR (PRV)
| ID | Requirement | Priority |
|---|---|---|
| NFR-PRV-001 | The system shall collect only the personal data needed for its features (data minimisation). | M |
| NFR-PRV-002 | Users shall accept the privacy policy at registration; consent shall be recorded with a timestamp. | M |
| NFR-PRV-003 | When an account is deleted, personal data and CV files shall be erased within 30 days; backups containing it shall expire within 35 days. | M |
| NFR-PRV-004 | Personal data (names, emails, CV contents) shall never be written to application logs. | M |
| NFR-PRV-005 | Data should be hosted in the UK or EU. | S |
| NFR-PRV-006 | Users shall be told clearly when AI processes their data. | M (if AI built) |

## 3. Performance (PERF)
| ID | Requirement | Priority |
|---|---|---|
| NFR-PERF-001 | Job search shall respond in under 500 ms at p95 with 10,000 published jobs. | S |
| NFR-PERF-002 | Pages shall reach Largest Contentful Paint in under 2.5 s on a 4G mobile connection. | S |

## 4. Scalability (SCAL)
| ID | Requirement | Priority |
|---|---|---|
| NFR-SCAL-001 | The system should support 500 concurrent users without performance degradation (MVP target). | S |
| NFR-SCAL-002 | The backend shall be stateless so additional instances can be added (horizontal scaling). | S |

## 5. Reliability (REL)
| ID | Requirement | Priority |
|---|---|---|
| NFR-REL-001 | The system should achieve 99.5% monthly uptime (≈ 3.6 hours downtime per month). | S |
| NFR-REL-002 | The database shall be backed up daily with 30-day retention; a restore shall be tested before each release. | M |
| NFR-REL-003 | Recovery targets: RPO 24 hours, RTO 4 hours. | S |

## 6. Usability & Accessibility (UX)
| ID | Requirement | Priority |
|---|---|---|
| NFR-UX-001 | The UI shall be responsive from 360 px (mobile) to 1920 px (desktop); candidate flows shall be mobile-first. | M |
| NFR-UX-002 | The UI should meet WCAG 2.2 Level AA. | S |
| NFR-UX-003 | A candidate with a saved CV should be able to apply in 3 clicks or fewer from the job details page. | S |
| NFR-UX-004 | The site shall work on the latest two versions of Chrome, Firefox, Safari and Edge. | M |

## 7. Maintainability (MNT)
| ID | Requirement | Priority |
|---|---|---|
| NFR-MNT-001 | Code shall use TypeScript in strict mode; linting and formatting shall be enforced in CI. | M |
| NFR-MNT-002 | Every change shall reach `main` only through a pull request with passing CI. | M |
| NFR-MNT-003 | Every functional requirement should have at least one automated test; business logic should have ≥ 80% unit test coverage. | S |
| NFR-MNT-004 | The API should be documented using OpenAPI. | S |

## 8. Observability (OBS)
| ID | Requirement | Priority |
|---|---|---|
| NFR-OBS-001 | The system shall expose a health-check endpoint. | M |
| NFR-OBS-002 | Logs should be structured (JSON) and include a request ID to trace each request. | S |
| NFR-OBS-003 | Unhandled errors should be reported to a monitoring tool. | S |

## 9. AI Agents (AI) – apply only if AI features are built
| ID | Requirement | Priority |
|---|---|---|
| NFR-AI-001 | All core features shall keep working if the AI provider is unavailable (graceful degradation). | M |
| NFR-AI-002 | AI responses should return within 10 s or fail with a friendly message. | S |
| NFR-AI-003 | User content sent to the AI (CVs, job posts) shall be treated as untrusted input; AI output shall never trigger actions directly (prompt-injection protection). | M |
| NFR-AI-004 | The AI provider shall not train its models on JobConnect user data. | M |
| NFR-AI-005 | AI usage should have a monthly cost cap with alerts. | S |