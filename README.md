# JobConnect

A job marketplace that connects candidates with **verified employers** and shows every application's
**real status** from submission to decision.

Portfolio project built to production standard (UK/EU GDPR). Design documents live in [`docs/`](docs/).

## Tech stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · PostgreSQL + Prisma 7 · Zod · Vitest · GitHub Actions.
See [`docs/08-system-architecture.md`](docs/08-system-architecture.md) for the full architecture.

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

Health check: <http://localhost:3000/api/health>

Emails the app sends locally (sign-up confirmation, password reset) land in **Mailpit**:
<http://localhost:8025>. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.

## Scripts

| Command                                     | What it does                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                               | Start the dev server (stop it before `npm ci`)                                                                                                                      |
| `npm run build` / `npm start`               | Production build / run it                                                                                                                                           |
| `npm run lint`                              | ESLint (fails on any warning)                                                                                                                                       |
| `npm run typecheck`                         | TypeScript check                                                                                                                                                    |
| `npm run format` / `format:check`           | Prettier write / check                                                                                                                                              |
| `npm test` / `test:watch` / `test:coverage` | Unit tests / watch mode / with coverage                                                                                                                             |
| `npm run test:integration`                  | Integration tests against the local Postgres + Mailpit                                                                                                              |
| `npm run test:e2e`                          | Browser tests (Playwright) against a production build; screenshots in `docs/qa/screenshots`. After a Playwright upgrade, run `npx playwright install chromium` once |
| `npm run db:up` / `db:down`                 | Start / stop local Postgres + Mailpit                                                                                                                               |
| `npm run db:migrate`                        | Create + apply a migration after changing `prisma/schema.prisma`, then regenerate the client                                                                        |
| `npm run db:deploy`                         | Apply pending migrations (what production runs)                                                                                                                     |
| `npm run db:generate`                       | Regenerate the Prisma client (also runs after `npm install`)                                                                                                        |
| `npm run db:studio`                         | Browse the local database                                                                                                                                           |
| `npm run db:seed`                           | Create / reset the local demo users                                                                                                                                 |
| `npm run perf:search`                       | Search speed check (NFR-PERF-001): 10,000 jobs, p95 per query; rolls back afterwards                                                                                |

## Contributing

All changes reach `main` through a pull request with passing CI (NFR-MNT-002).
