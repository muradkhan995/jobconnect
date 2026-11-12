# Accessibility Audit (WCAG 2.2 AA)

| Field | Value |
|---|---|
| Version | 1.0 |
| Last updated | 2026-11-12 |
| Type | Developer review of built screens + automated checks; no assistive-technology user testing yet |
| Design guidance | [04-design/06-accessibility.md](../04-design/06-accessibility.md) |

✅ meets (evidence) · 🟡 partly / not verified · ⬜ not checked

| WCAG | Criterion | Status | Notes |
|---|---|---|---|
| 1.1.1 | Non-text content | ✅ | No content images; decorative ✓ marks are next to text |
| 1.3.1 | Info and relationships | ✅ | Labels, fieldsets/legends, table captions + `th scope`, landmarks |
| 1.3.5 | Identify input purpose | ✅ | `autocomplete` on name, email, passwords |
| 1.4.1 | Use of colour | ✅ | Status badges always have text |
| 1.4.3 | Contrast (minimum) | 🟡 | Zinc palette chosen for contrast; muted `zinc-500` small text to be measured |
| 1.4.10 | Reflow (320 px) | 🟡 | Checked at 360 px (E2E); 320 px to check |
| 1.4.11 | Non-text contrast | 🟡 | Input borders `zinc-300` on white to be measured |
| 2.1.1 | Keyboard | 🟡 | Native controls throughout; full keyboard walkthrough pending |
| 2.4.3 | Focus order | 🟡 | DOM order = visual order; to verify |
| 2.4.7 | Focus visible | ✅ | 2 px outline on all interactive elements |
| 2.4.11 | Focus not obscured | 🟡 | Sticky mobile apply bar – check focus isn't hidden behind it |
| 2.5.8 | Target size (minimum) | ✅ | Buttons/inputs ≥ 44 px high |
| 3.3.1 | Error identification | ✅ | Errors in text next to fields, `aria-invalid` |
| 3.3.3 | Error suggestion | ✅ | Messages say how to fix |
| 3.3.7 | Redundant entry | ✅ | Edit forms prefilled |
| 3.3.8 | Accessible authentication | ✅ | No cognitive tests; password managers supported (`autocomplete`) |
| 4.1.2 | Name, role, value | ✅ | Native elements; links with visually-hidden context ("Review Northwind…") |
| 4.1.3 | Status messages | ✅ | `role=status` / `role=alert`; result count `aria-live` |
| – | Reduced motion | ⬜ | Spinner should respect `prefers-reduced-motion` |

## Actions before Release 0.1
1. Add axe-core checks to E2E for every screen.
2. Keyboard-only walkthrough of J1–J4; screen-reader pass (VoiceOver + NVDA).
3. Measure contrast of muted text and input borders; adjust tokens if needed.
4. `prefers-reduced-motion` for the spinner.
