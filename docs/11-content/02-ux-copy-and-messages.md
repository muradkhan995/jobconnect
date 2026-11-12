# UX Copy and Messages

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Sources | `src/modules/auth/messages.ts`, services (`DomainError`), schemas (Zod messages), `labels.ts` files |

Change copy in the code **and** here in the same PR.

## 1. Authentication messages (`auth/messages.ts`)

| Code | Message shown |
|---|---|
| `EMAIL_NOT_VERIFIED` | Please confirm your email first. We've sent you a new link – check your inbox. |
| `INVALID_EMAIL_OR_PASSWORD` | That email and password don't match. Try again. |
| `ACCOUNT_SUSPENDED` | This account can't sign in. Contact support. |
| `PASSWORD_TOO_SHORT` | Use at least 12 characters. |
| `PASSWORD_TOO_LONG` | Use 128 characters or fewer. |
| `PASSWORD_COMPROMISED` | This password has appeared in a data breach. Please choose a different one. |
| `INVALID_TOKEN` | This link has expired or was already used. Request a new one. |
| `INVALID_EMAIL` | Enter a valid email address. |
| HTTP 429 | Too many attempts. Try again in a minute. |
| Anything else | Something went wrong. Please try again. |
| Sign-up rules | Choose whether you are a candidate or an employer. · Please accept the current privacy policy. |
| Forgot password (always) | If an account exists for that email, we've sent a link to reset your password. It expires in 1 hour. |

## 2. API / business messages

| Code | HTTP | Message |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Please log in. |
| `FORBIDDEN_ROLE` | 403 | Your account type can't do this. |
| `CSRF_ORIGIN_MISMATCH` | 403 | Request origin not allowed |
| `NOT_FOUND` | 404 | This job / This company / Your company profile / This action doesn't exist. |
| `VALIDATION_FAILED` | 400 | Please check the highlighted fields. (+ per-field messages) |
| `COMPANY_EXISTS` | 409 | You already have a company profile. |
| `INVALID_TRANSITION` | 409 | e.g. "Only pending companies can be verified." · "Closed or removed jobs can't be edited." · "A suspended company can't be edited. Contact support." |
| `STATE_CHANGED` | 409 | This was updated by someone else. Refresh to see the latest. |
| `COMPANY_NOT_VERIFIED` | 422 | Available once your company is verified. |
| `DEADLINE_OUT_OF_RANGE` | 422 | The closing date must be between 1 and 90 days from today. Edit the job first. |
| `DEADLINE_PASSED` | 422 | The closing date has passed. Extend it first. |
| `INTERNAL_ERROR` | 500 | Something went wrong. Please try again. (Reference: <request id>) |

**Field messages (examples):** "Company name must be at least 2 characters." · "Website must start with https://" ·
"Add a location (or choose Remote)." · "Maximum salary must be at least the minimum." · "The closing date must
be in the future." · "Reason must be at least 10 characters."

## 3. Status labels

| Area | System | Employer sees | Admin sees | Candidate sees |
|---|---|---|---|---|
| Company | PENDING | Being reviewed | Pending | – |
| Company | VERIFIED | Verified | Verified | ✓ Verified employer |
| Company | REJECTED | Changes needed | Rejected | – |
| Company | SUSPENDED | Suspended | Suspended | (jobs hidden) |
| Job | DRAFT | Draft | Draft | – |
| Job | PENDING_APPROVAL | Waiting for approval | Pending | – |
| Job | PUBLISHED | Live | Published | (visible) |
| Job | PAUSED | Paused | Paused | (hidden) |
| Job | REJECTED | Changes needed | Rejected | – |
| Job | CLOSED | Closed | Closed | (hidden) |
| Job | REMOVED | Removed by JobConnect | Removed | (hidden) |
| Application ⬜ | APPLIED … OFFERED, REJECTED | New … Offered, Rejected | – | Application sent … Offer made, **Not selected** |

## 4. Confirmations (consequence stated first)

| Action | Confirmation text |
|---|---|
| Verify company | The employer will be able to submit jobs. |
| Reject company | The employer sees your reason and can edit and resubmit. |
| Suspend company | All of the company's jobs will be hidden from search. The employer sees your reason. |
| Submit job | Our team reviews the job before it goes live. You can still edit it while you wait. |
| Pause job | The job is hidden from search and nobody can apply until you resume it. |
| Close job | This is final: the job can't be reopened. You can still manage its applications. |
| Approve job | The job goes live in search straight away. |
| Remove job | This is final: the job is taken down for breaking platform policy. The employer sees your reason. |

## 5. Empty states
"No jobs yet. Write your first one…" · "Nothing to review. 🎉" · "No jobs match. Try removing a filter." ·
"No jobs are open right now. Check back soon." · "No companies with this status."
