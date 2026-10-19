# FE-06.02 · Filter bar and saved views
Parent: FE-06 · Incident list screen (docs/FRONTEND-SPECS.md) · Sub-spec 02 of 3

**Context:** Responders triage by narrowing the list. Filters and saved views are UI state, so they live in Zustand; the server rows they select stay in TanStack Query (06_01). Decision (approved): the contract has no "at risk" filter, so the SLA toggle and the "SLA at risk" view map to `slaBreached=true`.

**Requirements:**
- Zustand `incidentFilterStore` (UI state only): current `IncidentFilters` (06_01), active saved-view id, `setFilter`, `applyView`, `reset`.
- `FilterBar`: status (multi), severity (multi), application (single, from `useApplications`), "Assigned to me" toggle (`assignee: 'me'`), SLA toggle (`slaBreached=true`, labelled "SLA breached"), text search (debounced 400 ms with `useDebouncedValue`, max 200 chars).
- Saved views, defined in code: **My incidents** (`assignee: 'me'`), **My team** (`teamId` = the user's team from `useCurrentUser().teamIds`; hidden or disabled with a hint when the user has no team), **Unassigned** (`assignee: 'unassigned'`), **SLA at risk** (`slaBreached: true`). Selecting a view replaces the filters; editing a filter afterwards clears the active view.
- Active filters are keyboard-reachable with labels; a "Clear filters" action resets.
- Theme tokens only; `StatusBadge`/`SeverityChip` glyphs in the multi-select options.

**Acceptance Criteria:**
- [ ] Switching a saved view changes only Zustand filter state; no server data is cached outside TanStack Query
- [ ] Each filter produces the matching `GET /incidents` query (verified through MSW)
- [ ] Search is debounced 400 ms and not sent above 200 characters
- [ ] All controls are operable by keyboard and have accessible names

**Dependencies:** FE-06.01, 05_01 (`useApplications`), 05_03 (`useDebouncedValue`, `StatusBadge`, `SeverityChip`), 05_04 (`useCurrentUser`)

**Files to touch:**
- `src/features/incidents/incidentFilterStore.ts`
- `src/features/incidents/savedViews.ts`
- `src/features/incidents/FilterBar.tsx`, `SavedViewTabs.tsx`
- `src/features/incidents/IncidentListRoute.tsx` (mount the bar)

**Tests:**
- Store: `applyView` sets exactly the view's filters; editing a filter clears the active view; `reset`
- `FilterBar` (RTL, by role/label): multi-select status/severity, assignee and SLA toggles, debounced search
- Saved view switch triggers one request with the expected params (MSW) and stores nothing but filter state
- "My team" without a team shows the hint/disabled state

**Out of scope:**
- User-defined or persisted saved views (the four are fixed; no `localStorage`)
- A true SLA "at risk" server filter (add as deferred item)
- Grid rendering (06_03)
- Date-range and reporter filters

