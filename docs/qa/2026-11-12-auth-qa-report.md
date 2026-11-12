# QA Report – Authentication (FR-AUTH-001 … 008)

| Field | Value |
|---|---|
| Date | 2026-11-12 |
| Build | branch `feat/demo-users-e2e`, production build (`next build && next start`) |
| Browser | Chromium (Playwright 1.64.1), desktop 1280 × 720 and phone 360 × 780 |
| Test suite | [`e2e/auth.spec.ts`](../../e2e/auth.spec.ts) – re-run any time with `npm run test:e2e` |
| Result | ✅ **11 / 11 passed**, 3 consecutive runs |

## Results

| # | Check | Requirement | Result | Screenshot |
|---|---|---|---|---|
| 01 | Home page for visitors | – | ✅ | [01](screenshots/01-home-visitor.png) |
| 02–04 | Sign up as a candidate → "Check your email" | FR-AUTH-001, NFR-PRV-002 | ✅ | [02](screenshots/02-register-empty.png) · [03](screenshots/03-register-filled.png) · [04](screenshots/04-check-email.png) |
| 05 | Log in before confirming email is refused | FR-AUTH-006 | ✅ | [05](screenshots/05-login-unverified.png) |
| 06–07 | Confirmation email arrives; link confirms the account | FR-AUTH-005 | ✅ | [06](screenshots/06-email-confirmation.png) · [07](screenshots/07-email-confirmed.png) |
| 08 | Wrong password → generic error (doesn't say which part is wrong) | NFR-SEC | ✅ | [08](screenshots/08-login-wrong-password.png) |
| 09–10 | Log in shows name + role; log out | FR-AUTH-007 | ✅ | [09](screenshots/09-logged-in-candidate.png) · [10](screenshots/10-logged-out.png) |
| 11–14 | Forgot password → email → new password → log in with it | FR-AUTH-008 | ✅ | [11](screenshots/11-forgot-password-sent.png) · [12](screenshots/12-email-reset.png) · [13](screenshots/13-reset-password-form.png) · [14](screenshots/14-password-changed.png) |
| 15 | Demo employer logs in and lands on `/employer` | – | ✅ | [15](screenshots/15-demo-employer.png) |
| 16 | Demo admin logs in and lands on `/admin` | FR-ADM-001 | ✅ | [16](screenshots/16-demo-admin.png) |
| 17 | Sign-up page at 360 px: no sideways scrolling | NFR-UX-001 | ✅ | [17](screenshots/17-register-mobile-360px.png) |
| 18 | No Content Security Policy violations in a real browser | NFR-SEC-005 | ✅ | – |

## Issues found and fixed during this QA round

| Issue | Fix |
|---|---|
| Emails: the long fallback link didn't wrap, making the email ~2,400 px wide (sideways scrolling on phones) | Link wraps; unit test guards it |
| Home page: admins were told they could "search jobs" (candidate text) | Separate next-step text per role |
| Tests reloaded mid-run on the dev server (hot reload reacting to test files) | E2E runs against a production build on port 3100 |
| Back-to-back runs hit the 10-logins-per-minute limit (limit works as designed) | Test setup clears local rate-limit counters |
| Sign-up failed once when the external breach-check service was slow | E2E runs without the external check; see open question below |

## Open questions for the Product Owner
- **Breach-check outage:** if the Have I Been Pwned service is unreachable, sign-up is refused
  ("fail closed"). Alternative: allow sign-up and log a warning ("fail open"). Security vs. availability.

## Not covered yet
- E2E tests do not run in CI yet (needs the app server + Postgres + Mailpit in the pipeline).
- Firefox / Safari / Edge (NFR-UX-004) – Chromium only so far.
- Screen-reader and keyboard-only walkthrough (NFR-UX-002).
