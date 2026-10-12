# FE-04.01 · SignalR provider and connection state
Parent: FE-04 · SignalR provider & real-time plumbing (docs/FRONTEND-SPECS.md) · Sub-spec 01 of 3

**Context:** One real-time connection is shared by every feature. This slice creates it, keeps the shell's connection
state accurate, and provides the offline polling fallback. It builds on `realtime/connectionStore.ts` and
`ConnectionBanner` (FE-03.02), which currently always show `offline` because nothing writes the store yet.

**Requirements:**
- `SignalRProvider` in `src/realtime/SignalRProvider.tsx`, mounted in `app/providers.tsx` inside the auth/query providers. It creates **one** `HubConnection` to `/hubs/incidents` with `withAutomaticReconnect()` and `accessTokenFactory` (MSAL access token via the existing token helper; never `localStorage`). Delivers D-07.
- Start the connection only for a signed-in user; stop it on unmount/sign-out.
- Map connection lifecycle to `setConnectionState`: started → `live`; `onreconnecting` → `reconnecting`; `onreconnected` → `live`; `onclose` or failed start → `offline`.
- `onreconnected` → `queryClient.invalidateQueries()`.
- Expose the connection to sibling `realtime/` code only (internal context + `useSignalRConnection()` hook, not re-exported to features).
- Offline fallback: while state is `offline`, invalidate active queries every 30 s; stop as soon as the state is `live`. No polling while connected.
- Offline banner copy "Refreshing every 30 seconds until the connection returns." (delivers D-15).
- Hub URL and any config read via `app/config.ts` (`import.meta.env.VITE_*`).

**Acceptance Criteria:**
- [ ] `SignalRProvider` creates a single connection with `withAutomaticReconnect()` and an `accessTokenFactory`.
- [ ] Connection banner reflects SignalR state changes within 1s (live / reconnecting / offline).
- [ ] `onreconnected` triggers `queryClient.invalidateQueries()`.
- [ ] While offline, active queries are refreshed every 30 s; no refresh timer runs while `live`.
- [ ] Offline banner shows the 30-second refresh copy.

**Dependencies:** FE-02, FE-03 (FE-03.02 `connectionStore`, `ConnectionBanner`), BE-09 (hub)

**Files to touch:**
- `src/realtime/SignalRProvider.tsx` (new)
- `src/realtime/useSignalRConnection.ts` (new)
- `src/realtime/useOfflinePolling.ts` (new)
- `src/app/providers.tsx` (mount provider)
- `src/app/config.ts` (hub URL if not present)
- `src/shared/ConnectionBanner.tsx` (offline copy)
- `docs/implementation/deferred-items.md`, `completed-items.md`, `current-status.md`

**Tests:**
- Vitest + RTL with a mocked `HubConnection` (fake builder): single connection created; `accessTokenFactory` returns the token; lifecycle callbacks drive `connectionStore` (live / reconnecting / offline); state change is visible in `ConnectionBanner` without delay.
- `onreconnected` calls `invalidateQueries` (spy on the QueryClient).
- Fake timers: offline → invalidation every 30 s; going `live` stops the timer; unmount clears it.
- `ConnectionBanner` offline copy test.

**Out of scope:**
- Event handlers and cache patching (FE-04.02).
- `JoinDashboard` / `WatchIncident` hooks and the "no direct `.on`/`.invoke`" guard (FE-04.03).
- Changing the banner colours (offline stays grey per the design system, approved in FE-03.02).
