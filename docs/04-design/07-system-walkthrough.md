# JobConnect – Step-by-Step System Walkthrough

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | 2026-11-12 |
| Screenshots | 62 real screenshots from the automated browser tests (`npm run test:e2e`) |
| Covers | Everything built up to sprint S3; applicant management (S4) and account deletion (S5) come next |

Every picture below was taken automatically by the end-to-end tests while they used the real application
(production build, real emails in Mailpit). Re-running `npm run test:e2e` refreshes all of them, so this
walkthrough always shows the current product. Requirement IDs in brackets link the step to
[the requirements](../03-requirements/01-functional-requirements.md).

```mermaid
flowchart LR
  A["A · Sign up<br/>& log in"] --> C["C · Company<br/>verified"] --> D["D · Job posted<br/>& approved"] --> E["E · Candidate<br/>finds the job"] --> F["F · Applies &<br/>sees status"]
  B["B · Reset<br/>password"] -.-> A
  G["G · Same on<br/>a phone"] -.-> E & F
  F -.-> S4["S4 · Employer reviews<br/>applicants (next)"]:::planned
  classDef planned stroke-dasharray: 5 5,color:#71717a
```

## Contents

| Part | Flow | Who | Steps |
|---|---|---|---|
| [A](#part-a--first-visit-and-creating-an-account) | First visit and creating an account | Visitor → Candidate | 11 |
| [B](#part-b--forgotten-password) | Forgotten password | Any user | 4 |
| [C](#part-c--employer-gets-the-company-verified) | Employer gets the company verified | Employer ↔ Admin (journeys J1, J2) | 14 |
| [D](#part-d--posting-a-job-and-getting-it-approved) | Posting a job and getting it approved | Employer ↔ Admin (journeys J2, J3) | 13 |
| [E](#part-e--finding-a-job) | Finding a job | Visitor / Candidate (journey J4) | 5 |
| [F](#part-f--applying-and-following-the-status) | Applying and following the status | Candidate (journey J4) | 9 |
| [G](#part-g--on-a-phone-360-px)) | On a phone (360 px) | Mobile-first candidate screens (NFR-UX-001) | 6 |

---

## Part A – First visit and creating an account

*Visitor → Candidate*

### Step 1 – Home page for a visitor

The value proposition and the two ways in: sign up or log in.

![Step 1: Home page for a visitor](../08-testing/qa-reports/screenshots/01-home-visitor.png)

### Step 2 – Search straight from the home page

Anyone can search jobs without an account (D-04).

![Step 2: Search straight from the home page](../08-testing/qa-reports/screenshots/60-home-search.png)

### Step 3 – Sign-up form

Choose “I'm looking for a job” or “I'm hiring”, then name, email and password.

![Step 3: Sign-up form](../08-testing/qa-reports/screenshots/02-register-empty.png)

### Step 4 – Sign-up filled in

Password ≥ 12 characters and checked against known data breaches; the privacy policy must be accepted (FR-AUTH-001/003, NFR-PRV-002).

![Step 4: Sign-up filled in](../08-testing/qa-reports/screenshots/03-register-filled.png)

### Step 5 – “Check your email”

A confirmation link (valid 24 h) is sent. The same screen appears even if the email is already registered, so nobody can discover who has an account (D-11).

![Step 5: “Check your email”](../08-testing/qa-reports/screenshots/04-check-email.png)

### Step 6 – Logging in before confirming is refused

Accounts must be confirmed first; a fresh link is sent (FR-AUTH-006).

![Step 6: Logging in before confirming is refused](../08-testing/qa-reports/screenshots/05-login-unverified.png)

### Step 7 – The confirmation email

Plain-text and HTML versions; the long link wraps on phones.

![Step 7: The confirmation email](../08-testing/qa-reports/screenshots/06-email-confirmation.png)

### Step 8 – Email confirmed

Clicking the link activates the account.

![Step 8: Email confirmed](../08-testing/qa-reports/screenshots/07-email-confirmed.png)

### Step 9 – Wrong password

A generic message that doesn't say whether the email or the password was wrong.

![Step 9: Wrong password](../08-testing/qa-reports/screenshots/08-login-wrong-password.png)

### Step 10 – Logged in

The header shows the name and role.

![Step 10: Logged in](../08-testing/qa-reports/screenshots/09-logged-in-candidate.png)

### Step 11 – Logged out

A full page reload, so no private page stays in the browser's memory (D-27).

![Step 11: Logged out](../08-testing/qa-reports/screenshots/10-logged-out.png)

[↑ Back to contents](#contents)

---

## Part B – Forgotten password

*Any user*

### Step 12 – Ask for a reset link

Same answer whether or not the account exists.

![Step 12: Ask for a reset link](../08-testing/qa-reports/screenshots/11-forgot-password-sent.png)

### Step 13 – The reset email

Link valid for 1 hour.

![Step 13: The reset email](../08-testing/qa-reports/screenshots/12-email-reset.png)

### Step 14 – Choose a new password

Same password rules as sign-up.

![Step 14: Choose a new password](../08-testing/qa-reports/screenshots/13-reset-password-form.png)

### Step 15 – Password changed

Every other session is signed out (FR-AUTH-008).

![Step 15: Password changed](../08-testing/qa-reports/screenshots/14-password-changed.png)

[↑ Back to contents](#contents)

---

## Part C – Employer gets the company verified

*Employer ↔ Admin (journeys J1, J2)*

### Step 16 – Employer's home

Employers land on their own dashboard.

![Step 16: Employer's home](../08-testing/qa-reports/screenshots/15-demo-employer.png)

### Step 17 – Create a company profile first

Every company is checked by our team before its jobs can go live (FR-EMP-004).

![Step 17: Create a company profile first](../08-testing/qa-reports/screenshots/20-employer-no-company.png)

### Step 18 – Company form – all problems shown at once

Plain-language messages next to each field.

![Step 18: Company form – all problems shown at once](../08-testing/qa-reports/screenshots/21-company-form-validation.png)

### Step 19 – Submitted: “Being reviewed”

The company enters the admin's verification queue.

![Step 19: Submitted: “Being reviewed”](../08-testing/qa-reports/screenshots/22-company-being-reviewed.png)

### Step 20 – Admin's home

Admins land on their dashboard.

![Step 20: Admin's home](../08-testing/qa-reports/screenshots/16-demo-admin.png)

### Step 21 – Admin dashboard

Counts of companies and jobs waiting for a decision.

![Step 21: Admin dashboard](../08-testing/qa-reports/screenshots/23-admin-dashboard.png)

### Step 22 – Verification queue

Oldest first, with tabs per status (FR-ADM-007).

![Step 22: Verification queue](../08-testing/qa-reports/screenshots/24-admin-verification-queue.png)

### Step 23 – Reviewing a company

Details, owner and the decision panel.

![Step 23: Reviewing a company](../08-testing/qa-reports/screenshots/25-admin-review-company.png)

### Step 24 – Rejecting needs a reason

The employer will see it. Confirmation names the consequence (BR-CMP-002).

![Step 24: Rejecting needs a reason](../08-testing/qa-reports/screenshots/26-admin-reject-with-reason.png)

### Step 25 – Employer is emailed with the reason

Every decision is also written to the audit log.

![Step 25: Employer is emailed with the reason](../08-testing/qa-reports/screenshots/27-email-company-rejected.png)

### Step 26 – Employer sees “Changes needed” and the reason

![Step 26: Employer sees “Changes needed” and the reason](../08-testing/qa-reports/screenshots/28-employer-changes-needed.png)

### Step 27 – Edit and resubmit

Saving sends the company back for review (BR §2).

![Step 27: Edit and resubmit](../08-testing/qa-reports/screenshots/29-employer-edit-and-resubmit.png)

### Step 28 – Admin verifies the company

If two admins decide at the same moment, only one decision wins.

![Step 28: Admin verifies the company](../08-testing/qa-reports/screenshots/30-admin-company-verified.png)

### Step 29 – Employer sees “Verified”

Jobs can now be submitted for approval.

![Step 29: Employer sees “Verified”](../08-testing/qa-reports/screenshots/31-employer-verified.png)

[↑ Back to contents](#contents)

---

## Part D – Posting a job and getting it approved

*Employer ↔ Admin (journeys J2, J3)*

### Step 30 – Employer's jobs – empty

![Step 30: Employer's jobs – empty](../08-testing/qa-reports/screenshots/40-employer-jobs-empty.png)

### Step 31 – Job form – all errors at once

Location is required unless remote; maximum salary must be at least the minimum (BR-JOB-003/010).

![Step 31: Job form – all errors at once](../08-testing/qa-reports/screenshots/41-job-form-validation.png)

### Step 32 – Job filled in

Salary with period, closing date 1–90 days ahead at submission (BR-JOB-002).

![Step 32: Job filled in](../08-testing/qa-reports/screenshots/42-job-form-filled.png)

### Step 33 – Saved as a draft

Only the employer can see drafts.

![Step 33: Saved as a draft](../08-testing/qa-reports/screenshots/43-job-draft-saved.png)

### Step 34 – Submit for approval – confirmation

![Step 34: Submit for approval – confirmation](../08-testing/qa-reports/screenshots/44-job-submit-confirm.png)

### Step 35 – “Waiting for approval”

![Step 35: “Waiting for approval”](../08-testing/qa-reports/screenshots/45-job-waiting-for-approval.png)

### Step 36 – Admin sees a job waiting

![Step 36: Admin sees a job waiting](../08-testing/qa-reports/screenshots/46-admin-dashboard-jobs.png)

### Step 37 – Admin reviews the job exactly as candidates will see it

A reminder of common scam signs is shown (R-07).

![Step 37: Admin reviews the job exactly as candidates will see it](../08-testing/qa-reports/screenshots/47-admin-job-review.png)

### Step 38 – Approved and published

The employer is emailed (FR-ADM-010).

![Step 38: Approved and published](../08-testing/qa-reports/screenshots/48-admin-job-approved.png)

### Step 39 – Employer sees “Live”

![Step 39: Employer sees “Live”](../08-testing/qa-reports/screenshots/49-employer-job-live.png)

### Step 40 – Editing a live job

Changing title, text or salary sends it back for approval; extending the deadline doesn't (BR-JOB-004/005).

![Step 40: Editing a live job](../08-testing/qa-reports/screenshots/50-job-edit-live-notice.png)

### Step 41 – Admin rejects the changed job with a reason

![Step 41: Admin rejects the changed job with a reason](../08-testing/qa-reports/screenshots/51-admin-job-reject-reason.png)

### Step 42 – Employer sees the reason

Edit, then submit again.

![Step 42: Employer sees the reason](../08-testing/qa-reports/screenshots/52-employer-job-changes-needed.png)

[↑ Back to contents](#contents)

---

## Part E – Finding a job

*Visitor / Candidate (journey J4)*

### Step 43 – Search results

Keyword matches word forms (“nurse” finds “Nursing”); newest first; only verified, live jobs (FR-CAN-006).

![Step 43: Search results](../08-testing/qa-reports/screenshots/61-search-results.png)

### Step 44 – Filter by work mode and job type

Filters are in the link, so a search can be shared (FR-CAN-007).

![Step 44: Filter by work mode and job type](../08-testing/qa-reports/screenshots/62-search-filtered-remote.png)

### Step 45 – No match

A clear way back: Clear filters.

![Step 45: No match](../08-testing/qa-reports/screenshots/63-search-no-results.png)

### Step 46 – Job details for a visitor

“Log in to apply” returns to this job after logging in (FR-CAN-008).

![Step 46: Job details for a visitor](../08-testing/qa-reports/screenshots/65-job-details-visitor.png)

### Step 47 – Job details for a candidate without a CV

“Add your CV to apply”.

![Step 47: Job details for a candidate without a CV](../08-testing/qa-reports/screenshots/66-job-details-candidate.png)

[↑ Back to contents](#contents)

---

## Part F – Applying and following the status

*Candidate (journey J4)*

### Step 48 – Profile & CVs, arriving from a job

Add a name and at least one CV, then apply.

![Step 48: Profile & CVs, arriving from a job](../08-testing/qa-reports/screenshots/80-profile-empty.png)

### Step 49 – Profile saved

Phone is optional and shown to employers only after shortlisting.

![Step 49: Profile saved](../08-testing/qa-reports/screenshots/81-profile-saved.png)

### Step 50 – A fake PDF is refused

The file type is checked from its content, not its name (NFR-SEC-008).

![Step 50: A fake PDF is refused](../08-testing/qa-reports/screenshots/82-cv-wrong-type.png)

### Step 51 – CV uploaded – “Back to the job”

Up to 5 CVs, 5 MB each; stored privately; downloads use 5-minute links.

![Step 51: CV uploaded – “Back to the job”](../08-testing/qa-reports/screenshots/83-cv-uploaded.png)

### Step 52 – Apply in two clicks

Newest CV pre-selected; cover letter optional (NFR-UX-003).

![Step 52: Apply in two clicks](../08-testing/qa-reports/screenshots/84-apply-sheet.png)

### Step 53 – Application sent – timeline

The CV is copied when applying, so later changes don't affect it (BR-APP-003).

![Step 53: Application sent – timeline](../08-testing/qa-reports/screenshots/85-application-detail.png)

### Step 54 – The job now shows “Applied on … · Application sent”

Each job can be applied to only once (BR-APP-002).

![Step 54: The job now shows “Applied on … · Application sent”](../08-testing/qa-reports/screenshots/86-job-already-applied.png)

### Step 55 – My applications

Every application with its real status – the product's core promise (FR-CAN-013).

![Step 55: My applications](../08-testing/qa-reports/screenshots/87-my-applications.png)

### Step 56 – The employer sees the application count

Reviewing applicants arrives in sprint S4 (FR-EMP-013).

![Step 56: The employer sees the application count](../08-testing/qa-reports/screenshots/89-employer-application-count.png)

[↑ Back to contents](#contents)

---

## Part G – On a phone (360 px)

*Mobile-first candidate screens (NFR-UX-001)*

### Step 57 – Sign-up on a phone

![Step 57: Sign-up on a phone](../08-testing/qa-reports/screenshots/17-register-mobile-360px.png)

### Step 58 – Search on a phone

![Step 58: Search on a phone](../08-testing/qa-reports/screenshots/69-search-mobile-360px.png)

### Step 59 – Job details on a phone

The apply button stays at the bottom of the screen.

![Step 59: Job details on a phone](../08-testing/qa-reports/screenshots/70-job-details-mobile-360px.png)

### Step 60 – Profile & CVs on a phone

![Step 60: Profile & CVs on a phone](../08-testing/qa-reports/screenshots/91-profile-mobile-360px.png)

### Step 61 – Candidate tab bar

Find jobs · Applied · Me (PO decision D-07).

![Step 61: Candidate tab bar](../08-testing/qa-reports/screenshots/92-candidate-tab-bar-360px.png)

### Step 62 – Apply bar above the tab bar

They never overlap.

![Step 62: Apply bar above the tab bar](../08-testing/qa-reports/screenshots/93-job-apply-bar-above-tabs-360px.png)

[↑ Back to contents](#contents)

---
