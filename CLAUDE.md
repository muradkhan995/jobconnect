# JobConnect – instructions for AI assistants

@AGENTS.md

## Keep the docs in sync (required)

Every change to the project must update the documentation **in the same branch / pull request**:

1. **`docs/00-solution-document.md`** – the living Software Solution Document. Update whatever the
   change affects: status (§1), architecture/stack/code map (§3–5), requirements traceability (§6),
   data model (§7), API/pages (§8), security (§9), tests/CI/QA (§10), environments (§11),
   decision log (§12), change log (§13, one row per PR), open questions/next steps (§14).
   Bump _Version_ and _Last updated_.
2. **The document in `docs/` the change belongs to** (map: `docs/README.md`) – e.g. new table →
   `05-design/01-data-model.md` (+ ER diagram), new endpoint → `05-design/02-api-design.md`, new screen →
   `04-design/` (UI flows, screen inventory), new lifecycle → `05-design/03-state-diagrams.md`,
   architecture decision → `06-architecture/03-adr-log.md`, requirement change → `03-requirements/`,
   new test → `08-testing/03-test-cases.md`, UI text → `11-content/`, deploy/ops change → `09-deployment/`
   / `10-operations/`, security/privacy change → `12-audit/`. Diagrams are Mermaid.
3. **`README.md`** when setup, scripts or commands change.

A change is not done until the docs describe it. Record decisions with their date and who made them
(PO = Product Owner, Dev = developer/assistant).

## Working rules

- Process, Definition of Ready and Definition of Done: `docs/07-implementation/01-agile-methodology.md`. A change is
  done only when it meets that Definition of Done.

- Never commit to `main`; branch, push, open a PR, merge only when CI is green.
- Run before committing: `npm run format:check && npm run lint && npm run typecheck && npm test`;
  for DB/auth changes also `npm run test:integration`; for UI flows `npm run test:e2e`.
- New dependencies: pin a release at least two weeks old.
- Next.js 16 differs from older versions – read `node_modules/next/dist/docs/` before using an API.
- Prisma 7: after `prisma migrate dev`, run `prisma generate` (`npm run db:migrate` does both).
