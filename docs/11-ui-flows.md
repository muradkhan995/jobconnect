# JobConnect – UI Flows & Screens

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Phase | 2 – Design |
| Status | Proposed – awaiting Product Owner sign-off |
| Last updated | 2026-11-11 |

Scope: screens and journeys for the **MVP**. Wireframes are low-fidelity (layout and content only); visual
design (colours, typography) is decided when the UI is built with Tailwind + shadcn/ui.

---

## 1. Design Principles
| # | Principle | Source |
|---|---|---|
| P1 | **Candidate screens are mobile-first** (360 px); employer and admin screens are desktop-first but must still work on mobile | NFR-UX-001, personas |
| P2 | **Status is always visible and in plain words** – the product's core promise | Vision, MVP hypothesis |
| P3 | Apply in **≤ 3 clicks** from job details when a CV is saved | NFR-UX-003 |
| P4 | Every list has **loading, empty and error** states designed, not left blank | – |
| P5 | Destructive or final actions (close job, reject, delete account, suspend) need a **confirmation dialog** that names the consequence | BR-JOB-007, BR-APP-005 |
| P6 | WCAG 2.2 AA: keyboard reachable, visible focus, labels on every input, colour never the only signal (status badges have text) | NFR-UX-002 |
| P7 | The UI hides what a role can't do, **but the server always re-checks** | NFR-SEC-003 |

## 2. Site Map

```
Public (🌐)                     Candidate (C)                 Employer (E)                    Admin (A)
───────────                     ─────────────                 ────────────                    ─────────
/                (home+search)  /candidate/applications       /employer                       /admin
/jobs            (results)      /candidate/applications/[id]   (jobs list = home)             /admin/companies   (queue)
/jobs/[id]       (details)      /candidate/profile            /employer/company               /admin/companies/[id]
/login                          /candidate/cvs                /employer/jobs/new              /admin/jobs        (queue)
/register                       /account                      /employer/jobs/[id]             /admin/jobs/[id]
/verify-email                                                 /employer/jobs/[id]/edit        /admin/users
/forgot-password                                              /employer/jobs/[id]/applicants  /admin/users/[id]
/reset-password                                               /employer/applications/[id]     /admin/industries
/privacy  /terms                                              /account                        /account
```

**Home after login:** candidate → `/jobs` · employer → `/employer` · admin → `/admin`.

### 2.1 Navigation per role
| Role | Top navigation (desktop) / bottom tab bar (mobile, candidate only) |
|---|---|
| Visitor | Find jobs · Log in · Sign up |
| Candidate | Find jobs · My applications · Profile & CVs · Account |

**Candidate tab bar (PO decision, 2026-11-11):** logged-in candidates on screens under 768 px get a bottom
tab bar with three tabs: **Find jobs · Applied · Me** (profile, CVs, account and logout live under "Me").
Each tab has an icon **and** a text label and a touch target of at least 44 × 44 px. The sticky
**Apply now** button sits directly above the tab bar. Everyone else uses the top navigation.
| Employer | My jobs · Post a job · Company · Account |
| Admin | Companies (badge: pending count) · Jobs (badge) · Users · Industries |

## 3. Core Loop Journeys
These five journeys are the MVP's end-to-end Playwright test (MVP §5).

### J1 – Employer gets verified (David)
`/register` (role = Employer) → verify email → `/login` → `/employer` shows **"Create your company profile"**
→ `/employer/company` form → submit → banner: *"Your company is being reviewed. You can write job drafts
meanwhile."* → (admin verifies, J2) → banner changes to *"Verified"*.
If rejected: banner shows the admin's reason + **Edit and resubmit**.

### J2 – Admin verifies company and approves job (Sophie)
`/admin` → **Companies (1)** → queue, oldest first → company details (name, website, description, owner email)
→ **Verify** or **Reject** (reason required) → confirmation → back to queue, next item ready.
Same flow for **Jobs (1)** → job preview exactly as candidates will see it → **Approve** / **Reject** (reason).

### J3 – Employer posts a job (David)
`/employer/jobs/new` → form (title, description, requirements, location, job type, experience, industry,
salary min–max, deadline) → **Save draft** or **Submit for approval** → job list shows status badge
*"Waiting for approval"* → after J2: *"Live"*.
If the company isn't verified yet, **Submit** is disabled with the explanation *"Available once your company
is verified."*

### J4 – Candidate finds and applies (Amira, mobile)
`/` search box → `/jobs?q=software+engineer&location=Manchester` → job card → `/jobs/[id]` →
**Apply** (click 1) → apply sheet: CV pre-selected (most recent), optional cover letter → **Send application**
(click 2) → success: *"Application sent. Track it in My applications."*

Branches:
- Not logged in → **Apply** goes to `/login?next=/jobs/[id]`, returning to the job afterwards.
- No profile or CV → apply sheet asks for name + CV upload inline, then continues (no detour).
- Already applied → button replaced by *"Applied on 12 Nov · Under review"* linking to the application.
- Deadline passed → button disabled: *"Applications closed"*.

### J5 – Employer reviews and Amira sees the result
David: `/employer` → job row *"14 applicants"* → `/employer/jobs/[id]/applicants` → table → applicant →
**Download CV** → **Move to: Shortlisted** → (later) **Reject** with optional message → confirmation.
Amira: `/candidate/applications` → status updated to *"Shortlisted"* with date → detail page shows the timeline.

## 4. Key Screens (wireframes)

### 4.1 Job search – mobile (candidate / visitor)
```
┌────────────────────────────┐
│ JobConnect          ☰      │
├────────────────────────────┤
│ 🔍 [ software engineer   ] │
│ 📍 [ Manchester          ] │
│ [Remote ▾] [Full-time ▾]   │
├────────────────────────────┤
│ 42 jobs                    │
│ ┌────────────────────────┐ │
│ │ Software Engineer      │ │
│ │ ABC Ltd ✓ Verified     │ │
│ │ Manchester · Full-time │ │
│ │ £40,000 – £50,000      │ │
│ │ Closes 30 Nov          │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ …                      │ │
│ └────────────────────────┘ │
│      [ Load more ]         │
├────────────────────────────┤
│ Find jobs │ Applied │ Me   │
└────────────────────────────┘
```
Empty state: *"No jobs match. Try removing a filter."* + **Clear filters**.
Filters are kept in the URL, so results can be shared and the back button works.

### 4.2 Job details + apply
```
┌────────────────────────────┐
│ ← Back                     │
│ Software Engineer          │
│ ABC Ltd ✓  · Manchester    │
│ Full-time · Mid · IT       │
│ £40,000 – £50,000 / year   │
│ Closes 30 Nov 2026         │
│ ────────────────────────── │
│ About the role …           │
│ Requirements …             │
│                            │
│ ┌────────────────────────┐ │
│ │       Apply now        │ │  ← sticky at bottom on mobile
│ └────────────────────────┘ │
└────────────────────────────┘
        ▼ (Apply)
┌────────────────────────────┐
│ Apply to Software Engineer │
│ CV: (•) Amira_CV_2026.pdf  │
│     ( ) Amira_CV_short.pdf │
│     + Upload new           │
│ Cover letter (optional)    │
│ [                        ] │
│ [   Send application    ]  │
└────────────────────────────┘
```

### 4.3 My applications (candidate)
```
┌────────────────────────────┐
│ My applications            │
│ ┌────────────────────────┐ │
│ │ Software Engineer      │ │
│ │ ABC Ltd                │ │
│ │ [Shortlisted] 14 Nov   │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ Backend Developer      │ │
│ │ XYZ plc                │ │
│ │ [Not selected] 10 Nov  │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```
Detail page shows a **timeline**: Applied 12 Nov → Under review 13 Nov → Shortlisted 14 Nov, plus any
rejection message.

### 4.4 Applicants for a job (employer, desktop)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Software Engineer · Live · Closes 30 Nov     [Pause] [Close job] [Edit]  │
│ 14 applicants   Status: [All ▾]                                          │
├────────────┬─────────────────────┬────────────┬──────────────┬───────────┤
│ Name       │ Email               │ Applied    │ Status       │           │
├────────────┼─────────────────────┼────────────┼──────────────┼───────────┤
│ Amira H.   │ amira@…             │ 12 Nov     │ Shortlisted  │ View  CV↓ │
│ Ben T.     │ (after shortlisting)│ 12 Nov     │ New          │ View  CV↓ │
│ Candidate removed               │ 11 Nov     │ Under review │ –         │
└──────────────────────────────────────────────────────────────────────────┘
```
On the applicant page: profile, cover letter, timeline and a **Move to ▾** menu offering only the allowed
next statuses (BR-APP-004). **Reject** opens a dialog with an optional message and the warning *"This is
final and the candidate will see this message."*

### 4.5 Admin queue (desktop)
```
┌──────────────────────────────────────────────────────────────────┐
│ Companies awaiting verification (3)                              │
├──────────────────┬──────────────┬─────────────┬──────────────────┤
│ Company          │ Industry     │ Waiting     │                  │
├──────────────────┼──────────────┼─────────────┼──────────────────┤
│ ABC Ltd          │ IT           │ 2 days      │ Review →         │
└──────────────────┴──────────────┴─────────────┴──────────────────┘
```
Review page: details on the left, **Verify** / **Reject (reason required)** on the right. After a decision the
next item in the queue opens automatically.

## 5. Status Labels
Database statuses are never shown raw. Badge colour always comes with text (P6).

### 5.1 Application status
| Status | Candidate sees | Employer sees |
|---|---|---|
| APPLIED | Application sent | New |
| UNDER_REVIEW | Under review | Under review |
| SHORTLISTED | Shortlisted | Shortlisted |
| INTERVIEW | Interview stage | Interview |
| OFFERED | Offer made | Offered |
| REJECTED | Not selected | Rejected |
| WITHDRAWN | Withdrawn | Withdrawn by candidate |

"Not selected" is a softer wording for candidates; the meaning is the same.

### 5.2 Job status (employer)
| Status | Label |
|---|---|
| DRAFT | Draft |
| PENDING_APPROVAL | Waiting for approval |
| PUBLISHED | Live |
| PAUSED | Paused |
| REJECTED | Changes needed (+ reason) |
| CLOSED | Closed |
| REMOVED | Removed by JobConnect (+ reason) |

## 6. Forms & Feedback
- Validation messages appear **next to the field**, using the API's `errors[]` (API §2), and in plain words
  (*"Maximum salary must be at least the minimum"*).
- Submit buttons show a spinner and are disabled while sending, so a double click can't apply twice
  (the server blocks it anyway, BR-APP-002).
- `409 STATE_CHANGED` → *"This was updated by someone else. Refresh to see the latest."*
- `429` → *"Too many attempts. Try again in a minute."*
- `500` → generic message + the `requestId` for support.
- Success → short toast message; important outcomes (application sent, account deleted) get a full page.

## 7. Account & GDPR Screens
- **Register:** email, password (with strength hint and breached-password message), role choice, and an
  **unticked** checkbox *"I agree to the Privacy Policy"* with a link (NFR-PRV-002).
- **Account:** change password; candidates also see **Delete my account**, which explains what is erased
  and when, then asks for the password (FR-CAN-018).
- **Suspended login:** *"Your account is suspended. Contact support."* – no reason details on the login page.

## 8. Open Questions
- Q1: Brand/visual identity – is there a logo or colour preference, or should Phase 3 propose one?
- Q2: ✅ **Decided (PO, 2026-11-11):** candidate bottom tab bar on mobile – see §2.1.
