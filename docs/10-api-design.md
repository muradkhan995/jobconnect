# JobConnect – API Design

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 2 – Design |
| Status | Proposed – awaiting Product Owner sign-off |
| Last updated | 2026-11-11 |

Scope: REST endpoints for the **MVP** (`07-mvp-definition.md`). Builds on `08-system-architecture.md`
(route handler → service → policy → repository) and `09-data-model.md`.

---

## 1. Conventions

| Topic | Convention |
|---|---|
| Base path | `/api/v1` – breaking changes go to `/api/v2`; adding fields is not breaking |
| Format | JSON, `camelCase` fields; dates as ISO 8601 UTC (`2026-11-11T09:30:00Z`) |
| IDs | UUID strings |
| Auth | Session cookie set by Better Auth (`HttpOnly; Secure; SameSite=Lax`). No tokens in headers or localStorage |
| CSRF | Every `POST`/`PATCH`/`PUT`/`DELETE` must send an `Origin` header matching our domain, otherwise `403` |
| Validation | Every request body and query string is parsed by a Zod schema; unknown fields are rejected |
| Docs | OpenAPI 3.1 generated from the Zod schemas, served at `/api/v1/openapi.json` (NFR-MNT-004) |
| Methods | `GET` read · `POST` create or **action** · `PATCH` partial update · `DELETE` remove |

**Who calls the API?** Pages (React Server Components) read data by calling services directly on the server.
**All changes** (and client-side reads such as search-as-you-type) go through these endpoints. The API is
therefore the single, documented, tested entry point for every write.

### 1.1 Lifecycle changes are actions, not field edits
Status is never set by `PATCH { status: … }`. Each transition is its own endpoint
(`POST /employer/jobs/{id}/submit`, `…/pause`). This maps one-to-one to the transition tables in the
services (architecture §2.2) and makes the permission for each action explicit.
Application status is the one exception: `POST /employer/applications/{id}/status` with a target status,
because employers may skip forward (BR-APP-004).

### 1.2 Ownership returns 404, not 403
If David requests an application that belongs to another company, the API answers `404 Not Found`, as if
it didn't exist. `403` would confirm that the ID is real. `403` is used only for **role** failures (a
candidate calling an `/employer/…` endpoint).

## 2. Errors
All errors use **RFC 9457 Problem Details** (`Content-Type: application/problem+json`):

```json
{
  "type": "https://jobconnect.example/errors/already-applied",
  "title": "You have already applied to this job",
  "status": 409,
  "code": "ALREADY_APPLIED",
  "requestId": "01JC9X…",
  "errors": []
}
```
`errors` lists field problems for validation failures: `[{ "field": "salaryMax", "message": "…" }]`.
`requestId` matches the server logs, so a user can quote it in a support request.

| HTTP | `code` examples | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Zod rejected the input |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN_ROLE`, `CSRF_ORIGIN_MISMATCH`, `ACCOUNT_SUSPENDED` | Wrong role / bad origin / suspended |
| 404 | `NOT_FOUND` | Doesn't exist **or** not yours (§1.2) |
| 409 | `ALREADY_APPLIED`, `INVALID_TRANSITION`, `STATE_CHANGED` | Business rule or a race lost (data model §4 guarded update) |
| 413 | `FILE_TOO_LARGE` | Upload > limit |
| 415 | `UNSUPPORTED_FILE_TYPE` | File content isn't PDF/DOCX (checked by magic bytes) |
| 422 | `DEADLINE_PASSED`, `COMPANY_NOT_VERIFIED`, `CV_LIMIT_REACHED`, `DEADLINE_OUT_OF_RANGE` | Valid input, but a business rule blocks it |
| 429 | `RATE_LIMITED` | NFR-SEC-007; response includes `Retry-After` |
| 500 | `INTERNAL_ERROR` | Never includes stack traces or internal details |

## 3. Pagination
Lists use **cursor pagination**: `?limit=20&cursor=<opaque>`. Response:
```json
{ "items": [ … ], "nextCursor": "eyJw…" }   // nextCursor is null on the last page
```
`limit` defaults to 20, max 50. The cursor encodes the last row's sort key + id (e.g. `publishedAt, id`),
so results stay stable when new jobs are published while a candidate is scrolling, and pages stay fast
at any depth.

## 4. Endpoints

**Role key:** 🌐 anyone · C candidate · E employer · A admin · 👤 any logged-in user
**Audit:** ✍️ = writes an `audit_log` entry (FR-ADM-019)

### 4.1 Authentication – handled by Better Auth at `/api/auth/*`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `POST /api/auth/sign-up/email` | 🌐 | FR-AUTH-001/003/004, NFR-PRV-002 | Body includes `name`, `role` (`CANDIDATE`/`EMPLOYER` only) and `privacyPolicyVersion`; password checked against breached list. **An already-registered email gets the same 200 response** (no account is created; the owner is emailed instead), so sign-up can't reveal who is registered – replaces `409 EMAIL_TAKEN` (2026-11-12) ✍️ |
| `GET /api/auth/verify-email?token=` | 🌐 | FR-AUTH-005/006 | Token valid 24 h |
| `POST /api/auth/sign-in/email` | 🌐 | FR-AUTH-006/009 | Rejects unverified and suspended users; rate-limited ✍️ (success and failure) |
| `POST /api/auth/sign-out` | 👤 | FR-AUTH-007 | Deletes the session |
| `POST /api/auth/forget-password` | 🌐 | FR-AUTH-008 | **Always returns 200**, so it can't be used to discover which emails are registered ✍️ |
| `POST /api/auth/reset-password` | 🌐 | FR-AUTH-008 | Ends all other sessions ✍️ |

Paths are Better Auth's defaults; we don't rename them. Signup role and consent are added through its hooks.

### 4.2 Current user – `/api/v1/me`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `GET /me` | 👤 | – | `{ id, email, role, status }` – lets the UI choose menus; never trusted for permissions |
| `POST /me/change-password` | 👤 | FR-CAN-017 | Requires current password ✍️ |
| `DELETE /me` | C | FR-CAN-018 | Requires current password; logs out everywhere; erasure job runs within 30 days ✍️ |

### 4.3 Candidate profile & CVs – `/api/v1/candidate`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `GET /candidate/profile` | C | FR-CAN-001 | |
| `PUT /candidate/profile` | C | FR-CAN-001 | Creates or replaces: `fullName`, `headline`, `location`, `phone` |
| `GET /candidate/cvs` | C | FR-CAN-005 | Metadata only |
| `POST /candidate/cvs` | C | FR-CAN-005 | `multipart/form-data`, field `file`; 413/415/422 `CV_LIMIT_REACHED` |
| `DELETE /candidate/cvs/{cvId}` | C | FR-CAN-005 | Submitted applications keep their snapshot (BR-APP-003) |
| `GET /candidate/cvs/{cvId}/download-url` | C | NFR-SEC-008 | `{ url, expiresAt }` – signed URL valid 5 min |

### 4.4 Jobs – public – `/api/v1/jobs`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `GET /jobs` | 🌐 | FR-CAN-006/007, NFR-PERF-001 | Query: `q`, `location`, `workMode` (repeatable), `jobType` (repeatable), `cursor`, `limit`. Returns visible jobs only (data model §5) |
| `GET /jobs/{jobId}` | 🌐 | FR-CAN-008 | `404` if not visible – a paused or removed job looks the same as a missing one |
| `GET /industries` | 🌐 | – | Active industries, for filters and forms |

### 4.5 Applications – candidate – `/api/v1/candidate/applications`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `POST /candidate/applications` | C | FR-CAN-010/011/012, BR-APP-001/003 | Body `{ jobId, cvId, coverLetter? }`. Copies the CV snapshot. `409 ALREADY_APPLIED`, `422 DEADLINE_PASSED` |
| `GET /candidate/applications` | C | FR-CAN-013 | Own applications with job title, company, current status |
| `GET /candidate/applications/{id}` | C | FR-CAN-013 | Includes status history and any rejection message; **never** internal notes |

### 4.6 Company – employer – `/api/v1/employer/company`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `GET /employer/company` | E | FR-EMP-001 | `404` if not created yet |
| `POST /employer/company` | E | FR-EMP-001 | Creates it in `PENDING`; `409` if one exists |
| `PATCH /employer/company` | E | FR-EMP-003 | Editing a `REJECTED` company sends it back to `PENDING` (BR §2) |

### 4.7 Jobs – employer – `/api/v1/employer/jobs`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `GET /employer/jobs` | E | FR-EMP-013 | Own company's jobs, all statuses, with `applicationCount` |
| `POST /employer/jobs` | E | FR-EMP-006 | Creates a `DRAFT` |
| `GET /employer/jobs/{id}` | E | FR-EMP-009 | Includes `statusReason` if rejected/removed |
| `PATCH /employer/jobs/{id}` | E | FR-EMP-009, BR-JOB-004/005 | Material edit on `PUBLISHED` → back to `PENDING_APPROVAL`; response says so |
| `POST /employer/jobs/{id}/submit` | E | FR-EMP-007/008, BR-CMP-001, BR-JOB-002 | `422 COMPANY_NOT_VERIFIED`, `422 DEADLINE_OUT_OF_RANGE` |
| `POST /employer/jobs/{id}/pause` | E | FR-EMP-010 | `PUBLISHED → PAUSED` |
| `POST /employer/jobs/{id}/resume` | E | FR-EMP-010 | `PAUSED → PUBLISHED` (deadline must still be in future) |
| `POST /employer/jobs/{id}/close` | E | FR-EMP-011, BR-JOB-007 | Final |

### 4.8 Applications – employer – `/api/v1/employer`
| Method & path | Role | Requirement | Notes |
|---|---|---|---|
| `GET /employer/jobs/{jobId}/applications` | E | FR-EMP-014 | Name, applied date, status; `email` is `null` until SHORTLISTED or later (BR-APP-010). Anonymised rows show "Candidate removed" |
| `GET /employer/applications/{id}` | E | FR-EMP-015, BR-APP-010 | Candidate profile + cover letter + status history; same email rule (phone too) |
| `GET /employer/applications/{id}/cv-url` | E | FR-EMP-015, NFR-SEC-008 | Signed URL to the **snapshot**, 5 min |
| `POST /employer/applications/{id}/status` | E | FR-EMP-017/018, BR-APP-004/005/007 | Body `{ to, message? }`; `message` only allowed with `REJECTED`. `409 INVALID_TRANSITION` / `STATE_CHANGED` |

Every employer endpoint checks that the job belongs to **the caller's own company** (FR-EMP-015). This is the
most important security test in the project (MVP acceptance criteria §5).

### 4.9 Admin – `/api/v1/admin`
All admin endpoints: role A only; every write is ✍️ and requires a `reason` where the rules say so.

| Method & path | Requirement | Notes |
|---|---|---|
| `GET /admin/users?q=&role=&status=` | FR-ADM-004 | Search by email or name |
| `GET /admin/users/{id}` | FR-ADM-005 | Never returns password hash or session data |
| `POST /admin/users/{id}/suspend` | FR-ADM-006, BR-USR-002 | Body `{ reason }`; ends their sessions ✍️ |
| `POST /admin/users/{id}/reactivate` | FR-ADM-006 | ✍️ |
| `POST /admin/users/{id}/erase` | BR-USR-004 | Employer deletion requested via support; body `{ reason }`; closes open jobs, queues erasure ✍️ |
| `GET /admin/companies?status=PENDING` | FR-ADM-007 | Oldest first (the queue) |
| `GET /admin/companies/{id}` | FR-ADM-008 | |
| `POST /admin/companies/{id}/verify` | FR-ADM-008 | ✍️ |
| `POST /admin/companies/{id}/reject` | FR-ADM-008, BR-CMP-002 | Body `{ reason }` ✍️ |
| `POST /admin/companies/{id}/suspend` · `/reinstate` | BR-CMP-002/003 | `suspend` needs `{ reason }` ✍️ |
| `GET /admin/jobs?status=PENDING_APPROVAL` | FR-ADM-009 | Oldest first |
| `GET /admin/jobs/{id}` | FR-ADM-010 | |
| `POST /admin/jobs/{id}/approve` | FR-ADM-010 | ✍️ |
| `POST /admin/jobs/{id}/reject` | FR-ADM-010 | Body `{ reason }` ✍️ |
| `POST /admin/jobs/{id}/remove` | FR-ADM-011, BR-JOB-008 | Body `{ reason }`; final ✍️ |
| `GET /admin/industries` · `POST` · `PATCH /{id}` | FR-ADM-014 | Deactivate via `PATCH { isActive: false }` ✍️ |

Admin accounts are created only by the setup script (`npm run admin:create`), never through the API (FR-ADM-001).

### 4.10 Operations
| Method & path | Role | Notes |
|---|---|---|
| `GET /api/health` | 🌐 | `{ status: "ok" }` + DB check; no version or internal details (NFR-OBS-001) |
| `GET /api/v1/openapi.json` | 🌐 | API spec |

## 5. Rate Limits (NFR-SEC-007)
| Endpoint group | Limit |
|---|---|
| Sign-up, sign-in, forgot/reset password | 10 / min per IP (stricter on sign-in after FR-AUTH-009 lockout) |
| CV upload | 10 / hour per user |
| Applications (create) | 30 / hour per user |
| Everything else | 120 / min per user or IP |

## 6. Testing the API
- **Authorisation matrix test:** for each endpoint, a table-driven test calls it as visitor, candidate,
  employer, other-company employer and admin, and asserts the expected `401/403/404/2xx`. This covers BR §5
  and the MVP acceptance criteria.
- **Contract test:** CI fails if `openapi.json` changes without the committed copy being updated, so API
  changes are always visible in pull requests.

## 7. Decisions (PO, 2026-11-11)
- Q1 Public search: ✅ **public** – visitors can search and view jobs; login required to apply. Protected by
  rate limits and the 50-per-page cap (§3, §5).
- Q2 Candidate contact details: ✅ email (and phone) shown to employers **only from SHORTLISTED onward**
  (BR-APP-010). Note: a candidate's CV may itself contain contact details – that is the candidate's choice.
