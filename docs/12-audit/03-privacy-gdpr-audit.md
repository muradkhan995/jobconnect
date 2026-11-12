# Privacy and GDPR Audit

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Type | Developer self-assessment against UK GDPR principles – **not legal advice**; needs review before launch |

## 1. Personal data inventory (as built + planned)

| Data | Where | Purpose | Lawful basis (proposed) | Retention | Status |
|---|---|---|---|---|---|
| Name, email | `user` | Account, communication | Contract | Until deletion (+ ≤ 30 days erasure) | ✅ stored |
| Password hash | `account` | Authentication | Contract | Until deletion | ✅ Argon2id |
| Consent version + time | `user` | Prove policy acceptance | Legal obligation | Until deletion | ✅ |
| Session IP, user agent | `session` | Security | Legitimate interests | Session lifetime | ✅ |
| IP on login events | `audit_log` | Security, fraud | Legitimate interests | 24 months (BR-AUD-001) | ✅ |
| Company details | `company` | Verification, public profile | Contract / legitimate interests | Until deletion | ✅ |
| Candidate profile, phone | `candidate_profile` | Applications | Contract | Until deletion | ⬜ S3 |
| CVs + snapshots | object storage | Applications | Contract | Until deletion; snapshots anonymised 12 months after job closes | ⬜ S3 |
| Applications | `application` | Recruitment | Contract | Anonymised 12 months after closing (BR-APP-009) | ⬜ S3 |

## 2. Principles

| Principle | How it's met | Status |
|---|---|---|
| Lawfulness, transparency | Privacy policy accepted with version at sign-up | 🟡 policy text is a placeholder |
| Purpose limitation | Data used only for recruitment and security | ✅ |
| Data minimisation | Minimal sign-up fields; employers see contact details only from SHORTLISTED (BR-APP-010); public API allow-list | ✅ / ⬜ (S4) |
| Accuracy | Users edit their own profile/company | ✅ company · ⬜ profile |
| Storage limitation | Retention rules; audit 24-month DB rule; jobs for erasure/anonymisation | 🟡 jobs ⬜ |
| Integrity & confidentiality | Argon2id, HTTPS, access control layers, redacted logs, private CV storage (planned) | ✅ / ⬜ |
| Accountability | Audit log, decision log, this audit | ✅ |

## 3. Data subject rights

| Right | Mechanism | Status |
|---|---|---|
| Access / portability (FR-CAN-019, Could) | Export | ⬜ Release 1.0+ |
| Rectification | Edit profile / company | 🟡 |
| Erasure (FR-CAN-018) | Delete account → erased ≤ 30 days; employers via support (BR-USR-004) | ⬜ S5 |
| Objection / restriction | Contact support | ⬜ process |

## 4. Processors and transfers (planned)
Host (UK), Neon (London), Cloudflare R2 (EU jurisdiction), Resend (EU), Sentry (EU, PII off), HIBP (receives
only a 5-character hash prefix – not personal data). A record of processing and data processing agreements
are needed before launch.

## 5. Open items before launch
Final privacy policy · DPA with each processor · record of processing activities · erasure/anonymisation jobs ·
breach process tested (10-operations/04) · DPIA screening for AI features (Release 1.1+).
