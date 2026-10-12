# FE-04.02 · Event handlers and cache patching
Parent: FE-04 · SignalR provider & real-time plumbing (docs/FRONTEND-SPECS.md) · Sub-spec 02 of 3

**Context:** Server events must update the TanStack Query cache so screens change live without refetching. All
handlers live in one file; components never subscribe to events themselves.

**Requirements:**
- `src/realtime/handlers.ts` exports `registerHandlers(conn, queryClient)` and returns an unregister function. It is called by `SignalRProvider` (FE-04.01) when the connection is created.
- Handle all six server events from the API contract (`AppStatusChanged` is added beyond the five in the parent spec, per decision):
  - `IncidentCreated(IncidentSummary)`: add to matching cached incident lists and invalidate affected list/summary queries.
  - `IncidentUpdated(IncidentSummary)`: `setQueryData` on `incidentKeys.detail(number)` (merge summary fields, keep detail-only fields) and `setQueriesData` over cached lists; no refetch.
  - `CommentAdded({ incidentId, comment })`: append to the cached comments of that incident, avoiding duplicates by `comment.id`; bump `commentCount`.
  - `AppStatusChanged(AppStatusItem)`: replace the item in the app-status cache.
  - `DashboardChanged(DashboardSummary)`: `setQueryData` on the dashboard summary for its `range`.
  - `NotificationReceived(AppNotification)`: prepend to the notifications cache and bump unread state.
- Add query key factories to `src/api/keys.ts`: `incidentKeys`, `dashboardKeys`, `notificationKeys` (app status keys under `dashboardKeys`). Handlers use only these factories, never inline arrays.
- Payload types come from `src/api/generated` (no hand-written DTOs). Event payloads must stay in sync with the backend `IIncidentClient`.
- Handlers ignore events for cache entries that do not exist (no creation of empty entries).
- Announcing new Critical incidents in the layout `aria-live` region is **not** done here; `IncidentCreated` only patches the cache.

**Acceptance Criteria:**
- [ ] Unit test: an `IncidentUpdated` event patches the correct TanStack Query cache entry without a refetch.
- [ ] Each of the other five events updates its cache entry as described, and does nothing for missing entries.
- [ ] `CommentAdded` does not duplicate a comment already in the cache.
- [ ] Handlers use key factories from `api/keys.ts` only.
- [ ] Unregister function removes every handler (`conn.off`).

**Dependencies:** FE-04.01, BE-09. **Blocked** on BE regenerating `contracts/swagger.json` with `IncidentSummary`, `IncidentDetail`, `Comment`, `DashboardSummary`, `AppStatusItem` and `AppNotification`; `src/api/generated/schema.d.ts` has none of them today. Record this in `deferred-items.md` under **Blocked** with unblock steps: run `npm run gen:api`, then implement against the generated types.

**Files to touch:**
- `src/realtime/handlers.ts` (new)
- `src/realtime/handlers.test.ts` (new)
- `src/api/keys.ts` (add key factories)
- `src/realtime/SignalRProvider.tsx` (call `registerHandlers`)
- `src/test/msw/` (fixtures only if needed)
- `docs/implementation/deferred-items.md`, `current-status.md`

**Tests:**
- Vitest with a real `QueryClient` and a fake connection that records `.on` registrations; invoke the captured callbacks with fixture payloads typed from generated types.
- `IncidentUpdated`: detail and list entries change; assert no fetch (`fetchStatus` stays idle / fetch spy not called).
- `CommentAdded` dedupe; `DashboardChanged` per `range`; `AppStatusChanged` replace; `NotificationReceived` prepend; missing-entry no-ops; unregister test.

**Out of scope:**
- Screens that read these caches (FE-05 to FE-12) and the Critical-incident `aria-live` announcement (layout/notifications specs).
- Group joins (FE-04.03).
- Optimistic mutation logic and 409 handling (incident detail spec).
