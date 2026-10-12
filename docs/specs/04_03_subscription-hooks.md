# FE-04.03 · Subscription hooks and encapsulation guard
Parent: FE-04 · SignalR provider & real-time plumbing (docs/FRONTEND-SPECS.md) · Sub-spec 03 of 3

**Context:** Screens need to join server groups (dashboard, a single incident) but must never touch the connection.
These hooks are the only public real-time API features may use.

**Requirements:**
- `useDashboardSubscription()` in `src/realtime/`: invokes `JoinDashboard` when mounted and the connection is `live`; invokes `LeaveDashboard` on unmount. Re-joins after a reconnect (groups are lost when the connection drops).
- `useWatchIncident(id)`: invokes `WatchIncident(id)` on mount, `UnwatchIncident(id)` on unmount or when `id` changes. Re-watches after a reconnect. Does nothing when `id` is undefined.
- Hook calls made while not connected are skipped safely (no unhandled rejection); errors from `invoke` are caught and logged, not thrown into render.
- Enforce encapsulation: an ESLint `no-restricted-syntax` / `no-restricted-imports` rule (or documented code-review checklist item if a rule is not feasible) so only files under `src/realtime/` use `HubConnection` `.on` / `.invoke` or import `@microsoft/signalr`.
- Export the hooks via `src/realtime/index.ts`; `useSignalRConnection` stays internal.

**Acceptance Criteria:**
- [ ] No component outside `realtime/` calls `connection.on` / `.invoke` directly (lint rule or code-review checklist item).
- [ ] Unmounting a watched incident's detail page sends `UnwatchIncident`.
- [ ] `useDashboardSubscription()` sends `JoinDashboard` on mount and `LeaveDashboard` on unmount.
- [ ] Groups are re-joined after a reconnect.

**Dependencies:** FE-04.01, FE-04.02 (shared provider; handlers are independent of these hooks)

**Files to touch:**
- `src/realtime/useDashboardSubscription.ts` (new)
- `src/realtime/useWatchIncident.ts` (new)
- `src/realtime/index.ts` (new)
- `eslint.config.js` (restriction rule, if feasible)
- Test files alongside each hook
- `docs/implementation/current-status.md`

**Tests:**
- Vitest + RTL with a fake connection supplied through the provider: mount/unmount produce the expected `invoke` calls with the right method names and id.
- Changing `id` unwatches the old id and watches the new one; undefined id is a no-op.
- Not-connected call is skipped; reconnect triggers a re-join.
- Lint check: a fixture or `npm run lint` run proves the rule flags `connection.invoke` outside `realtime/` (if a rule is added).

**Out of scope:**
- Wiring the hooks into screens (dashboard FE-08, incident detail FE-07).
- Event handlers (FE-04.02) and connection lifecycle (FE-04.01).
