# FE-06.01 · Incident list data layer
Parent: FE-06 · Incident list screen (docs/FRONTEND-SPECS.md) · Sub-spec 01 of 3

**Context:** The list screen needs server data before any UI. This slice builds `useIncidents(filters)` on `GET /incidents` with cursor paging, the filter-to-query mapping, and the route states. `incidentKeys.list` and the `IncidentUpdated` cache patching for infinite lists already exist (04_02), so the hook must use an infinite query keyed by `incidentKeys.list(filters)`.

**Requirements:**
- `IncidentFilters` type (in `features/incidents/`): `status[]`, `severity[]`, `applicationId`, `assignee` (`'me' | 'unassigned' | undefined`), `slaBreached`, `q`, `teamId`, `sort`. Types for query values come from `api/generated`.
- `toIncidentQuery(filters)` builds the `GET /incidents` query: repeats `status`/`severity`, maps `assignee` to `assigneeId=me|unassigned`, omits empty values, `limit=50`, default sort `-createdAt`.
- `useIncidents(filters)`: `useInfiniteQuery` with `incidentKeys.list(filters)`, `getNextPageParam` from `nextCursor` (`null` = last page), exposes the flattened rows, `fetchNextPage`, `hasNextPage`, loading/error states. A changed filter or sort starts from no cursor (cursors are valid only for the `sort` they were issued for).
- `q` over 200 chars is not sent (the `422` is avoided client-side); the UI caps input in 06_02.
- `IncidentListRoute` renders loading skeletons, `EmptyState` for no results, and an inline retry on error, inside the existing route `ErrorBoundary`.
- MSW handlers for `GET /incidents` (filters, cursor paging, `422`) in `src/test/msw/`.
- No polling while SignalR is connected (30 s fallback is owned by the provider).

**Acceptance Criteria:**
- [ ] Filters map to the contract's query parameters (repeated `status`/`severity`, `assigneeId=me|unassigned`, `slaBreached=true`, `q`)
- [ ] Next page uses the previous `nextCursor`; the last page (`nextCursor: null`) disables further fetching
- [ ] Server data lives only in TanStack Query under `incidentKeys.list(filters)`; no copy in Zustand or `useState`
- [ ] Loading shows skeletons, an empty result shows `EmptyState`, a failure shows an inline retry

**Dependencies:** FE-04 (04_02 cache patching), BE-07, 05_04 (`useCurrentUser`)

**Files to touch:**
- `src/features/incidents/incidentFilters.ts` (type + `toIncidentQuery`)
- `src/features/incidents/useIncidents.ts`
- `src/features/incidents/IncidentListRoute.tsx`
- `src/test/msw/incidents.ts` (+ register in the handler index)

**Tests:**
- `toIncidentQuery`: each filter maps correctly; empty values omitted
- `useIncidents`: loads first page, `fetchNextPage` sends the cursor, stops at `nextCursor: null`, filter change resets pages
- `IncidentListRoute`: skeleton, empty state, error with retry (MSW `500` then success)

**Out of scope:**
- Filter bar UI and saved views (06_02)
- DataGrid, virtualization and live row updates (06_03)
- A true "at-risk" server filter (API offers `slaBreached` only)
- Opening an incident from a row beyond a link (FE-07)

