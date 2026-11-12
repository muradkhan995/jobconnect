# JobConnect

A job marketplace that connects candidates with **verified employers** and shows every application's
**real status** from submission to decision.

Portfolio project built to production standard (UK/EU GDPR). Documentation lives in [`docs/`](docs/) – start
with the [documentation map](docs/README.md) and the [Software Solution Document](docs/00-solution-document.md).
To see every flow in screenshots, open the [step-by-step walkthrough](docs/04-design/07-system-walkthrough.md).
New to the project? Read the **[Project Guide](PROJECT_GUIDE.md)** – every folder and file explained, how it all
fits together, and everything done so far.

## Tech stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · PostgreSQL + Prisma 7 · Zod · Vitest · GitHub Actions.
See [`docs/06-architecture/01-system-architecture.md`](docs/06-architecture/01-system-architecture.md) for the full architecture.

## Getting started

Requirements: **Node 22** (`nvm use`) and **Docker**.

```bash
npm install
cp .env.example .env.local
npm run db:up        # start local PostgreSQL + Mailpit
npm run db:deploy    # apply database migrations
npm run dev          # http://localhost:3000
```

### Demo users (local only)

```bash
npm run db:seed
```

Creates one confirmed account per role – **candidate**, **employer** and **admin** – listed with their
shared password in [`prisma/demo-users.ts`](prisma/demo-users.ts). The seed refuses to run against
anything but a local database.

### Demo data – 100 companies (local only)

```bash
npm run db:seed:demo                        # 100 companies, 152 users, ~210 jobs
npm run db:seed:demo -- --clean-test-data   # also remove leftovers of automated test runs
```

100 fictional companies (80 verified, 10 pending, 6 rejected, 4 suspended), one employer each
(`employer001…employer100@demo-data.jobconnect.local`), 50 candidates with profiles (`candidate001…050`),
2 admins (`admin001…002`) and ~210 jobs in every status. Same password as the demo users. Re-running
resets the data; it never touches other accounts.

Health check: <http://localhost:3000/api/health>

Emails the app sends locally (sign-up confirmation, password reset) land in **Mailpit**:
<http://localhost:8025>. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.

## Scripts

| Command                                     | What it does                                                                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                               | Start the dev server (stop it before `npm ci`)                                                                                                                                         |
| `npm run build` / `npm start`               | Production build / run it                                                                                                                                                              |
| `npm run lint`                              | ESLint (fails on any warning)                                                                                                                                                          |
| `npm run typecheck`                         | TypeScript check                                                                                                                                                                       |
| `npm run format` / `format:check`           | Prettier write / check                                                                                                                                                                 |
| `npm test` / `test:watch` / `test:coverage` | Unit tests / watch mode / with coverage                                                                                                                                                |
| `npm run test:integration`                  | Integration tests against the local Postgres + Mailpit                                                                                                                                 |
| `npm run test:e2e`                          | Browser tests (Playwright) against a production build; screenshots in `docs/08-testing/qa-reports/screenshots`. After a Playwright upgrade, run `npx playwright install chromium` once |
| `npm run db:up` / `db:down`                 | Start / stop local Postgres + Mailpit                                                                                                                                                  |
| `npm run db:migrate`                        | Create + apply a migration after changing `prisma/schema.prisma`, then regenerate the client                                                                                           |
| `npm run db:deploy`                         | Apply pending migrations (what production runs)                                                                                                                                        |
| `npm run db:generate`                       | Regenerate the Prisma client (also runs after `npm install`)                                                                                                                           |
| `npm run db:studio`                         | Browse the local database                                                                                                                                                              |
| `npm run db:seed`                           | Create / reset the local demo users                                                                                                                                                    |
| `npm run db:seed:demo`                      | 100 demo companies + 152 users + ~210 jobs (`-- --clean-test-data` also removes automated-test leftovers)                                                                              |
| `npm run perf:search`                       | Search speed check (NFR-PERF-001): 10,000 jobs, p95 per query; rolls back afterwards                                                                                                   |
| `npm run docs:test-cases`                   | Regenerate `docs/08-testing/03-test-cases.md` from the test files                                                                                                                      |

## Contributing

All changes reach `main` through a pull request with passing CI (NFR-MNT-002).
