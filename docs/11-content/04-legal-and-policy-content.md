# Legal and Policy Content

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Status | **Placeholders only – must be written and reviewed before Release 0.1** |

> Nothing in this document is legal advice. Final texts need review by someone qualified in UK GDPR and
> consumer law.

| Page / text | Purpose | Status | Owner |
|---|---|---|---|
| Privacy policy (`/privacy`) | UK GDPR transparency (Art. 13/14); accepted at sign-up with a **version** (NFR-PRV-002) | 🟡 Placeholder text, version `2026-11-12` | PO |
| Terms of use | Rules for candidates and employers; prohibited content (scams, fees to apply) | ⬜ | PO |
| Cookie notice | Only strictly necessary cookies today (session) → no consent banner needed; revisit if analytics added | ⬜ write note | PO |
| Employer verification policy | What we check and why a company can be rejected/suspended | ⬜ | PO |
| Job advert policy | What gets a job rejected/removed (R-07 examples: fees, bank details, vague pay) | ⬜ | PO |
| AI notice (Release 1.1+) | Tell users when AI processes their data (NFR-PRV-006) | ⬜ | PO |
| Data subject requests | How to ask for access, deletion (self-service S5), portability | ⬜ | PO |

## Privacy policy – content checklist (to complete)
- [ ] Who we are and how to contact us
- [ ] What data we collect (account, company, jobs; planned: profile, CVs, applications; IP for security)
- [ ] Why and on what lawful basis (contract, legitimate interests for fraud prevention, legal obligation)
- [ ] Who sees it (employers see applications to their own jobs; contact details from SHORTLISTED – BR-APP-010)
- [ ] Processors (hosting, database, email, storage, error monitoring) and where (UK/EU)
- [ ] Retention (12-audit/03 §3) and erasure within 30 days
- [ ] Rights and how to use them; right to complain to the ICO
- [ ] Changes to the policy (version bump → users accept the new version)

**Versioning:** bump `CURRENT_PRIVACY_POLICY_VERSION` in `src/modules/auth/signup-rules.ts` whenever the
policy text changes; the accepted version is stored per user.
