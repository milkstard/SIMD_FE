---
name: frontend
description: Rules for designing or building any IncidentHub screen, component or mockup: colour tokens, typography, spacing, layout, components, do's and don'ts, and a consistency checklist.
---

# IncidentHub design rules

IncidentHub is an internal incident reporting, tracking and monitoring tool (React + TypeScript SPA on ASP.NET Core, SignalR live updates, Entra ID sign-in). The interface is a bright, friendly instrument panel: healthy things look cheerful, problems are clear without being alarming, and fixing something feels like a win.

Use this skill whenever you design, build, review or change any IncidentHub UI: a screen, a component, a mockup, an email or Teams card, or CSS. The source of truth is the **IncidentHub design system artifact** (https://claude.ai/code/artifact/bed59211-a5ec-483f-8032-a500026151ab). If its `project/tokens.json` disagrees with this skill, the design system wins. Re-read it before large changes.

## 1. Core principles

1. **Bright when healthy, clear when it matters.** Ultramarine shell, lime accent, mint for healthy and resolved. Red only for Critical, Outage and breached SLAs.
2. **Never colour alone.** Every severity, status and health state is shape + word + colour (WCAG 2.1 AA).
3. **Three encodings stay separate.** Severity is *filled* (`SeverityChip`). Workflow status is *outlined* (`StatusBadge`). App health is a *glyph + word* (`AppStatus`).
4. **The number leads.** Incident numbers, timers and KPIs get their own faces (mono and display).
5. **Live updates, no flashing.** Content updates in place. Nothing pulses or slides.

## 2. Colour tokens

Always reference tokens as CSS variables (`var(--brand)`). Never hard-code hex values in components or screens.

| Token | Light | Dark | Use for |
| --- | --- | --- | --- |
| `surface-000` | #ffffff | #1c1c3a | Cards, tiles, table rows, inputs, top bar |
| `surface-100` | #f5f6fc | #13132a | Page background |
| `surface-200` | #e8eaf6 | #0d0d20 | Table header row, log excerpts, disabled fills |
| `line` | #d6d9ec | #2e2f55 | Hairlines between rows, card edges (decorative only) |
| `line-strong` | #7c80a8 | #6f73a8 | Control borders, StatusBadge outline (3.5:1+) |
| `ink` | #17183a | #ecebff | Primary text and numbers |
| `ink-muted` | #535679 | #a7a8cf | Timestamps, labels, helper text, captions |
| `brand` | #3b3fd6 | #8c95ff | Primary buttons, links, active tab underline, chart lines |
| `brand-strong` | #2a2ca8 | #aab1ff | Hover / pressed brand |
| `brand-tint` | #e3e5ff | #2a2d6e | Selected row, active saved view, pressed segment |
| `on-brand` | #ffffff | #10113a | Text on brand fills |
| `nav-ground` | #1d1b55 | #28266a | Left nav rail |
| `nav-ink` / `nav-ink-muted` | #eceaff / #a9a7e0 | same | Nav labels / section labels and counts |
| `focus` | #3b3fd6 | #aab1ff | 2px focus ring, 2px offset |
| `focus-on-nav` | #c6f24e | #c6f24e | Focus ring and selected bar inside the nav |
| `spark` | #c6f24e | #c6f24e | Lime celebration accent, fills only |
| `sev-critical` / `-tint` | #c81e3a / #ffe6ea | #ff8a9a / #3e1824 | Critical, Outage, SLA breached |
| `sev-high` / `-tint` | #b34700 / #ffedd8 | #ffa95e / #3c2412 | High, Degraded, SLA at risk, Reopened |
| `sev-medium` / `-tint` | #846400 / #fff3c4 | #f2d158 / #352c0e | Medium (caution) |
| `sev-low` / `-tint` | #46557a / #e7ecf8 | #b3bfe0 / #252b45 | Low |
| `status-operational` / `-tint` | #0b7a50 / #d8f6e8 | #5fe0a8 / #123326 | Operational, Resolved, improving deltas, Live dot, healthy tiles |
| `status-degraded` | alias of `sev-high` | | Degraded health |
| `status-outage` | alias of `sev-critical` | | Outage health |

**Colour rules**
- Signal colours (`sev-*`, `status-operational`) are for text and glyphs. Their `-tint` goes behind them. Never put white text on a signal colour.
- Status temperature: grey (no data) → mint (healthy) → yellow (Medium) → orange (High) → red (Critical). A roll-up (app tile, team, group) shows its most urgent child.
- Yellow means caution only. Celebrate with `spark` (lime) or mint, never yellow.
- `spark` is never text on a light surface. Text on `spark` is `nav-ground`.
- Derived app health matches the backend: open Critical in Prod = Outage, any open High = Degraded, otherwise Operational.
- Both themes are always supported. Dark is for wallboards and night shifts. Set `data-theme="dark"` on a container; never hand-tune colours per screen.
- Text contrast is at least 4.5:1 in both themes (3:1 for 24px+ text, borders, focus rings and icons).

## 3. Typography

Expressive display, sober UI. Load from Google Fonts: Space Grotesk 500/600/700, IBM Plex Sans 400/500/600, IBM Plex Mono 400/500.

| Style | Family | Size / line | Weight | Use for |
| --- | --- | --- | --- | --- |
| `display-kpi` | Space Grotesk | 40 / 44, -0.02em | 600 | KPI numbers, one per tile |
| `title-page` | Space Grotesk | 24 / 32 | 600 | One screen title per page |
| `heading` | Plex Sans | 18 / 26 | 600 | Card titles, incident title |
| `subheading` | Plex Sans | 15 / 22 | 600 | Section heads in cards and forms |
| `body` | Plex Sans | 14 / 20 | 400 | Default text, table cells, form fields |
| `body-strong` | Plex Sans | 14 / 20 | 600 | Emphasis, button labels, title column |
| `caption` | Plex Sans | 12 / 16 | 400 | Meta lines, helper text, chart axes |
| `overline` | Plex Sans | 11 / 16, 0.06em, uppercase | 600 | Column headers, KPI labels, nav sections |
| `mono-id` | Plex Mono | 13 / 20 | 500 | INC numbers, app codes, trace IDs |
| `mono-time` | Plex Mono | 12 / 16 | 400 | Absolute timestamps |
| `mono-countdown` | Plex Mono | 14 / 20 | 500 | SLA timers, MTTA / MTTR |

**Type rules**
- Space Grotesk is only for page titles, KPI numbers and the sign-in headline. Everything people read or click is Plex Sans.
- Use `font-variant-numeric: tabular-nums` wherever numbers update live.
- Nothing larger than 40px inside the app.
- Sentence case everywhere. Uppercase only through `overline` CSS.

## 4. Spacing, shape and sizes

- 4px grid: `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-5` 24, `space-6` 32, `space-7` 48.
- Card padding `space-4`. Gap between dashboard cards `space-5`. Desktop page gutter `space-6`. Chip icon-to-label `space-1`. Status-board tile gap `space-2`.
- Radii: `radius-sm` 3px (chips, inputs, tiles), `radius-md` 6px (buttons, cards), `radius-full` (avatars and the connection dot only).
- Sizes: `control-sm` 28px (toolbar buttons), `control-md` 36px (default controls), `row-height` 40px (lists), `topbar-height` 48px, `nav-width` 232px. Touch targets on phone are at least 44px.
- Borders carry structure: cards get a 1px `line` border and no shadow. `shadow-overlay` is only for menus, popovers, toasts and dialogs.

## 5. Layout

**App shell.** A `nav-ground` rail on the left (sections: Monitor, Incidents, Admin; selected item gets a 3px `focus-on-nav` bar). The top bar is `surface-000` with, in order: search with a `⌘K` hint, flexible space, a primary **Report incident** button, the Live connection indicator, the notification bell, and the user avatar. Content max width is 1440px.

**Responsive.** The shell is a wrapping flex row: nav `flex: 1 1 232px`, content `flex: 999 1 560px; min-width: 0`. On phone the nav stacks on top. Toolbars wrap, and wide tables scroll inside an `overflow-x: auto` box.

**Dashboard order (fixed, impact first):**
1. KPI strip: Open, Unassigned, SLA breached, MTTR this week
2. Application status board with 30-day uptime bars
3. Open incidents by application and severity, plus the SLA breaches list
4. 30-day reported vs resolved trend with MTTA / MTTR

**Incident detail:** a header card (severity, status, INC number, app · env, title, meta line, milestone stepper, allowed actions on the left; the SLA timer on the right) → main column (description, steps, Comments / History / Attachments tabs) → sidebar (Respond panel with runbook, Teams channel, last deploy, dashboard; Details; Linked duplicates; Watching).

**Lists:** `overline` headers on `surface-200`, `row-height` rows, `space-3` cell padding, `line` between rows, no zebra striping. Cursor pagination: a "Load 25 more" button and "N shown" text, never page numbers or "x of y" totals from a filtered query.

## 6. Components

Use the bundle's real components (`window.IncidentHub.*`). Don't rebuild them in markup.

| Component | Key props | Rules |
| --- | --- | --- |
| `Button` | `variant` primary / secondary / quiet, `size` md / sm | One `primary` per view. Label is the transition verb. |
| `SeverityChip` | `severity`, `compact` | Filled tint + glyph (octagon, triangle, diamond, chevron). `compact` only when the column header says "Severity". |
| `StatusBadge` | `status` (New, Triaged, InProgress, OnHold, Resolved, Reopened, Closed) | Outlined, ink text. Only the glyph takes colour. |
| `AppStatus` | `status`, `name`, `code`, `openCount`, `history` | Inline label, or a tile when `name` is set. `history` = 30 daily entries `ok` / `degraded` / `outage` / `none`. |
| `SlaCountdown` | `remainingSeconds`, `totalSeconds`, `label` | Neutral below 80%, At risk at 80%, Breached counts up with `+`. Hide on Resolved / Closed. |
| `KpiTile` | `label`, `value`, `unit`, `delta`, `deltaTone`, `tone` | `tone="alert"` only on SLA breached when above zero. |
| `ConnectionBanner` | `state` live / reconnecting / offline, `compact` | Compact Live in the top bar. Full strip only for Reconnecting / Offline. |

**Patterns**
- Milestone stepper: New → Triaged → In progress → Resolved → Closed. Done steps in `status-operational` with a check, the current step in `brand`, upcoming steps outlined in `line-strong`.
- History opens on **Key events** (reports, status and severity changes, SLA warnings and breaches, escalations, duplicates), with an **All activity** toggle.
- Row actions appear on hover and keyboard focus only.
- Loading uses grey skeleton shapes, not spinners. "No data", "No traffic" and "No incidents" are different states.
- Sign-in is Entra ID with PKCE: one "Sign in with Microsoft" button, no username or password fields, and states for Signing in, Access denied and Session expired.

## 7. Content and copy

- Fixed workflow words: New, Triaged, In progress, On hold, Resolved, Reopened, Closed. Severity: Critical, High, Medium, Low. Health: Operational, Degraded, Outage. Never synonyms.
- Buttons say the transition: "Triage", "Start work", "Put on hold", "Resolve", "Reopen", "Close as duplicate". Never "Submit" or "OK".
- Incident references are always `INC-` + number in `mono-id`, linked.
- Time: relative in lists ("12 min ago"), absolute 24-hour with zone in timelines (`2026-10-06 10:15 AWST`), durations as `1h 42m`, countdowns as `00:42:10`.
- Errors name the person and the fix: "Maria Chen changed this incident to In progress 20 seconds ago. Your change wasn't saved." Show the `traceId` on unexpected errors.
- No emoji in product copy, notifications or Teams / Slack messages.

## 8. Practical examples

**Severity in a table cell**
```html
<x-import component-from-global-scope="IncidentHub.SeverityChip" severity="High"></x-import>
```

**A healthy status-board tile with history**
```jsx
<AppStatus name="Customer API" code="CAPI" status="Operational" openCount={0}
  history={last30Days} />   // ['ok', 'ok', 'degraded', ..., 'none']
```

**A card**
```css
.card { background: var(--surface-000); border: 1px solid var(--line);
  border-radius: var(--radius-md); padding: var(--space-4); }
.card h2 { font: 600 18px/26px var(--font-sans); color: var(--ink); margin: 0; }
```

**A KPI strip**
```html
<section style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:var(--space-4)">
  <KpiTile label="Open" value="42" delta="+6 since yesterday" deltaTone="worse" />
  <KpiTile label="SLA breached" value="3" tone="alert" delta="1 Critical, 2 High" />
</section>
```

**Focus ring**
```css
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
nav :focus-visible { outline-color: var(--focus-on-nav); }
```

## 9. Do's and don'ts

| Do | Don't |
| --- | --- |
| Use `var(--token)` for every colour, size and radius | Paste hex values or invent new greys |
| Pair every status colour with its glyph and word | Show a coloured dot with no label |
| Put healthy tiles on `status-operational-tint` | Leave a healthy board grey, or make it red-heavy |
| Keep red for Critical, Outage and breached SLAs | Use red for decoration, delete buttons or brand moments |
| Celebrate with `spark` lime or mint | Use yellow to celebrate (it means caution) |
| Use Space Grotesk only for titles and KPIs | Set body text, tables or buttons in Space Grotesk |
| Show INC numbers, codes and timers in Plex Mono | Mix proportional digits into live-updating numbers |
| Keep one primary button per view | Put two brand buttons side by side |
| Outline missing-data days in uptime bars | Draw a no-data day as healthy |
| Use real `<button>`, `<a href>`, `<label>` + `<input>` | Put click handlers on divs or spans |
| Show only the transitions the user's role allows | Hide disabled actions without explaining the rule |
| Use borders for structure | Add drop shadows to cards |
| Use skeletons while loading | Use spinners or count-up animations |
| Check both light and dark themes | Ship a colour you've only seen in light |

Also avoid: emoji, gradients, coloured left-border cards, Inter / Roboto / Arial as the main face, and drawing a logo (none was supplied; set "IncidentHub" in Plex Sans 600).

## 10. Consistency checklist

Run this before calling any IncidentHub UI done.

**Colour**
- [ ] Every colour is a token; no raw hex outside tokens.
- [ ] Signal colours appear only where something needs attention; red only for Critical / Outage / breach.
- [ ] Text passes 4.5:1 (3:1 for 24px+, borders, focus, icons) in light **and** dark.
- [ ] No white text on signal colours; no `spark` text on light surfaces.

**Typography**
- [ ] One `title-page` per screen; Space Grotesk only for titles and KPIs.
- [ ] Body is Plex Sans 14/20; IDs, timestamps and timers are Plex Mono with tabular numbers.
- [ ] Sentence case; uppercase only via `overline`.

**Spacing and layout**
- [ ] Values are on the 4px grid using `space-*` tokens.
- [ ] Shell matches: nav rail, top bar with ⌘K search and Report incident, Live indicator.
- [ ] Dashboard follows the fixed impact-first order.
- [ ] Works at phone width: nav stacks, toolbars wrap, tables scroll in a box, targets ≥ 44px.

**Components and states**
- [ ] Real `IncidentHub.*` components used for severity, status, health, SLA, KPIs and connection.
- [ ] Severity filled, status outlined, health glyph + word.
- [ ] Workflow words, button verbs and INC formatting follow the copy rules.
- [ ] Hover, focus (2px ring), selected, disabled, loading, empty, no-data and error states are covered.
- [ ] Live updates change in place, and new Critical incidents announce via `aria-live`.

**Accessibility**
- [ ] Real interactive elements, labelled inputs, `aria-label` on icon-only buttons.
- [ ] Status never shown by colour alone.
- [ ] `prefers-reduced-motion` removes even the 120ms fades.