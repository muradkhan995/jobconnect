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
npm run db:up        # start local PostgreSQL
npm run db:deploy    # apply database migrations
npm run dev          # http://localhost:3000
```

Health check: <http://localhost:3000/api/health>

## Scripts

| Command                           | What it does                  |
| --------------------------------- | ----------------------------- |
| `npm run dev`                     | Start the dev server          |
| `npm run build` / `npm start`     | Production build / run it     |
| `npm run lint`                    | ESLint (fails on any warning) |
| `npm run typecheck`               | TypeScript check              |
| `npm run format` / `format:check` | Prettier write / check        |
| `npm test` / `test:coverage`      | Unit tests / with coverage    |
| `npm run db:up` / `db:down`       | Start / stop local services   |

## Contributing

All changes reach `main` through a pull request with passing CI (NFR-MNT-002).
