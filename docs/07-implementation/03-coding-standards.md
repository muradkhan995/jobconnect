# Coding Standards

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Enforced by | TypeScript strict, ESLint (0 warnings), Prettier, CI, code review |

## 1. Language and style
- TypeScript **strict** + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- Prettier formats everything except `docs/` and generated/test output. Don't hand-format.
- ESLint with Next.js + TypeScript rules; **zero warnings**. A rule may be disabled only on one line, with a
  `--` reason (example: `sign-out-button.tsx`, full reload on logout).
- No `any`; prefer explicit types at module boundaries; use `satisfies` for Prisma selects.
- Comments explain **why** and cite the requirement/decision (`// BR-JOB-004`, `// D-24`).

## 2. Naming
| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `search-params.ts`, `job-card.tsx` |
| Components | PascalCase | `JobPreview` |
| DB tables / columns | snake_case (Prisma maps to camelCase) | `published_at` → `publishedAt` |
| Enums | UPPER_SNAKE | `PENDING_APPROVAL` |
| Audit actions | `area.event` lower-case | `company.verified` |
| API error codes | UPPER_SNAKE | `COMPANY_NOT_VERIFIED` |
| Branches | `feat/…`, `fix/…`, `docs/…`, `chore/…` | `feat/job-search` |
| Commits | Conventional Commits | `feat(search): …` |

## 3. Server rules
- **Validate every input** with Zod at the boundary (`parseBody`, `parseSearchParams`).
- **Authorise in the service**, even if the proxy/route already did (`requireRole`, ownership via the
  caller's company).
- Another user's record → **404, not 403** (API design §1.2).
- **Status changes** only via the transition table and a **guarded update**; audit entries in the **same
  transaction**.
- Never put user input into SQL strings – Prisma or `Prisma.sql` tagged templates only.
- Throw `DomainError` (status, code, message, field errors) for expected failures; let the wrapper map it.
- Read the request (`headers()`) before anything that needs secrets, so `next build` works without them.
- No personal data in logs or audit metadata (`SENSITIVE_KEYS`).
- New public responses use an explicit allow-list of fields (`toPublicJob`).

## 4. UI rules
- Every input has a visible `<label>`; errors via `TextField`/`SelectField`/`TextareaField` props.
- Show all field errors at once; clear an error when its field changes.
- Final or destructive actions go through `ActionPanel` (confirm + consequence).
- Status always shown as text (labels in `modules/*/labels.ts`).
- Test at 360 px; links and buttons don't wrap awkwardly.

## 5. Database & migrations
See [09-deployment/04-database-migrations.md](../09-deployment/04-database-migrations.md). In short: Prisma
schema first; hand-written SQL appended for CHECKs, triggers, partial/GIN indexes; `npm run db:migrate`
(migrates **and** regenerates); CI checks schema drift.

## 6. Tests
Rules and validation → unit tests. Anything touching the database or permissions → integration test against
real PostgreSQL (incl. "another user can't"). Every user journey → E2E with screenshots. See
[08-testing/01-test-strategy.md](../08-testing/01-test-strategy.md).
