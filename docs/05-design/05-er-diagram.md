# Entity-Relationship Diagrams

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Source of truth | `prisma/schema.prisma` + `prisma/migrations/` · column detail in [01-data-model.md](01-data-model.md) |

## 1. As built (7 migrations)

```mermaid
erDiagram
  user ||--o{ session : "logs in with"
  user ||--o{ account : "has credentials"
  user |o--o| company : "owns (one per employer)"
  industry ||--o{ company : "classifies"
  industry ||--o{ job : "classifies"
  company ||--o{ job : "posts"

  user {
    uuid id PK
    citext email UK
    text name
    bool email_verified
    user_role role
    user_status status
    text status_reason "required if SUSPENDED"
    timestamptz privacy_consent_at
    text privacy_policy_version
  }
  session {
    uuid id PK
    text token UK
    uuid user_id FK
    timestamptz expires_at
  }
  account {
    uuid id PK
    uuid user_id FK
    text provider_id "credential"
    text password "Argon2id hash"
  }
  verification {
    uuid id PK
    text identifier
    timestamptz expires_at
  }
  rate_limit {
    uuid id PK
    text key UK
    int count
    bigint last_request
  }
  industry {
    uuid id PK
    text name UK
    bool is_active
  }
  company {
    uuid id PK
    uuid owner_user_id FK "UNIQUE, NULL after erasure"
    text name
    uuid industry_id FK
    company_size size
    text website "https only"
    company_status verification_status
    text status_reason "required if REJECTED/SUSPENDED"
    timestamptz verified_at
  }
  job {
    uuid id PK
    uuid company_id FK
    text title "3-120 chars"
    text location "NULL only if REMOTE"
    work_mode work_mode
    job_type job_type
    experience_level experience_level
    uuid industry_id FK
    int salary_min "<= salary_max"
    int salary_max
    salary_period salary_period
    timestamptz deadline
    job_status status
    text status_reason "required if REJECTED/REMOVED"
    timestamptz published_at
    tsvector search_vector "generated, GIN"
  }
  audit_log {
    bigint id PK
    timestamptz occurred_at "set by DB"
    uuid actor_user_id "no FK"
    user_role actor_role
    text action "area.event"
    text target_type
    uuid target_id
    inet ip_address
    jsonb metadata "no personal data"
  }
```

`verification`, `rate_limit` and `audit_log` deliberately have **no foreign keys**: tokens and counters are
looked up by key, and audit entries must survive user deletion and are never updated (FR-ADM-021).

## 2. Planned additions (sprints S3–S4, docs/05-design/01-data-model.md §3.2–3.8)

```mermaid
erDiagram
  user ||--o| candidate_profile : "has"
  candidate_profile ||--o{ cv : "uploads (max 5)"
  candidate_profile |o--o{ application : "applies (NULL after anonymisation)"
  job ||--o{ application : "receives"
  application ||--o{ application_status_history : "changes"

  candidate_profile {
    uuid user_id PK
    text full_name
    text headline
    text location
    text phone "shown to employer from SHORTLISTED"
  }
  cv {
    uuid id PK
    uuid candidate_id FK
    text storage_key UK
    int size_bytes "<= 5 MB"
    scan_status scan_status
  }
  application {
    uuid id PK
    uuid job_id FK
    uuid candidate_id FK "UNIQUE with job_id"
    text cv_storage_key "snapshot"
    application_status status
    timestamptz applied_at
  }
  application_status_history {
    uuid id PK
    uuid application_id FK
    application_status from_status
    application_status to_status
    uuid changed_by_user_id "no FK"
    text message
  }
```
