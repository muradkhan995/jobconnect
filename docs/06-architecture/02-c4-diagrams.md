# C4 Architecture Diagrams

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Narrative | [01-system-architecture.md](01-system-architecture.md) |

C4 model: **Context** (the system and its neighbours) → **Containers** (deployable units) → **Components**
(modules inside the app). Dashed = planned.

## Level 1 – System context

```mermaid
flowchart TB
  cand(["Candidate"]) & emp(["Employer"]) & adm(["Administrator"])
  sys["JobConnect<br/>job marketplace with verified employers<br/>and real application status"]
  mail[["Email provider"]]
  hibp[["Have I Been Pwned API"]]
  store[["Object storage (CVs)"]]
  mon[["Error monitoring"]]
  cand & emp & adm -->|HTTPS| sys
  sys -->|SMTP| mail
  sys -->|password hash prefix| hibp
  sys -.->|S3 API · planned S3| store
  sys -.->|errors · planned S6| mon
```

## Level 2 – Containers

```mermaid
flowchart TB
  user(["Browser"])
  subgraph host["App host – Fly.io or Render (UK) · planned"]
    web["Next.js web app (Node 22)<br/>pages · /api/v1 JSON · /api/auth · proxy"]
    worker["Worker (pg-boss)<br/>emails · erasure · cleanup<br/>planned"]
  end
  db[("PostgreSQL 17<br/>Neon London (planned) · Docker locally")]
  smtp[["SMTP: Mailpit locally<br/>Resend (planned)"]]
  r2[["Cloudflare R2 (EU)<br/>planned"]]
  user -->|HTTPS| web
  web -->|Prisma / pg| db
  worker -.->|pg-boss queue| db
  web -->|SMTP| smtp
  worker -.-> smtp
  web -.->|signed URLs| r2
```

## Level 3 – Components of the web app

```mermaid
flowchart TB
  subgraph next["Next.js app"]
    proxy["proxy.ts<br/>request id · CSRF · CSP · role gate · job 404"]
    subgraph ui["Pages (src/app)"]
      pub["/ · /jobs · /jobs/[id]"]
      auth["(auth)/*"]
      empui["/employer/*"]
      admui["/admin/*"]
    end
    subgraph api["Route handlers"]
      ba["/api/auth/[...all] → Better Auth"]
      v1["/api/v1/* → apiRoute / publicRoute"]
      health["/api/health"]
    end
    subgraph modules["Modules (src/modules)"]
      mauth["auth<br/>rules · password · emails · session · policy"]
      mco["company<br/>schemas · rules · service"]
      mjob["job<br/>schemas · rules · service · search"]
      maud["audit<br/>recordAudit"]
    end
    subgraph lib["Shared (src/lib)"]
      db["db (Prisma)"]
      env["env (Zod)"]
      log["logger (pino)"]
      mail["email"]
      http["http (problem, errors, api)"]
      sec["security (csp, csrf)"]
    end
  end
  proxy --> ui & api
  pub & empui & admui --> mco & mjob
  auth --> ba
  v1 --> mco & mjob
  mco & mjob --> maud
  mco & mjob & mauth --> db & mail & log
  ba --> mauth
  v1 --> http
  proxy --> sec & mjob
```

**Dependency rule:** pages and route handlers → modules → lib. Modules call each other only through
service functions (e.g. job service reads company status, never company internals).
