# Test Case Catalogue

> **Generated** by `npm run docs:test-cases` from the test files – do not edit by hand.
> Parameterised cases (`it.each`) count once here but run once per value.

| Kind | Test cases |
|---|---|
| Unit | 84 |
| Integration (real PostgreSQL + Mailpit) | 65 |
| End-to-end (Playwright, production build) | 30 |
| **Total** | **179** |

How each kind is used: [01-test-strategy.md](01-test-strategy.md).

| Kind | File | Case |
|---|---|---|
| E2E | `e2e/auth.spec.ts` | 01 home page for visitors |
| E2E | `e2e/auth.spec.ts` | 02–04 sign up as a candidate |
| E2E | `e2e/auth.spec.ts` | 05 cannot log in before confirming the email (FR-AUTH-006) |
| E2E | `e2e/auth.spec.ts` | 06–07 confirm the email from the inbox (FR-AUTH-005) |
| E2E | `e2e/auth.spec.ts` | 08 wrong password shows a generic error |
| E2E | `e2e/auth.spec.ts` | 09–10 log in and log out (FR-AUTH-007) |
| E2E | `e2e/auth.spec.ts` | 11–14 reset a forgotten password (FR-AUTH-008) |
| E2E | `e2e/auth.spec.ts` | ${n} demo ${who} can log in and lands on their own home |
| E2E | `e2e/auth.spec.ts` | 17 sign-up page on a phone (NFR-UX-001) |
| E2E | `e2e/auth.spec.ts` | 18 no Content Security Policy violations in the browser (NFR-SEC-005) |
| E2E | `e2e/company.spec.ts` | 20–22 employer creates a company profile (FR-EMP-001) |
| E2E | `e2e/company.spec.ts` | 23–26 admin rejects it with a reason (FR-ADM-007/008) |
| E2E | `e2e/company.spec.ts` | 27–29 employer sees the reason, is emailed, edits and resubmits |
| E2E | `e2e/company.spec.ts` | 30–31 admin verifies; employer sees Verified |
| E2E | `e2e/company.spec.ts` | 32 employers can't open admin pages (404) |
| E2E | `e2e/jobs.spec.ts` | 40–43 employer writes a job and saves a draft (FR-EMP-006/007) |
| E2E | `e2e/jobs.spec.ts` | 44–45 employer submits it for approval (FR-EMP-008) |
| E2E | `e2e/jobs.spec.ts` | 46–48 admin reviews and approves it (FR-ADM-009/010) |
| E2E | `e2e/jobs.spec.ts` | 49–50 employer sees it live; a material edit sends it back (BR-JOB-004) |
| E2E | `e2e/jobs.spec.ts` | 51–52 admin rejects with a reason; employer sees it and is emailed (FR-ADM-010) |
| E2E | `e2e/jobs.spec.ts` | 53 employers can't see another company's job |
| E2E | `e2e/search.spec.ts` | 60 visitors can search from the home page |
| E2E | `e2e/search.spec.ts` | 62 filters narrow the results; no match shows a way back (FR-CAN-007) |
| E2E | `e2e/search.spec.ts` | 64 'Load more' pages through results without JavaScript-only tricks |
| E2E | `e2e/search.spec.ts` | 65–66 job details: visitors are asked to log in, and come back afterwards (FR-CAN-008) |
| E2E | `e2e/search.spec.ts` | 67 a hidden or unknown job is a real 404 (D-20) |
| E2E | `e2e/search.spec.ts` | 68 candidates land on job search after login |
| E2E | `e2e/search.spec.ts` | 69 search and job details on a phone: no sideways scrolling, sticky apply bar |
| E2E | `e2e/search.spec.ts` | 71 public pages have no CSP violations (NFR-SEC-005) |
| E2E | `e2e/search.spec.ts` | 72 the public API returns search results and job details |
| Integration | `src/lib/auth.int.test.ts` | sign-up › creates an unverified user with role, consent time and an Argon2id hash |
| Integration | `src/lib/auth.int.test.ts` | sign-up › writes an auth.signup audit entry |
| Integration | `src/lib/auth.int.test.ts` | sign-up › refuses ADMIN as a sign-up role (FR-AUTH-002) |
| Integration | `src/lib/auth.int.test.ts` | sign-up › refuses a sign-up without the current privacy policy (NFR-PRV-002) |
| Integration | `src/lib/auth.int.test.ts` | sign-up › refuses passwords shorter than 12 characters (FR-AUTH-003) |
| Integration | `src/lib/auth.int.test.ts` | sign-up › never creates a second account for the same email, whatever the case (FR-AUTH-004) |
| Integration | `src/lib/auth.int.test.ts` | sign-in › refuses login before the email is verified (FR-AUTH-006) |
| Integration | `src/lib/auth.int.test.ts` | sign-in › refuses login for a suspended account (FR-ADM-006) |
| Integration | `src/lib/auth.int.test.ts` | sign-in › logs in a verified, active user |
| Integration | `src/lib/auth.int.test.ts` | database rule › rejects a suspension without a reason (FR-ADM-006) |
| Integration | `src/lib/db.int.test.ts` | database conventions › answers a ping |
| Integration | `src/lib/db.int.test.ts` | database conventions › runs sessions in UTC |
| Integration | `src/lib/db.int.test.ts` | database conventions › has citext installed, so emails compare case-insensitively |
| Integration | `src/lib/db.int.test.ts` | database conventions › runs the Postgres major version production uses |
| Unit | `src/lib/health.test.ts` | checkHealth › returns 200 ok when the database answers |
| Unit | `src/lib/health.test.ts` | checkHealth › returns 503 error when the database ping fails |
| Unit | `src/lib/health.test.ts` | checkHealth › does not leak error details |
| Unit | `src/lib/health.test.ts` | checkHealth › returns 503 when the database does not answer in time |
| Unit | `src/lib/http/problem.test.ts` | problem › builds an RFC 9457 body with our code and request id |
| Unit | `src/lib/http/problem.test.ts` | problem › carries field errors |
| Unit | `src/lib/http/problem.test.ts` | problemResponse › uses the problem content type, status and no-store |
| Unit | `src/lib/logger.test.ts` | logger › writes JSON with a text level and ISO time |
| Unit | `src/lib/logger.test.ts` | logger › redacts personal data at the top level |
| Unit | `src/lib/logger.test.ts` | logger › redacts personal data one level deep |
| Unit | `src/lib/logger.test.ts` | logger › redacts cookies and authorization headers |
| Unit | `src/lib/security/csp.test.ts` | buildPageCsp › allows scripts only with the request nonce |
| Unit | `src/lib/security/csp.test.ts` | buildPageCsp › never allows inline or eval scripts in production |
| Unit | `src/lib/security/csp.test.ts` | buildPageCsp › forbids framing, plugins and foreign form targets |
| Unit | `src/lib/security/csp.test.ts` | buildPageCsp › upgrades insecure requests only in production |
| Unit | `src/lib/security/csp.test.ts` | buildPageCsp › allows eval in development only |
| Unit | `src/lib/security/csp.test.ts` | API_CSP › blocks everything |
| Unit | `src/lib/security/csp.test.ts` | createNonce › is unique per call and carries 128 bits |
| Unit | `src/lib/security/csrf.test.ts` | isCsrfSafe › allows safe method %s without Origin |
| Unit | `src/lib/security/csrf.test.ts` | isCsrfSafe › allows %s from our own origin |
| Unit | `src/lib/security/csrf.test.ts` | isCsrfSafe › rejects a cross-site POST |
| Unit | `src/lib/security/csrf.test.ts` | isCsrfSafe › rejects a lookalike origin |
| Unit | `src/lib/security/csrf.test.ts` | isCsrfSafe › rejects POST without Origin, and the opaque 'null' origin |
| Unit | `src/lib/uuidv7.test.ts` | uuidv7 › has the version 7 and RFC variant bits |
| Unit | `src/lib/uuidv7.test.ts` | uuidv7 › encodes the timestamp in the first 48 bits |
| Unit | `src/lib/uuidv7.test.ts` | uuidv7 › sorts by creation time |
| Unit | `src/lib/uuidv7.test.ts` | uuidv7 › is unique |
| Integration | `src/modules/audit/audit.int.test.ts` | audit_log database rules › stores an entry |
| Integration | `src/modules/audit/audit.int.test.ts` | audit_log database rules › stamps occurred_at with the database clock, ignoring the caller |
| Integration | `src/modules/audit/audit.int.test.ts` | audit_log database rules › rejects UPDATE |
| Integration | `src/modules/audit/audit.int.test.ts` | audit_log database rules › rejects DELETE of an entry younger than 24 months |
| Integration | `src/modules/audit/audit.int.test.ts` | audit_log database rules › rejects TRUNCATE |
| Integration | `src/modules/audit/audit.int.test.ts` | audit_log database rules › rejects badly formatted actions |
| Integration | `src/modules/audit/audit.int.test.ts` | audit_log database rules › allows the retention job to delete entries older than 24 months |
| Unit | `src/modules/audit/audit.test.ts` | assertNoPersonalData › accepts reasons and statuses |
| Unit | `src/modules/audit/audit.test.ts` | assertNoPersonalData › rejects the key %s |
| Unit | `src/modules/audit/audit.test.ts` | recordAudit › maps the entry onto the audit_log columns |
| Unit | `src/modules/audit/audit.test.ts` | recordAudit › records system events with no actor |
| Unit | `src/modules/audit/audit.test.ts` | recordAudit › refuses personal data before touching the database |
| Unit | `src/modules/auth/emails.test.ts` | auth emails › escapes HTML in names so an email can't be used for injection |
| Unit | `src/modules/auth/emails.test.ts` | auth emails › puts the link in both the text and HTML versions |
| Unit | `src/modules/auth/emails.test.ts` | auth emails › wraps the long fallback link so the email never scrolls sideways on phones |
| Unit | `src/modules/auth/emails.test.ts` | auth emails › states the expiry times from the requirements |
| Unit | `src/modules/auth/messages.test.ts` | authErrorMessage › maps known codes to plain words |
| Unit | `src/modules/auth/messages.test.ts` | authErrorMessage › explains rate limiting |
| Unit | `src/modules/auth/messages.test.ts` | authErrorMessage › never shows raw server errors |
| Unit | `src/modules/auth/messages.test.ts` | authErrorMessage › shows our own validation messages |
| Unit | `src/modules/auth/password.test.ts` | password hashing › uses Argon2id with the OWASP parameters (NFR-SEC-001) |
| Unit | `src/modules/auth/password.test.ts` | password hashing › never stores the password itself |
| Unit | `src/modules/auth/password.test.ts` | password hashing › verifies the right password and rejects a wrong one |
| Unit | `src/modules/auth/password.test.ts` | password hashing › fails closed on a malformed hash |
| Unit | `src/modules/auth/safe-next.test.ts` | safeNext (open-redirect protection) › keeps same-site paths, including query strings |
| Unit | `src/modules/auth/safe-next.test.ts` | safeNext (open-redirect protection) › refuses %s |
| Unit | `src/modules/auth/safe-next.test.ts` | safeNext (open-redirect protection) › uses the fallback when there is no next |
| Unit | `src/modules/auth/signup-rules.test.ts` | checkSignup › accepts the self-service role %s |
| Unit | `src/modules/auth/signup-rules.test.ts` | checkSignup › rejects the role %s (FR-AUTH-002) |
| Unit | `src/modules/auth/signup-rules.test.ts` | checkSignup › rejects a missing or outdated privacy policy acceptance (NFR-PRV-002) |
| Unit | `src/modules/company/rules.test.ts` | company lifecycle (BR §2) › only pending companies can be verified or rejected |
| Unit | `src/modules/company/rules.test.ts` | company lifecycle (BR §2) › requires a reason to reject or suspend (BR-CMP-002) |
| Unit | `src/modules/company/rules.test.ts` | company lifecycle (BR §2) › suspend and reinstate move between VERIFIED and SUSPENDED |
| Unit | `src/modules/company/rules.test.ts` | company lifecycle (BR §2) › recognises only known actions |
| Unit | `src/modules/company/rules.test.ts` | company lifecycle (BR §2) › sends a rejected company back to review when edited, and leaves others alone |
| Unit | `src/modules/company/rules.test.ts` | company lifecycle (BR §2) › blocks edits while suspended |
| Unit | `src/modules/company/rules.test.ts` | CompanyInput › accepts a complete profile |
| Unit | `src/modules/company/rules.test.ts` | CompanyInput › treats an empty website as none |
| Unit | `src/modules/company/rules.test.ts` | CompanyInput › rejects the website %s |
| Unit | `src/modules/company/rules.test.ts` | CompanyInput › trims and length-checks text fields |
| Unit | `src/modules/company/rules.test.ts` | CompanyInput › rejects unknown sizes |
| Integration | `src/modules/company/service.int.test.ts` | employer › creates exactly one company, in PENDING |
| Integration | `src/modules/company/service.int.test.ts` | employer › only ever sees its own company |
| Integration | `src/modules/company/service.int.test.ts` | employer › refuses non-employers |
| Integration | `src/modules/company/service.int.test.ts` | employer › refuses an inactive or unknown industry |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › rejects with a reason, the employer resubmits by editing, then it is verified |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › writes the audit entry with the decision (FR-ADM-019) |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › refuses transitions the lifecycle doesn't allow |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › requires a reason to reject or suspend (BR-CMP-002) |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › lets only one of two simultaneous decisions win (guarded update, docs/05-design/01-data-model.md §4) |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › blocks employers from editing while suspended |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › is admin-only |
| Integration | `src/modules/company/service.int.test.ts` | admin decisions › lists the queue oldest first (FR-ADM-007) |
| Integration | `src/modules/company/service.int.test.ts` | database rules › rejects a REJECTED company without a reason |
| Integration | `src/modules/company/service.int.test.ts` | database rules › rejects a non-https website |
| Unit | `src/modules/job/rules.test.ts` | deadline (BR-JOB-002, FR-EMP-007) › stores a closing date as the end of that day, and reads it back |
| Unit | `src/modules/job/rules.test.ts` | deadline (BR-JOB-002, FR-EMP-007) › accepts 1 to 90 days ahead on submit |
| Unit | `src/modules/job/rules.test.ts` | deadline (BR-JOB-002, FR-EMP-007) › knows past from future |
| Unit | `src/modules/job/rules.test.ts` | lifecycle (BR §3) › submits only drafts, and only admins publish |
| Unit | `src/modules/job/rules.test.ts` | lifecycle (BR §3) › pauses and resumes between PUBLISHED and PAUSED (FR-EMP-010) |
| Unit | `src/modules/job/rules.test.ts` | lifecycle (BR §3) › requires reasons to reject or remove (FR-ADM-010/011, BR-JOB-008) |
| Unit | `src/modules/job/rules.test.ts` | lifecycle (BR §3) › treats CLOSED and REMOVED as final (BR-JOB-007) |
| Unit | `src/modules/job/rules.test.ts` | lifecycle (BR §3) › recognises only known actions |
| Unit | `src/modules/job/rules.test.ts` | editing (BR-JOB-004/005) › spots material changes only in title, text and salary |
| Unit | `src/modules/job/rules.test.ts` | editing (BR-JOB-004/005) › sends a live job back for approval only on a material change |
| Unit | `src/modules/job/rules.test.ts` | editing (BR-JOB-004/005) › turns a rejected job back into a draft, and leaves drafts alone |
| Unit | `src/modules/job/rules.test.ts` | JobInput › accepts a complete job and turns form strings into numbers |
| Unit | `src/modules/job/rules.test.ts` | JobInput › requires a location unless remote (BR-JOB-010) |
| Unit | `src/modules/job/rules.test.ts` | JobInput › rejects max < min (BR-JOB-003) |
| Unit | `src/modules/job/rules.test.ts` | JobInput › reports cross-field problems together with other field errors |
| Unit | `src/modules/job/rules.test.ts` | JobInput › skips the salary comparison while a salary itself is invalid |
| Unit | `src/modules/job/rules.test.ts` | JobInput › rejects decimals, negatives and missing dates |
| Unit | `src/modules/job/search-params.test.ts` | parseSearchParams › reads keyword, location and repeatable filters |
| Unit | `src/modules/job/search-params.test.ts` | parseSearchParams › ignores bad input instead of failing (public, user-typed URLs) |
| Unit | `src/modules/job/search-params.test.ts` | parseSearchParams › accepts a page's searchParams object |
| Unit | `src/modules/job/search-params.test.ts` | cursor › round-trips |
| Unit | `src/modules/job/search-params.test.ts` | cursor › rejects tampered cursors |
| Unit | `src/modules/job/search-params.test.ts` | escapeLike › escapes wildcards |
| Integration | `src/modules/job/search.int.test.ts` | visibility – one rule for search, details and the proxy (BR-JOB-001) › shows a published job of a verified company with an active owner |
| Integration | `src/modules/job/search.int.test.ts` | visibility – one rule for search, details and the proxy (BR-JOB-001) › hides %s jobs everywhere |
| Integration | `src/modules/job/search.int.test.ts` | visibility – one rule for search, details and the proxy (BR-JOB-001) › hides published jobs past their deadline |
| Integration | `src/modules/job/search.int.test.ts` | visibility – one rule for search, details and the proxy (BR-JOB-001) › hides jobs of a suspended company (BR-CMP-003) |
| Integration | `src/modules/job/search.int.test.ts` | visibility – one rule for search, details and the proxy (BR-JOB-001) › hides jobs whose employer account is suspended (BR-USR-002) |
| Integration | `src/modules/job/search.int.test.ts` | visibility – one rule for search, details and the proxy (BR-JOB-001) › treats unknown ids as not visible |
| Integration | `src/modules/job/search.int.test.ts` | keyword and filters (FR-CAN-006/007) › matches word forms (stemming) in title and description |
| Integration | `src/modules/job/search.int.test.ts` | keyword and filters (FR-CAN-006/007) › filters by location (case-insensitive, part of a name) |
| Integration | `src/modules/job/search.int.test.ts` | keyword and filters (FR-CAN-006/007) › treats % and _ in the location as plain characters |
| Integration | `src/modules/job/search.int.test.ts` | keyword and filters (FR-CAN-006/007) › filters by several work modes and job types |
| Integration | `src/modules/job/search.int.test.ts` | keyword and filters (FR-CAN-006/007) › treats keyword input as words, never as SQL |
| Integration | `src/modules/job/search.int.test.ts` | pagination (API design §3) › walks every result once, newest first, with a correct total |
| Integration | `src/modules/job/search.int.test.ts` | public shape › exposes only the allow-listed fields |
| Integration | `src/modules/job/service.int.test.ts` | drafts and submitting › lets an unverified company write drafts but not submit them (BR-CMP-001) |
| Integration | `src/modules/job/service.int.test.ts` | drafts and submitting › refuses a past closing date (FR-EMP-007) |
| Integration | `src/modules/job/service.int.test.ts` | drafts and submitting › only submits with a deadline 1–90 days away (BR-JOB-002) |
| Integration | `src/modules/job/service.int.test.ts` | drafts and submitting › goes DRAFT → PENDING_APPROVAL → PUBLISHED with an audit entry (FR-EMP-008, FR-ADM-010) |
| Integration | `src/modules/job/service.int.test.ts` | ownership (API design §1.2) › hides one employer's jobs from another (404, not 403) |
| Integration | `src/modules/job/service.int.test.ts` | ownership (API design §1.2) › keeps candidates and employers out of admin actions |
| Integration | `src/modules/job/service.int.test.ts` | editing (BR-JOB-004/005) › sends a live job back for approval on a material change |
| Integration | `src/modules/job/service.int.test.ts` | editing (BR-JOB-004/005) › keeps a live job live when only the deadline is extended |
| Integration | `src/modules/job/service.int.test.ts` | editing (BR-JOB-004/005) › turns a rejected job back into a draft |
| Integration | `src/modules/job/service.int.test.ts` | pause, resume, close, remove › pauses and resumes (FR-EMP-010) |
| Integration | `src/modules/job/service.int.test.ts` | pause, resume, close, remove › closes for good (FR-EMP-011, BR-JOB-007) |
| Integration | `src/modules/job/service.int.test.ts` | pause, resume, close, remove › lets an admin remove a live job with a reason (FR-ADM-011) |
| Integration | `src/modules/job/service.int.test.ts` | pause, resume, close, remove › won't approve a job whose company was suspended meanwhile |
| Integration | `src/modules/job/service.int.test.ts` | pause, resume, close, remove › lets only one of two simultaneous admin decisions win |
| Integration | `src/modules/job/service.int.test.ts` | admin queue › lists pending jobs oldest first (FR-ADM-009) |
| Integration | `src/modules/job/service.int.test.ts` | database rules › rejects max salary below min, and a missing location for on-site jobs |
| Integration | `src/modules/job/service.int.test.ts` | database rules › rejects a REMOVED job without a reason |
