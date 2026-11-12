# Security Audit (OWASP Top 10 – 2021)

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Type | Self-assessment by the developer against the code and tests; **not** an independent penetration test |
| Design | [05-design/06-security-design.md](../05-design/06-security-design.md) |

✅ addressed with evidence · 🟡 partly · ⬜ open

| # | Category | Controls in JobConnect | Evidence | Status |
|---|---|---|---|---|
| A01 | Broken access control | Proxy role gate; `apiRoute` role check; service ownership (404 for others' records); admin-only decisions | Integration tests per role (403/404); E2E 32, 53, 67 | ✅ |
| A02 | Cryptographic failures | Argon2id; HTTPS + HSTS (prod); secure cookies in prod; no secrets in code | Unit `password`; header checks | 🟡 TLS only after deploy |
| A03 | Injection | Prisma; `Prisma.sql` bound params; Zod validation; LIKE wildcards escaped; React escaping; HTML-escaped emails | Unit `escapeLike`, `emails`; int "SQL-looking input" | ✅ |
| A04 | Insecure design | Threat model; transition tables; guarded updates; enumeration-safe auth; one visibility rule | Concurrency tests; design docs | ✅ |
| A05 | Security misconfiguration | Strict CSP (nonce); security headers; no `X-Powered-By`; env validated; telemetry off | E2E CSP checks (real browser) | ✅ |
| A06 | Vulnerable components | Dependabot; `npm audit` gates; releases ≥ 2 weeks old; SHA-pinned Actions | CI; [05-dependency-audit.md](05-dependency-audit.md) | ✅ |
| A07 | Identification & authentication failures | Email verification; ≥ 12 chars + HIBP; rate limits; sessions revoked on reset; suspended can't log in | E2E auth; int `auth` | 🟡 MFA for admins (FR-ADM-002) Release 1.0 |
| A08 | Software & data integrity failures | Lockfile + `npm ci`; gitleaks; append-only audit log | CI; int `audit` | ✅ |
| A09 | Logging & monitoring failures | JSON logs + request ids; audit log; redaction | Unit `logger` | 🟡 alerts/Sentry ⬜ (S6) |
| A10 | SSRF | No server-side fetching of user-supplied URLs (company website is stored and linked, never fetched) | Code review | ✅ |

## Additional checks

| Check | Status |
|---|---|
| CSRF (Origin check on unsafe `/api/*`) | ✅ unit + curl |
| Open redirect (`safeNext`) | ✅ unit (found and fixed `/\evil`, defect #10) |
| Account enumeration (sign-up, reset) | ✅ |
| Public API field allow-list | ✅ int "public shape" |
| Rate limit on public search API | ⬜ before release |
| File upload validation (content sniffing, size, private bucket) | ⬜ S3 |
| Independent penetration test | ⬜ before public launch (recommended) |

## Findings to close before Release 0.1
1. Public API rate limit (A04/A05).
2. Error monitoring + alerting (A09).
3. Admin MFA decision (A07) – Should for 1.0; consider for 0.1.
4. Upload security when CVs ship (S3).
