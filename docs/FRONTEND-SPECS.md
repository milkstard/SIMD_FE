# IncidentHub — Frontend Specs (Spec-Driven Development)

_Source: System Design — Service Incident & Monitoring Dashboard._
_React 18, TypeScript (strict), Vite, TanStack Query, Zustand, MUI, Recharts, MSAL React, SignalR._

Each spec below is a self-contained unit of work: **Context → Requirements → Acceptance Criteria → Dependencies**.
Implement in ID order within a phase; phases are sequential. Backend equivalents (BE-xx) are the matching specs in `BACKEND-SPECS.md`.

---

## PHASE 1 — MVP

### FE-01 · Project scaffold
**Context:** Nothing exists yet.
**Requirements:**
- Vite + React 18 + TypeScript (`strict: true`)
- Install: TanStack Query, React Router 6, Zustand, `@microsoft/signalr`, MUI + DataGrid, Recharts, React Hook Form + Zod, MSAL React
- Dev deps: Vitest, React Testing Library, MSW, Playwright
- ESLint + Prettier configured
- `npm run gen:api` generates types from `../incident-hub-api/contracts/swagger.json` via `openapi-typescript`
- `.env.local` with MSAL + API config
- `vite.config.ts` proxies `/api` and `/hubs` to the backend in dev

**Acceptance Criteria:**
- [ ] `npm run build` (type-check + build) passes on a clean checkout
- [ ] `npm run gen:api` produces `src/api/generated/` with no manual edits needed
- [ ] `npm run dev` proxies a sample `/api/v1/health` call to the local backend
**Dependencies:** BE-01 (needs a running backend to proxy against)

---

### FE-02 · Auth
**Context:** Every screen needs a signed-in user before it can call the API.
**Requirements:**
- `MsalProvider` wraps the app in `app/providers.tsx`
- `useCurrentUser()` — calls `GET /api/v1/me`, cached via TanStack Query
- Auth guard: redirect to login if no account; loading state while resolving
- Fetch wrapper attaches `Authorization: Bearer <token>`; silent token refresh on `401`

**Acceptance Criteria:**
- [ ] Unauthenticated visit to any route redirects to Entra login
- [ ] After login, `useCurrentUser()` resolves with roles matching the signed-in account's groups
- [ ] A `401` mid-session triggers a silent refresh and retries the original request once before surfacing an error
**Dependencies:** FE-01, BE-02, BE-11 (`/me`)

---

### FE-03 · App shell & routing
**Context:** Navigation skeleton every feature screen plugs into.
**Requirements:**
- Layout: sidebar (Dashboard, Incidents, Report, Admin), header with user avatar, notification bell, connection banner
- Lazy routes: `/`, `/incidents`, `/incidents/:number`, `/report`, `/admin/*`
- Connection banner: Live (green) / Reconnecting (amber) / Offline (red), sourced from `SignalRProvider`
- `ErrorBoundary` per route; shared `EmptyState` component

**Acceptance Criteria:**
- [ ] Each top-level route loads as a separate chunk (verified in the build output)
- [ ] An error thrown inside one route's tree doesn't blank the whole app — only that route's boundary catches it
- [ ] Connection banner reflects SignalR state changes within 1s
**Dependencies:** FE-02

---

### FE-04 · SignalR provider & real-time plumbing
**Context:** One real-time connection shared by every feature; components must never touch sockets directly.
**Requirements:**
- `SignalRProvider`: single connection, `withAutomaticReconnect()`, `accessTokenFactory`
- `realtime/handlers.ts` — `registerHandlers(conn, queryClient)` patches the TanStack Query cache for `IncidentCreated`, `IncidentUpdated`, `CommentAdded`, `DashboardChanged`, `NotificationReceived`
- `onreconnected` → `queryClient.invalidateQueries()`
- `useDashboardSubscription()` (`JoinDashboard` on mount)
- `useWatchIncident(id)` (`WatchIncident` on mount, `UnwatchIncident` on unmount)

**Acceptance Criteria:**
- [ ] No component outside `realtime/` calls `connection.on`/`.invoke` directly (lint rule or code-review checklist item)
- [ ] Unit test: `IncidentUpdated` event patches the correct TanStack Query cache entry without a refetch
- [ ] Unmounting a watched incident's detail page sends `UnwatchIncident`
**Dependencies:** FE-02, BE-09

---

### FE-05 · Report incident screen
**Context:** Primary entry point — users reporting a problem.
**Requirements:**
- `ReportIncidentForm` (React Hook Form + Zod): applicationId, environment, severity (with help text per level), title, description, stepsToReproduce, attachmentIds
- `AttachmentDropzone`: uploads to `POST /attachments` before submit; shows scan status; enforces 25MB + allowed types client-side
- `DuplicateHints`: debounced 400ms on title → `GET /incidents/similar` → up to 5 open matches shown inline
- Draft autosave to `localStorage` per user; cleared on successful submit
- Submit: `POST /incidents` with `Idempotency-Key: crypto.randomUUID()`; navigate to detail on `201`
- `ProblemDetails.errors` mapped to field errors via `setError`

**Acceptance Criteria:**
- [ ] Refreshing mid-fill restores the draft from `localStorage`
- [ ] Submitting twice in quick succession (double-click) results in one incident, not two (same idempotency key reused for the in-flight request)
- [ ] A 422 validation response highlights the correct field(s), not a generic banner only
- [ ] Oversized/disallowed file is rejected client-side before any network call
**Dependencies:** FE-01–FE-04, BE-05, BE-06, BE-08

---

### FE-06 · Incident list screen
**Context:** Triage surface for responders.
**Requirements:**
- `IncidentList`: MUI DataGrid, server-side cursor paging, virtualization
- Filter bar: status (multi), severity (multi), application, assignee (`me` toggle), SLA-at-risk toggle, text search
- Saved views (Zustand, UI state only): My incidents, My team, Unassigned, SLA at risk
- `StatusBadge`/`SeverityChip` — icon + text + colour, never colour alone
- Live row updates on `IncidentUpdated` (upsert into the TanStack Query cache, not a full refetch)
- `useIncidents(filters)` hook

**Acceptance Criteria:**
- [ ] Scrolling through >1000 rows stays smooth (virtualization verified, no full-list re-render per scroll tick)
- [ ] Switching a saved view changes only Zustand filter state — no server data is cached outside TanStack Query
- [ ] A live `IncidentUpdated` event updates the matching row in place without flashing/reordering unrelated rows
**Dependencies:** FE-04, BE-07

---

### FE-07 · Incident detail screen
**Context:** Where an incident is actually worked.
**Requirements:**
- Header: INC number, title, application, environment, `StatusBadge`, `SeverityChip`, SLA countdown
- `StatusActions`: buttons only for transitions in the DTO's `allowedTransitions`; confirm dialog with optional note; sends `If-Match`
- Optimistic status update (`onMutate`), rollback + toast ("Updated by someone else") + refetch on `409`
- Assignee section: current assignee, "Assign to me", reassign picker
- Tabs: Comments (internal badge for responders; internal toggle for responders only), History (`TimeAgo` + full date on hover), Attachments (download only when `scanStatus = Clean`)
- New Critical incidents announce via `aria-live`
- Hooks: `useIncident(number)`, `useTransitionIncident`, `useAssignIncident`, `useAddComment`

**Acceptance Criteria:**
- [ ] A role without permission for a transition never sees its button (client-side) — and a forced `403` from the server (role changed mid-session) still shows a graceful error, not a crash
- [ ] Optimistic transition rolls back visibly on `409` and the incident refetches to the server's real state
- [ ] Reporter role never sees `isInternal` comments, even transiently during a cache patch
- [ ] Attachment download link is absent/disabled until `scanStatus = Clean`
**Dependencies:** FE-04, FE-06, BE-07, BE-08

---

### FE-08 · Monitoring dashboard
**Context:** At-a-glance system health view.
**Requirements:**
- `KpiStrip`: open incidents, unassigned, SLA breached, MTTR this week
- `AppStatusBoard`: grid of applications with status chip, live via `AppStatusChanged`
- `SeverityChart` (Recharts bar): open incidents by severity
- `TrendChart` (Recharts line): reported vs resolved per day, 7d/30d
- `SlaBreachList`: table of currently breached incidents
- Data from `GET /dashboard/summary` and `GET /dashboard/app-status` only — never computed client-side from incident lists
- Hooks: `useDashboardSummary(range)`, `useAppStatus()`

**Acceptance Criteria:**
- [ ] No component recomputes aggregates from raw incident data — all chart inputs trace back to the summary/app-status endpoints
- [ ] `AppStatusChanged` event updates the relevant tile without a full dashboard refetch
- [ ] Dashboard remains usable (stale-but-present data) if SignalR disconnects — falls back to the 30s polling noted in FE-04/CLAUDE.md
**Dependencies:** FE-04, BE-11

---

### FE-09 · Notifications bell
**Context:** Keeps users aware of events relevant to them without watching the dashboard.
**Requirements:**
- Bell icon with unread-count badge in the header
- `NotificationList` dropdown — click navigates to the incident and marks read
- `PATCH /me/notifications/{id}` on read; `POST /me/notifications/read-all`
- `NotificationReceived` SignalR event appends to the list and increments the badge live

**Acceptance Criteria:**
- [ ] Badge count matches server-side unread count after a hard refresh (not just live-session state)
- [ ] Clicking a notification both navigates and marks it read in one action
- [ ] A `NotificationReceived` event while the dropdown is open inserts the new item without closing the dropdown
**Dependencies:** FE-04, BE-14 (in-app notifications backing store)

---

## PHASE 2

### FE-10 · SLA countdown & warnings
**Context:** Surface SLA risk before it becomes a breach.
**Requirements:**
- SLA countdown timer in the incident detail header, recalculated every 30s
- Amber state at >80% elapsed; red when `isSlaBreached`
- `SlaBreachList` reflects live state

**Acceptance Criteria:**
- [ ] Countdown reaches amber/red at the correct thresholds without a page refresh
- [ ] Timer stops/clears correctly when the incident resolves while the detail page is open
**Dependencies:** FE-07, BE-12

---

### FE-11 · Application status board improvements
**Context:** More context on the dashboard's app tiles.
**Requirements:**
- Show `since` (how long the current status has persisted)
- Clicking an application filters the incident list to that application

**Acceptance Criteria:**
- [ ] `since` updates live when `AppStatusChanged` fires, without a manual refresh
- [ ] Navigating from a tile pre-applies the application filter on the incident list
**Dependencies:** FE-06, FE-08

---

### FE-12 · MTTA/MTTR trend chart
**Context:** Historical performance view.
**Requirements:**
- 7d/30d range picker on the dashboard
- Line chart: average MTTA and MTTR per day from rollup data

**Acceptance Criteria:**
- [ ] Switching ranges refetches only the trend data, not the whole dashboard
- [ ] Chart renders correctly with sparse data (days with zero incidents)
**Dependencies:** FE-08, BE-15

---

### FE-13 · Admin screens
**Context:** Self-service configuration instead of direct DB edits.
**Requirements:**
- Applications CRUD: name, code, owning team, escalation contact, environments, active toggle
- Teams CRUD: name, email, Teams channel URL, members
- SLA policies: edit per-severity AckMinutes, ResolveMinutes, EscalateAtPercent

**Acceptance Criteria:**
- [ ] All three screens are reachable only by `Admin` role (route-level guard, not just hidden nav)
- [ ] Editing an SLA policy and saving reflects in the next incident's due-time calculation (not retroactively on existing ones)
**Dependencies:** FE-03, BE-03, BE-12

---

### FE-14 · Reports screen
**Context:** Offline/exportable reporting for stakeholders.
**Requirements:**
- Date range + application filter
- Summary table: incidents by application — total, resolved, avg MTTA, avg MTTR
- "Export CSV" triggers `GET /reports/incidents.csv` with current filters

**Acceptance Criteria:**
- [ ] Export respects the currently applied filters (verified against the request query string)
- [ ] Large exports don't freeze the UI — download is triggered via a direct link/anchor, not buffered in memory
**Dependencies:** BE-16

---

## PHASE 3 (future — not yet spec'd in detail)
- [ ] Public status page UI
- [ ] Post-incident review template editor
- [ ] Jira / Azure DevOps linking UI
- [ ] On-call rotation scheduling UI

---

## CROSS-CUTTING

### Testing
- [ ] Unit/component (Vitest + RTL): query by role/label, not test IDs unless unavoidable; MSW handlers in `src/test/msw/`
- [ ] Cover per feature: `ReportIncidentForm` validation, `StatusActions` per role, cache-patching in `handlers.ts`, optimistic rollback on `409`
- [ ] E2E (Playwright): report → triage → assign → resolve → close, with a second browser context asserting the live update arrives
- [ ] New feature = tests land in the same PR, no exceptions
- [ ] `npm run typecheck && npm run lint && npm run test` run before any task is considered done

### CI/CD
- [ ] CI runs `typecheck`, `lint`, `test`, and `gen:api` (fails the build if generated types differ from committed ones)
- [ ] Playwright smoke suite runs against staging before promotion to production

### UI / Accessibility (applies across all screens)
- [ ] WCAG 2.1 AA; status/severity always icon + text + colour, never colour alone
- [ ] All interactive elements keyboard-reachable; dialogs trap focus (MUI components, not custom modals)
- [ ] Theme tokens only — no hard-coded colours; light and dark mode both supported
- [ ] Loading → skeletons; empty → `EmptyState`; errors → route-level `ErrorBoundary` + inline retry
- [ ] Dates: store/receive UTC ISO strings, display in local time (`TimeAgo` + full date on hover)

### Performance
- [ ] Route-level code splitting; initial bundle < 250KB gzipped
- [ ] Lists always server-paged + virtualized — no client-side pagination of large sets
- [ ] No polling while SignalR is connected (30s polling is the offline fallback only)
