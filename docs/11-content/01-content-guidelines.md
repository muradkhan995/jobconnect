# Content Guidelines

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Applies to | Every word in the UI, emails, errors and public pages |

## 1. Voice
**Clear, calm, honest.** JobConnect is about trust and transparency, so the writing never hides bad news
and never blames the user.

| We are | We are not | Example |
|---|---|---|
| Plain | Technical | ✅ "This link has expired or was already used." ❌ "INVALID_TOKEN" |
| Specific | Vague | ✅ "Add a location (or choose Remote)." ❌ "Invalid input." |
| Kind | Blaming | ✅ "That email and password don't match." ❌ "You entered the wrong password." |
| Honest about consequences | Surprising | ✅ "This is final: the job can't be reopened." |
| Respectful of privacy | Revealing | ✅ "If an account exists for that email, we've sent a link." |

## 2. Rules
1. Say what happened and what to do next, in that order.
2. One idea per sentence; aim for ≤ 20 words.
3. Sentence case for headings and buttons ("Post a job", not "Post A Job").
4. Buttons are verbs that name the action ("Submit for approval", "Confirm: Reject").
5. Never show raw codes, stack traces or database terms to users; show the request id only on server errors
   ("Reference: …").
6. Status words are friendly versions of the system status (see 02-ux-copy-and-messages.md §3).
7. Use "you" for the reader; "we" for JobConnect's team.
8. UK English spelling and formats: "organise", £45,000, "12 Nov 2026".
9. Don't confirm whether an email is registered (sign-up, reset).
10. Every rejection by our team includes a specific reason the employer can act on.

## 3. Formatting
| Item | Format | Example |
|---|---|---|
| Money | `Intl.NumberFormat("en-GB", GBP)`, no decimals, + period | £45,000 – £55,000 per year |
| Dates | Day month year, short month | Closes 12 Dec 2026 |
| Counts | Words for 1 | "1 job", "23 jobs" |
| Durations | Plain | "Today", "1 day", "3 days" |
