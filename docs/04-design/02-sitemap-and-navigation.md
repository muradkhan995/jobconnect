# Sitemap and Navigation

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Planned design | [01-ui-flows.md §2](01-ui-flows.md#2-site-map) |

## 1. Sitemap (as built + planned)

Solid boxes are built; dashed are planned.

```mermaid
flowchart TB
  home["/ Home + search box"]
  subgraph Public
    jobs["/jobs Search"] --> job["/jobs/[id] Job details"]
    privacy["/privacy"]
  end
  subgraph Auth
    register["/register"] --> check["/check-email"]
    login["/login"]
    forgot["/forgot-password"] --> reset["/reset-password"]
  end
  subgraph Candidate
    capps["/candidate/applications"]:::planned
    cprofile["/candidate/profile · /candidate/cvs"]:::planned
    account["/account"]:::planned
  end
  subgraph Employer["Employer (/employer/* – role-gated)"]
    edash["/employer Dashboard"] --> ecompany["/employer/company"]
    edash --> ejobs["/employer/jobs"] --> enew["/employer/jobs/new"]
    ejobs --> ejob["/employer/jobs/[id]"] --> eedit["/employer/jobs/[id]/edit"]
    ejob --> eapplicants["/employer/jobs/[id]/applicants"]:::planned
  end
  subgraph Admin["Admin (/admin/* – role-gated)"]
    adash["/admin Dashboard"] --> acos["/admin/companies"] --> aco["/admin/companies/[id]"]
    adash --> ajobs["/admin/jobs"] --> ajob["/admin/jobs/[id]"]
    adash --> ausers["/admin/users"]:::planned
  end
  home --> jobs & register & login
  job -- "Log in to apply" --> login
  classDef planned stroke-dasharray: 5 5,color:#71717a
```

## 2. Where each role lands after login (docs/11 §2, D-19, D-29)

```mermaid
flowchart LR
  L[Log in] --> N{"?next= given<br/>and same-site?"}
  N -- yes --> P[That page<br/>e.g. /jobs/123]
  N -- no --> R{Role}
  R -- Candidate --> J["/jobs"]
  R -- Employer --> E["/employer"]
  R -- Admin --> A["/admin"]
```

## 3. Navigation per role (as built)

| Role | Header links (left) | Header (right) |
|---|---|---|
| Visitor | – | Find jobs · Log in · **Sign up** |
| Candidate | Find jobs | name · Candidate · Log out |
| Employer | Dashboard · Jobs · Company | name · Employer · Log out |
| Admin | Dashboard · Companies · Jobs | name · Admin · Log out |

Planned: candidate bottom tab bar on phones (Find jobs · Applied · Me) – [01-ui-flows.md §2.1](01-ui-flows.md#21-navigation-per-role).

## 4. Access rules (who can open what)

| Area | Visitor | Candidate | Employer | Admin | Enforced by |
|---|---|---|---|---|---|
| `/`, `/jobs`, `/jobs/[id]`, auth pages | ✅ | ✅ | ✅ | ✅ | – |
| `/employer/*` | → login | 404 | ✅ own data only | 404 | proxy gate + page + service |
| `/admin/*` | → login | 404 | 404 | ✅ | proxy gate + page + service |
| Another employer's job page | → login | 404 | not-found screen (D-20) | 404 | service ownership |
