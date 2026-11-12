# Accessibility Design

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Target | WCAG 2.2 Level AA (NFR-UX-002) |
| Audit status | [12-audit/04-accessibility-audit.md](../12-audit/04-accessibility-audit.md) |

## 1. Principles applied
| Principle | How the UI does it |
|---|---|
| Perceivable | Text labels on every input; status as text (not colour only); `alt`-free UI (no content images yet) |
| Operable | Everything reachable by keyboard; visible focus outline; 44 × 44 px touch targets; no time limits on forms |
| Understandable | Plain-language errors next to the field; confirmations name the consequence; consistent navigation per role |
| Robust | Semantic HTML (`main`, `nav` with `aria-label`, `table` with caption + `th scope`, `fieldset`/`legend`); ARIA only where needed |

## 2. Patterns in code

| Need | Implementation |
|---|---|
| Field errors announced and linked | `aria-invalid` + `aria-describedby` → hint and error ids (`text-field.tsx`) |
| Page-level error vs. success | `role="alert"` (interrupts) vs. `role="status"` (polite) – `alert.tsx` |
| Busy buttons | `aria-busy` + disabled while sending |
| Result count updates | `aria-live="polite"` on the job count (`/jobs`) |
| Icon-like links | Visually hidden text: "Review<span class=sr-only> {company}</span>" |
| Search landmark | `<form role="search" aria-label="Search jobs">` |
| Radio cards | Native radio inside a label; selected state via `has-checked`; focus via `has-focus-visible` |

## 3. Responsive & motion
360 px to 1920 px (NFR-UX-001), checked by E2E at 360 px for no sideways scrolling. Only motion: the button
spinner (respect for `prefers-reduced-motion` to be added – audit item).

## 4. Testing approach
Automated: role/label-based Playwright selectors (they fail if labels are missing); 360 px overflow checks.
Planned: axe-core scan in E2E, keyboard-only walkthrough and a screen-reader pass (VoiceOver/NVDA) before
Release 0.1 – tracked in the accessibility audit.
