# CI/CD Pipeline

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Definition | `.github/workflows/ci.yml`, `.github/dependabot.yml` |

## 1. Continuous integration (as built)

Runs on every pull request and every push to `main`. Actions are pinned to commit SHAs.

```mermaid
flowchart LR
  T{{PR or push to main}} --> J1 & J2 & J3
  subgraph J1["Job: Lint, typecheck, test, build"]
    a1[checkout] --> a2[setup-node 22 + npm cache] --> a3[npm ci<br/>+ prisma generate] --> a4[format:check] --> a5[lint] --> a6[typecheck] --> a7[unit tests + coverage] --> a8[next build<br/>no secrets]
  end
  subgraph J2["Job: Integration tests"]
    b0[(Postgres 17 + Mailpit<br/>service containers)] --> b1[npm ci] --> b2[prisma migrate deploy] --> b3[schema drift check<br/>migrate diff --exit-code] --> b4[integration tests]
  end
  subgraph J3["Job: Dependency audit & secret scan"]
    c1[npm audit prod ≥ moderate] --> c2[npm audit all ≥ high] --> c3[gitleaks full history]
  end
  J1 & J2 & J3 --> G{{All green → mergeable}}
```

| Gate | Fails when |
|---|---|
| format / lint / typecheck | Any style issue, any ESLint warning, any type error |
| unit tests | Any failing test |
| build | The app can't build **without secrets** (catches import-time env access) |
| migrate deploy | A migration doesn't apply to an empty database |
| drift check | Prisma schema and migrated database disagree |
| integration tests | Any DB/permission/email test fails |
| audits | Prod dependency with a moderate+ advisory; any high+; a committed secret |

## 2. Dependency updates

```mermaid
flowchart LR
  D[Dependabot weekly] --> PR[PR: minor/patch group<br/>or single major] --> CI{CI green?}
  CI -- no --> X[Don't merge – investigate<br/>e.g. TypeScript 7 → R-14]
  CI -- yes --> M[Merge] --> L[Locally: npm ci;<br/>Playwright bump → install chromium]
```
Ignored majors: `typescript` (typescript-eslint support), `@types/node` (must match Node 22).

## 3. Continuous delivery (planned, sprint S6)

```mermaid
flowchart LR
  M[Merge to main] --> CI[CI green] --> B[Build Docker image] --> MG[prisma migrate deploy<br/>expand-only migrations] --> DP[Rolling deploy to host] --> SM[Smoke test<br/>/api/health · /jobs] --> OK{OK?}
  OK -- no --> RB[Roll back to previous image] 
  OK -- yes --> DONE[Release notes · docs/00 change log]
```

Planned additions: E2E job in CI (needs app + Postgres + Mailpit services), branch protection requiring all
jobs (Q5), nightly `pg_dump` backup job (docs/10-operations/03-backup-and-recovery.md).
