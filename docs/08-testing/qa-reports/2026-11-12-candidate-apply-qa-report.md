# QA Report – Candidate profile, CVs and applying (sprint S3)

| Field | Value |
|---|---|
| Date | 2026-11-12 |
| Build | branch `feat/candidate-apply`, production build (`next build && next start`) |
| Browser | Chromium (Playwright 1.65.0), 1280 × 720 and phone 360 × 780 |
| Test suite | [`e2e/apply.spec.ts`](../../../e2e/apply.spec.ts) – `npm run test:e2e` |
| Result | ✅ **9 / 9 passed** (whole suite 40 / 40), 3 consecutive runs |

Requirements: FR-CAN-001, FR-CAN-005, FR-CAN-010…013, FR-EMP-013, BR-APP-001…003, NFR-SEC-008, NFR-UX-001/003,
PO decision D-07 (candidate tab bar), MVP acceptance criterion "a candidate cannot see another candidate's
applications".

## Results

| # | Check | Requirement | Result | Screenshot |
|---|---|---|---|---|
| 80 | A candidate without a CV sees "Add your CV to apply" and lands on Profile & CVs with a way back | J4 | ✅ | [80](screenshots/80-profile-empty.png) |
| 81 | Profile saved (optional fields can stay empty) | FR-CAN-001 | ✅ | [81](screenshots/81-profile-saved.png) |
| 82 | A text file named `.pdf` is refused – type checked from the content | NFR-SEC-008 | ✅ | [82](screenshots/82-cv-wrong-type.png) |
| 83 | Real PDF uploaded; "You're ready to apply · Back to the job" | FR-CAN-005 | ✅ | [83](screenshots/83-cv-uploaded.png) |
| 84–85 | Apply in **2 clicks** (Apply now → Send), newest CV pre-selected; timeline shows "Application sent" | FR-CAN-010/013, NFR-UX-003 | ✅ | [84](screenshots/84-apply-sheet.png) · [85](screenshots/85-application-detail.png) |
| 86 | Job page then shows "Applied on … · Application sent" instead of Apply | BR-APP-002 | ✅ | [86](screenshots/86-job-already-applied.png) |
| 87 | My applications lists it with its status | FR-CAN-013 | ✅ | [87](screenshots/87-my-applications.png) |
| 88 | Another candidate: not-found screen, nothing in the HTML, **API 404**, empty list | MVP criterion | ✅ | – |
| 89 | Employer's job list shows **1** application | FR-EMP-013 | ✅ | [89](screenshots/89-employer-application-count.png) |
| 90 | Employer opening `/candidate/*` gets a real 404 | NFR-SEC-003 | ✅ | – |
| 91–93 | Phone: profile page fits; **tab bar** Find jobs · Applied · Me works; apply bar sits above it | NFR-UX-001, D-07 | ✅ | [91](screenshots/91-profile-mobile-360px.png) · [92](screenshots/92-candidate-tab-bar-360px.png) · [93](screenshots/93-job-apply-bar-above-tabs-360px.png) |
| 94 | Phone: employers get their navigation as a row under the header | NFR-UX-001 | ✅ | – |

**Integration tests (real PostgreSQL + s3mock, 13 new):** profile required before upload; clean filenames
(`../../My CV.PDF` → `My CV.pdf`); download link only for the owner; fake PDF refused; **7 simultaneous uploads
→ exactly 5 CVs**; apply once with snapshot + history; second application refused (also with another CV);
**2 simultaneous applies → exactly 1**; snapshot survives deleting the CV; past deadline → 422, paused → 404;
someone else's CV → 404; employers can't apply; **candidate privacy (MVP criterion)**; DB CHECKs for type and size.

## Issues found and fixed

| Issue | Found by | Fix |
|---|---|---|
| **Saving a profile with an empty phone failed** ("expected string, received null"): forms send the *parsed* value, the API parsed it again and rejected `null`. The **same latent bug** affected remote jobs without a location (S1) | E2E 81 | Optional fields accept `null` (`nullish`); new unit test: every input schema accepts its own output (defect #26) |
| **No navigation on phones** for any logged-in role (header links hidden < 640 px) | Screenshot 91 | Candidate bottom tab bar (D-07); row of links for employers/admins (defect #27) |
| Apply form could grow taller than a phone screen inside the fixed bar | Design review | Max 70 % height with scrolling |
| The docs restructure had edited comments in **4 already-applied migrations** → Prisma demanded a DB reset | `prisma migrate dev` | Restored byte-for-byte (separate PR); **CI now fails any PR that changes an existing migration**; `CLAUDE.md` rule (defect #28) |

## Known limitations
- **s3mock does not verify signatures:** locally a tampered or expired download link still works. Expiry
  (5 minutes) and signature checks are enforced by Cloudflare R2 only – **verify on R2 in sprint S6**.
- Malware scanning of uploads is Release 1.0 (`scan_status = SKIPPED`).
- Withdrawing an application (FR-CAN-014) is Release 1.0; status changes by employers arrive in S4.
- Deleting a CV uses the browser's confirm dialog rather than the in-page confirmation pattern.
