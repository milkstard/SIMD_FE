# Deferred items

Ledger of work that the specs in `docs/specs/` push to a later phase.

**Rules**
1. Before planning an implementation, read the relevant spec **and** this file.
2. While planning, add every newly found item that the spec explicitly schedules for a future phase.
3. Never defer anything mandatory for the spec being implemented. If it can't be built yet, list it under **Blocked** with
   its blocker and unblock steps.
4. When an implementation delivers an item here, remove it from this file and add it to
   `docs/implementation/completed-items.md`. IDs are never reused.

## Blocked (mandatory for the source spec, waiting on a dependency)

| ID | Item | Source | Blocker | Unblock steps |
|---|---|---|---|---|
| D-01 | `useCurrentUser()` in `src/shared/hooks/useCurrentUser.ts`, using `meKeys.current()` (already in `src/api/keys.ts`) | 02_02 | BE-11 (`GET /me` + `CurrentUser` in swagger) | Run `npm run gen:api`, use the generated type (no hand-written DTO), then build the hook |
| D-02 | `GET /api/v1/me` MSW handler in `src/test/msw/handlers.ts` | 02_02 | BE-11 | Add together with D-01 |
| D-03 | `useCurrentUser.test.tsx` (resolves with `roles: ['Responder']`, cache entry under `meKeys.current()`) | 02_02 | BE-11 | Add together with D-01. It completes the 02.02 AC "After login, `useCurrentUser()` resolves with roles matching the signed-in account's groups" |
| D-16 | Real-time handler bodies for `CommentAdded` and `NotificationReceived` (the other four are delivered in 04_02) | 04_02 | Backend swagger lacks `CommentAddedEvent`, `NotificationDto` and the `/me/notifications` endpoints, so there is no generated payload type or cache shape | Backend adds them to `contracts/swagger.json`, run `npm run gen:api`, then fill the two no-op bodies in `src/realtime/handlers.ts` (comments: append to `incidentKeys.comments`, dedupe by `comment.id`, bump `commentCount`; notifications: prepend to `notificationKeys` lists) per the 04_02 spec. Backend hub group methods (`JoinDashboard`, `WatchIncident`, ...) now exist; 04_03 joins can be checked end to end |

## Scheduled for a future phase

| ID | Item | Source | Target |
|---|---|---|---|
| D-04 | Configurable sign-in help and privacy links (service desk link, Privacy / Accessibility footer, environment label) | 02_01 out of scope | Later spec (config-driven links) |
| D-05 | UI behaviour for 403 / 409 / 429 / 500 (toasts, optimistic rollback, `Retry-After`) | 02_02 out of scope | The feature specs that use `apiRequest` |
| D-06 | `useCan` role checks | 02_02 out of scope | Later feature specs (needs D-01) |
| D-08 | Saved-draft sentence in the Session expired note ("Your unsent report draft is still saved on this device.") | 02_02 decision (generic copy chosen) | Report form spec (draft saving) |
| D-09 | Colour-scheme toggle (the theme follows the system setting for now) | 02_01 plan | Later spec (kept deferred in 03_01; Zustand UI state) |
| D-12 | Role-based route guards (e.g. Admin-only screens) | 02_01 out of scope | FE-13 |
| D-13 | Not-found page for unknown URLs and `404` API responses (until then the root `ErrorBoundary` shows "Page not found") | 03_01 out of scope | Later feature spec |
| D-14 | ⌘K search / command palette in the top bar | 03_02 decision | Later spec |
