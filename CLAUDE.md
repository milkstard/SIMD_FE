# CLAUDE.md — IncidentHub Frontend (React 18 + TypeScript)

## What this is
SPA for the Service Incident and Monitoring Dashboard: users **report** incidents, **track** them through a
workflow, and **monitor** application health on a live dashboard. It talks to the ASP.NET Core API
(`/api/v1`) over REST and receives live updates over SignalR (`/hubs/incidents`).

## Reference docs
Imported (loaded into context every session):
- API contract — owned by the backend repo; endpoints, DTOs, enums, errors, SignalR events. If it conflicts with this file, the contract wins: @../SIMD_BE/docs/API-CONTRACT.md

Reference only (NOT imported — read on demand when you need the original rationale, requirements or trade-offs):
- `docs/System Design Service Incident and Monitoring Dashboard.md`
- `docs/specs/` — one spec per slice (e.g. `02_01_...md`); the source of requirements, acceptance criteria and out-of-scope lists

## Implementation ledger (`docs/implementation/`)
- `current-status.md` — audit of implementation progress for Claude and the user (imported below):
  @docs/implementation/current-status.md
- `deferred-items.md` — items the specs push to a later phase (**Scheduled**) or that can't be built yet (**Blocked**, with blocker and unblock steps). IDs (`D-01`…) are never reused.
- `completed-items.md` — deferred items that have since been delivered, keeping their original ID.

Status audit: **before** starting an implementation, add a row to `current-status.md` (`In progress`, spec, scope,
start date). **When done**, update that row (status, finish date, checks run, follow-ups). One row per implementation;
never delete rows.

When planning an implementation:
1. Read the relevant spec, `current-status.md` **and** `deferred-items.md` first.
2. Add newly found items that the spec explicitly schedules for a future phase (usually its "Out of scope" list).
3. Never defer something mandatory for the spec being implemented. If it can't be built yet, list it as **Blocked**.
4. If the implementation delivers a deferred item, remove its row from `deferred-items.md` and add it to `completed-items.md` (original ID, spec, date).

When a spec's implementation is done (checks pass, ledger updated), run the `/spec-quality-gate` skill for it.

## Commands
```bash
npm install
npm run dev            # Vite dev server (proxies /api and /hubs to the backend)
npm run build          # type-check + production build
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run test           # Vitest
npm run test:e2e       # Playwright (needs backend running)
npm run gen:api        # regenerate src/api/generated/ from ../SIMD_BE/contracts/swagger.json
```
Run `typecheck`, `lint` and `test` before finishing any task.

## Stack
Vite · React 18 · TypeScript (`strict: true`) · React Router 6 (lazy routes) · TanStack Query (server state)
· Zustand (UI state only) · `@microsoft/signalr` · MUI (+ DataGrid) · Recharts · React Hook Form + Zod
· MSAL React (Entra ID) · Vitest + React Testing Library + MSW · Playwright.

## Folder structure (feature-based)
```
src/
  app/            # providers (QueryClient, Auth, Theme, SignalR), router, layout
  api/
    generated/    # OpenAPI types — DO NOT EDIT BY HAND
    client.ts     # fetch wrapper: base URL, token, ProblemDetails parsing
    keys.ts       # query key factories (incidentKeys, dashboardKeys, ...)
  realtime/       # SignalRProvider, registerHandlers (cache patching)
  features/
    report/       # ReportIncidentForm, AttachmentDropzone, DuplicateHints
    incidents/    # IncidentList, IncidentDetail, Timeline, CommentBox, StatusActions
    dashboard/    # KpiStrip, AppStatusBoard, SeverityChart, SlaBreachList, TrendChart
    admin/        # Applications, Teams, SlaPolicies
    notifications/# Bell, NotificationList
  shared/         # StatusBadge, SeverityChip, UserAvatar, TimeAgo, ErrorBoundary, hooks
  types/          # domain unions and constants (Severity, IncidentStatus, nextStatuses)
```
A feature may import from `shared/`, `api/`, `types/` — **never from another feature**. Shared needs move to `shared/`.

## Data and state rules
- **Server data lives only in TanStack Query.** Never copy API data into Zustand or `useState`.
- Zustand is for UI state only: filters, saved view, theme, sidebar.
- Every query uses a key from `api/keys.ts` (e.g. `incidentKeys.detail(number)`); never inline array keys.
- Each feature exposes hooks (`useIncidents`, `useIncident`, `useTransitionIncident`, `useDashboardSummary`);
  components call hooks, not `fetch`.
- Types come from `api/generated`. Don't hand-write DTO interfaces; wrap or narrow generated ones if needed.
- Mutations on status/assignment are **optimistic**: update cache in `onMutate`, roll back in `onError`.
  On `409` show a toast ("Updated by someone else") and refetch the incident.
- Send `If-Match` with the incident's `rowVersion` on PATCH/transition, and an `Idempotency-Key`
  (`crypto.randomUUID()`) on create.

## Real-time (SignalR)
- One connection, created in `SignalRProvider`, token via `accessTokenFactory`, `withAutomaticReconnect()`.
- Components never call `connection.on` directly. All handlers live in `realtime/handlers.ts` and **patch the
  Query cache** (`setQueryData` / `setQueriesData`). On `onreconnected` → `queryClient.invalidateQueries()`.
- Join groups through hooks: `useDashboardSubscription()` (`JoinDashboard`), `useWatchIncident(id)`
  (`WatchIncident` on mount, `UnwatchIncident` on unmount).
- Events: `IncidentCreated`, `IncidentUpdated`, `CommentAdded`, `AppStatusChanged`, `DashboardChanged`,
  `NotificationReceived`. Keep event payload types in sync with the backend `IIncidentClient`.
- Show connection state (Live / Reconnecting / Offline) in the header banner.

## Domain in the UI
```ts
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'New' | 'Triaged' | 'InProgress' | 'OnHold' | 'Resolved' | 'Reopened' | 'Closed';
export type AppStatus = 'Operational' | 'Degraded' | 'Outage';
```
- `types/workflow.ts` holds `nextStatuses` — a **UI mirror** of the server state machine used only to show
  or hide action buttons. The server is the authority; always handle 403/409 from transitions.
- Role checks (`useCan('transition', incident)`) hide actions the user can't perform. Never rely on hiding
  for security.
- Internal comments are only rendered for Responders; the API already filters them — don't add client logic that assumes otherwise.

## Forms
- React Hook Form + Zod schema per form in the feature folder (`reportIncident.schema.ts`).
- Report form: application, environment, severity (with help text per level), title, description,
  steps to reproduce, attachments. Show `DuplicateHints` (debounced 400 ms on title) from `/incidents/similar`.
- Upload attachments first (`POST /attachments`), then submit the incident with `attachmentIds`.
  Limit 25 MB per file; allowed types: images and log/text files.
- Save the report form draft to local storage per user so a refresh doesn't lose it; clear on submit.
- Map `ProblemDetails.errors` to field errors with `setError`.

## UI and accessibility
- WCAG 2.1 AA. Status and severity always use **icon + text + colour** (`StatusBadge`, `SeverityChip`) — never colour alone.
- New Critical incidents announce via the `aria-live` region in the layout.
- All interactive elements keyboard-reachable; dialogs trap focus (use MUI components, not custom modals).
- Use theme tokens; no hard-coded colours. Support light and dark mode.
- Loading → skeletons; empty → `EmptyState`; errors → `ErrorBoundary` per route plus inline retry.
- Dates: store/receive UTC ISO strings, display in the user's local time with `TimeAgo` + full date on hover.

## Performance
- Route-level code splitting; initial bundle target < 250 KB gzipped.
- Lists use server-side paging/filtering (cursor) and DataGrid virtualisation.
- Dashboard charts use the pre-aggregated `/dashboard/summary` data — never compute aggregates from incident lists.
- Memoise only when a profiler shows a problem.

## Testing
- Unit/component: Vitest + RTL, query by role/label (not test ids unless necessary). MSW handlers in `src/test/msw/`.
- Test each feature hook and key component: report form validation, StatusActions per role, cache patching in
  `handlers.ts`, optimistic rollback on 409.
- E2E (Playwright): report → triage → assign → resolve → close, with a second browser context asserting the
  live update arrives.
- New feature = tests in the same PR.

## Code style
- Function components and hooks only. Named exports (default export only for lazy route modules).
- No `any`; use `unknown` and narrow. No non-null `!` without a comment explaining why.
- File names: `PascalCase.tsx` for components, `camelCase.ts` for hooks/utils; hooks start with `use`.
- Keep components under ~200 lines; extract subcomponents or hooks.
- Env config via `import.meta.env.VITE_*` only, read in `app/config.ts`.

## Don'ts
- Don't edit `src/api/generated/` — run `npm run gen:api`.
- Don't use `localStorage` for auth tokens (MSAL handles them) or for server data.
- Don't add Redux, another data-fetching library, or another UI kit.
- Don't poll the API when SignalR is connected (polling every 30 s is only the offline fallback).
- Don't change `nextStatuses` without the matching backend workflow change.