# Backup and Recovery

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Requirements | NFR-REL-002 (daily, 30-day retention, restore tested before each release), NFR-REL-003 (RPO 24 h, RTO 4 h), NFR-PRV-003 (backups expire ≤ 35 days) |
| Status | **Planned – sprint S6** |

## 1. Backup design

```mermaid
flowchart LR
  N[(Neon production DB)] -->|nightly GitHub Action<br/>pg_dump --format=custom| E[Encrypt]
  E --> R[(R2 backup bucket, EU<br/>lifecycle: delete after 30 days)]
  N -->|Neon built-in history| PITR[Short-term point-in-time restore]
```

| Layer | Protects against | Retention |
|---|---|---|
| Neon history / branches | Recent mistakes (minutes–hours) | Plan-dependent |
| Nightly `pg_dump` to R2 | Provider loss, larger mistakes | 30 days (≤ 35 for GDPR) |
| CV objects in R2 (S3+) | – | Lifecycle aligned with erasure rules |

## 2. Restore drill (before every release – MVP criterion)

```mermaid
flowchart TD
  A[Pick latest backup] --> B[Create empty Neon branch / local DB] --> C[pg_restore] --> D[prisma migrate status = up to date]
  D --> E[Smoke queries: counts, latest job, audit tail] --> F[Record time taken vs RTO 4 h] --> G[Log result in this file]
```

## 3. Drill log

| Date | Backup | Restored to | Duration | Result |
|---|---|---|---|---|
| – | – | – | – | First drill due before Release 0.1 |

## 4. Recovery scenarios

| Scenario | Action | Data loss |
|---|---|---|
| Bad deploy | Roll back image (09-deployment/05 §3) | none |
| Bad data change | Neon point-in-time restore to a branch; copy fixed rows | minutes |
| Database lost | Restore last nightly dump | ≤ 24 h (RPO) |
| Erasure obligations after restore | Re-run erasure job for accounts deleted since the backup | – |
