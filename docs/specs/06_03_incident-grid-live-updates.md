# FE-06.03 · Incident grid and live updates
Parent: FE-06 · Incident list screen (docs/FRONTEND-SPECS.md) · Sub-spec 03 of 3

**Context:** The visible list: a virtualized MUI DataGrid that pages by cursor as the user scrolls (approved: infinite scroll) and reflects `IncidentUpdated` events in place. The cache patching for infinite lists is already implemented in `realtime/handlers.ts` (04_02); this slice proves the grid behaves correctly on top of it.

**Requirements:**
- `IncidentList`: MUI DataGrid (`@mui/x-data-grid`) fed by `useIncidents` rows, `getRowId` = `id`, row virtualization on, no client-side pagination.
- Columns: number (link to `/incidents/:number`), title, application, severity (`SeverityChip`), status (`StatusBadge`), assignee (`UserAvatar` or "Unassigned"), updated (`TimeAgo` with full date on hover). Server-side sort is limited to the contract's tokens (`createdAt`, `-createdAt`, `severity`, `-updatedAt`); other columns are not sortable.
- Next page is fetched when the scroll nears the end (`onRowsScrollEnd`); a loading row/indicator while fetching; end of list is not retried.
- Live updates: rows change only through the Query cache (`IncidentUpdated` patched by `handlers.ts`); row order is stable, unrelated rows keep their identity (no re-render of rows whose data did not change).
- Theme tokens, light/dark, keyboard navigation through rows and the number links, accessible grid label.

**Acceptance Criteria:**
- [ ] Scrolling through >1000 rows stays smooth (virtualization verified: only a window of rows is in the DOM, no full-list re-render per scroll tick)
- [ ] A live `IncidentUpdated` event updates the matching row in place without flashing or reordering unrelated rows
- [ ] Status and severity render icon + text + colour
- [ ] Rows beyond the first page load on scroll via the cursor; no polling while connected

**Dependencies:** FE-06.01, FE-06.02, FE-04 (04_02 handlers), 05_03 (`StatusBadge`), 05_01 (`SeverityChip`)

**Files to touch:**
- `src/features/incidents/IncidentList.tsx`
- `src/features/incidents/incidentColumns.tsx`
- `src/features/incidents/IncidentListRoute.tsx`
- `src/realtime/handlers.test.ts` (only if a gap appears in infinite-list patching)

**Tests:**
- Render with 1000+ MSW rows: DOM row count stays well below the total (virtualization); scroll triggers `fetchNextPage`
- Cell rendering: badge/chip text and glyph, link target, "Unassigned"
- Live update: dispatch `IncidentUpdated` through `registerHandlers` against a mounted grid; the row text changes, other rows keep order and are not re-rendered (render counter on a custom cell)
- Playwright smoke (optional here, owned by D-18): list loads and a second context's update arrives

**Out of scope:**
- Data hook, filter bar and saved views (06_01, 06_02)
- Incident detail page (FE-07), bulk actions, row selection
- Column resizing/ordering persistence, CSV export (FE-14)

