# JobConnect – Functional Requirements

| Field | Value |
|---|---|
| Version | 0.1 (Draft) – Part 1: Authentication + Candidate |
| Phase | 1 – Discovery |
| Last updated | 2026-11-11 |

**Priority key (MoSCoW):** M = Must · S = Should · C = Could · W = Won't (this release)

---

## 1. Authentication (all roles)

| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-AUTH-001 | The system shall allow a visitor to register with email and password, choosing the role Candidate or Employer. | M | Amira, David |
| FR-AUTH-002 | The system shall not allow self-registration as Administrator. | M | Sophie |
| FR-AUTH-003 | The system shall enforce a password policy (min. 12 characters, not in a known-breached list). | M | All |
| FR-AUTH-004 | The system shall reject registration with an email that already exists. | M | All |
| FR-AUTH-005 | The system shall send an email verification link that expires after 24 hours. | M | All |
| FR-AUTH-006 | The system shall only allow login after the email is verified. | M | All |
| FR-AUTH-007 | The system shall allow users to log out, ending their session. | M | All |
| FR-AUTH-008 | The system shall allow password reset via a time-limited email link. | M | All |
| FR-AUTH-009 | The system shall temporarily block login after 5 failed attempts. | S | All |

## 2. Candidate

### 2.1 Profile & CV
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-CAN-001 | The system shall allow a candidate to create and edit a profile (name, headline, location, phone). | M | Amira |
| FR-CAN-002 | The system shall allow a candidate to add, edit and delete education entries. | M | Amira |
| FR-CAN-003 | The system shall allow a candidate to add, edit and delete employment history entries. | M | Amira |
| FR-CAN-004 | The system shall allow a candidate to add and remove skills. | M | Amira |
| FR-CAN-005 | The system shall allow a candidate to upload up to 5 CVs in PDF or DOCX format, max 5 MB each. | M | Amira |

### 2.2 Job Search
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-CAN-006 | The system shall allow searching published jobs by keyword. | M | Amira |
| FR-CAN-007 | The system shall allow filtering jobs by location, salary range, job type, experience level and industry. | M | Amira |
| FR-CAN-008 | The system shall display full job details, including company, salary, requirements and deadline. | M | Amira |
| FR-CAN-009 | The system shall allow a candidate to save (bookmark) and unsave jobs. | S | Amira |

### 2.3 Applications
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-CAN-010 | The system shall allow a candidate to apply to a published job by selecting one of their CVs and optionally adding a cover letter. | M | Amira |
| FR-CAN-011 | The system shall prevent a candidate from applying to the same job more than once. | M | Amira |
| FR-CAN-012 | The system shall prevent applications after the job's deadline has passed. | M | Amira |
| FR-CAN-013 | The system shall display the candidate's application history with the current status of each. | M | Amira |
| FR-CAN-014 | The system shall allow a candidate to withdraw an application. | S | Amira |
| FR-CAN-015 | The system shall notify the candidate (in-app) when an application status changes. | S | Amira |
| FR-CAN-016 | The system shall send an email when an application status changes. | C | Amira |

### 2.4 Account & Privacy (GDPR)
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-CAN-017 | The system shall allow a candidate to change their password and account settings. | M | Amira |
| FR-CAN-018 | The system shall allow a candidate to delete their account and personal data (right to erasure). | M | Amira |
| FR-CAN-019 | The system shall allow a candidate to download their personal data (right to data portability). | C | Amira |

### 2.5 Candidate AI Agent
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-CAN-AI-001 | The system shall suggest jobs that match the candidate's profile skills. | C | Amira |
| FR-CAN-AI-002 | The system shall generate a cover letter draft for a specific job, which the candidate must review before submitting. | C | Amira |
| FR-CAN-AI-003 | The system shall give suggestions for improving the candidate's CV. | C | Amira |


---

## 3. Employer

### 3.1 Company Profile
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-EMP-001 | The system shall allow an employer to create a company profile (name, description, industry, size, website, location). | M | David |
| FR-EMP-002 | The system shall allow an employer to upload a company logo (PNG/JPG/WebP, max 2 MB). | S | David |
| FR-EMP-003 | The system shall allow an employer to edit their company information. | M | David |
| FR-EMP-004 | The system shall not publish any job from a company until an administrator has verified that company. | M | Amira, Sophie |
| FR-EMP-005 | The system shall allow multiple recruiters to share one company account. | W | David |

### 3.2 Job Management
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-EMP-006 | The system shall allow an employer to create a job as a draft (title, description, requirements, location, salary range, job type, experience level, industry, deadline). | M | David |
| FR-EMP-007 | The system shall require the application deadline to be a future date. | M | David |
| FR-EMP-008 | The system shall allow an employer to submit a draft job for administrator approval. | M | David, Sophie |
| FR-EMP-009 | The system shall allow an employer to edit their own jobs. | M | David |
| FR-EMP-010 | The system shall allow an employer to pause a published job (hidden from search, no new applications) and resume it. | M | David |
| FR-EMP-011 | The system shall allow an employer to close a job permanently. | M | David |
| FR-EMP-012 | The system shall automatically close a job when its deadline passes. | S | David |

### 3.3 Application Management
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-EMP-013 | The system shall display the employer's jobs with the number of applications for each. | M | David |
| FR-EMP-014 | The system shall display applicants for a job: name, email, application date, CV, years of experience, status. | M | David |
| FR-EMP-015 | The system shall allow an employer to view the profile and download the CV of candidates who applied to **their own company's jobs only**. | M | David |
| FR-EMP-016 | The system shall allow filtering applicants by status, experience and application date. | S | David |
| FR-EMP-017 | The system shall allow an employer to change an application's status according to the status lifecycle. | M | David |
| FR-EMP-018 | The system shall allow an employer to reject a candidate with an optional message. | M | David |
| FR-EMP-019 | The system shall allow an employer to invite a candidate to interview (date, time, location or video link). | S | David |
| FR-EMP-020 | The system shall allow an employer to add internal notes to an application, which are never visible to the candidate. | S | David |
| FR-EMP-021 | The system shall notify the employer (in-app) when a candidate applies. | S | David |
| FR-EMP-022 | The system shall send an email to the employer when a candidate applies. | C | David |

### 3.4 Employer Dashboard & Analytics
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-EMP-023 | The system shall display a dashboard with open jobs, total applications and applications by status. | S | David |
| FR-EMP-024 | The system shall display recruitment analytics (applications over time, time-to-hire). | C | David |

### 3.5 Employer AI Agent
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-EMP-AI-001 | The system shall generate a job description draft from the employer's bullet points. | C | David |
| FR-EMP-AI-002 | The system shall summarise an application against the job's requirements, without scoring or ranking candidates. | C | David |
| FR-EMP-AI-003 | The AI agent shall never automatically shortlist, reject or change the status of an application. | M | Amira |

---

## 4. Administrator

### 4.1 Admin Access
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-001 | The system shall only allow admin accounts to be created by an existing administrator or a secure setup script. | M | Sophie |
| FR-ADM-002 | The system shall require multi-factor authentication (MFA) for administrator login. | S | Sophie |
| FR-ADM-003 | The system shall support separate admin sub-roles (e.g. Moderator, Super Admin) with different permissions. | C | Sophie |

### 4.2 User Management
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-004 | The system shall allow an admin to list and search users by name, email, role and account status. | M | Sophie |
| FR-ADM-005 | The system shall allow an admin to view a user's account details (never their password). | M | Sophie |
| FR-ADM-006 | The system shall allow an admin to suspend and reactivate an account, with a mandatory reason. Suspended users cannot log in. | M | Sophie |

### 4.3 Company Verification
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-007 | The system shall display a queue of companies awaiting verification. | M | Sophie |
| FR-ADM-008 | The system shall allow an admin to verify or reject a company, with a mandatory reason for rejection. The employer is notified. | M | Sophie, David |

### 4.4 Job Moderation
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-009 | The system shall display a queue of jobs awaiting approval. | M | Sophie |
| FR-ADM-010 | The system shall allow an admin to approve or reject a job, with a mandatory reason for rejection. The employer is notified. | M | Sophie, David |
| FR-ADM-011 | The system shall allow an admin to unpublish any job that violates platform policy, with a mandatory reason. | M | Sophie |

### 4.5 Reports & Fraud
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-012 | The system shall allow any logged-in user to report a job as suspicious, with a reason. | S | Amira |
| FR-ADM-013 | The system shall display a queue of reported jobs, which an admin can resolve by dismissing the report, unpublishing the job or suspending the company. | S | Sophie |

### 4.6 Platform Configuration
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-014 | The system shall allow an admin to create, edit and deactivate industries and job categories. | M | Sophie |
| FR-ADM-015 | The system shall allow an admin to change platform settings (e.g. max CV size, verification link expiry). | C | Sophie |

### 4.7 Analytics & Reports
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-016 | The system shall display a platform dashboard: users by role, companies by verification status, jobs by status, total applications. | S | Sophie |
| FR-ADM-017 | The system shall show application statistics in aggregate; individual applications are only accessible to an admin while handling a report, and that access is audit-logged. | S | Sophie, Amira |
| FR-ADM-018 | The system shall allow an admin to export reports as CSV. | C | Sophie |

### 4.8 Audit Logging
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-019 | The system shall record an audit entry (who, what, target, when, IP address) for every admin action and security event (login, failed login, password reset, status change). | M | Sophie |
| FR-ADM-020 | The system shall allow an admin to view and filter the audit log. | S | Sophie |
| FR-ADM-021 | The system shall not allow any user, including admins, to edit or delete audit log entries. | M | All |

### 4.9 Admin AI Agent
| ID | Requirement | Priority | Persona |
|---|---|---|---|
| FR-ADM-AI-001 | The system shall flag potentially fraudulent jobs (e.g. "pay a fee to apply") for admin review. | C | Sophie |
| FR-ADM-AI-002 | The system shall generate a weekly platform activity summary. | C | Sophie |
| FR-ADM-AI-003 | The AI agent shall never automatically suspend accounts, reject companies or unpublish jobs. | M | All |