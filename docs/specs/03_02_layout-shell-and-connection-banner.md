# FE-03.02 · Layout shell & connection banner
Parent: FE-03 · App shell & routing (docs/FRONTEND-SPECS.md) · Sub-spec 02 of 2

**Context:** FE-03.01 gives every screen a lazy route under a root layout `<Outlet>`. This slice adds the chrome
around it: the nav rail, the top bar and the connection banner, laid out as the design system describes. The
real SignalR connection arrives in FE-04, so this slice defines the connection-state source that FE-04 will feed,
and the banner reads only from it.

**Decisions (agreed during planning, refine the parent spec):**

| Topic | Decision |
|---|---|
| Layout | Design system wins over the parent's item list. Nav rail sections: **Monitor** (`/`), **Incidents** (`/incidents`), **Admin** (`/admin`). Top bar, in order: flexible space, primary **Report incident** button (`/report`), Live connection indicator, notification bell, user avatar |
| Offline look | Follows the design system's `ConnectionBanner`, not "Offline = red": grey `surface-200` strip, square dot, "Live updates are paused. Reload to see the latest changes." (the 30-second copy waits for the polling fallback, D-15). Reconnecting = orange ring on `sev-high-tint`; Live = mint dot |
| Top bar indicator | Compact state always shows and is the only `role="status"`; the full strip under the top bar adds detail for Reconnecting / Offline |
| Icons | MUI Outlined icons; nav items are text only |
| Wordmark | "IncidentHub" (Plex Sans 600, `nav-ink`) at the top of the nav rail, linking to `/` |
| Avatar | Name from MSAL `name`, then `username`, then a generic "Signed-in user" icon. Not focusable until a user menu exists |
| Unknown URLs | A `*` child route throws a 404, so "Page not found" shows inside the shell |
| Search | The top-bar ⌘K search is **not** built now (new deferred item) |
| Connection state | A small Zustand store `src/realtime/connectionStore.ts` (`'live' \| 'reconnecting' \| 'offline'`, default `'offline'`). FE-03 only reads it; FE-04's `SignalRProvider` writes it from the real connection |
| Avatar | Initials and name from the MSAL active account (`useMsal`), because `useCurrentUser()` is blocked on BE-11 (D-01) |
| Bell | Labelled icon button with no count or menu; FE-09 fills it in |
| Admin nav | Visible to every signed-in user until role checks exist (D-06, D-12 → FE-13) |
| Theme toggle | Not included (D-09 stays deferred, to a later spec) |

**Requirements:**
- Layout (`src/app/layout/AppLayout.tsx`, rendered by the FE-03.01 root layout route around the `<Outlet>`):
  - Nav rail on `nav.ground` (232px wide, `nav-ink` labels). Items are `NavLink`s with `aria-current="page"` on the
    active one and a 3px `focus-on-nav` selected bar; `/incidents/:number` keeps **Incidents** active. Focus ring
    inside the nav uses `focus-on-nav`.
  - Top bar (48px, `surface-000`): **Report incident** as the view's one primary button, the compact Live
    indicator, the notification bell (`IconButton`, `aria-label="Notifications"`), and the user avatar.
  - User avatar: `src/shared/UserAvatar.tsx` shows initials from a display name, with the full name as its
    accessible name/tooltip; the layout passes the MSAL active account's `name`.
  - Content area: max width 1440px. Responsive per the design system: wrapping flex row; on phone the nav stacks on
    top, touch targets at least 44px.
  - Theme tokens only, light and dark mode; every control keyboard-reachable.
- Connection banner: Live (green) / Reconnecting (amber) / Offline (red), sourced from the connection state:
  - `src/realtime/connectionStore.ts` — `ConnectionState` union, `useConnectionState()` selector hook and a
    setter for FE-04. Holds UI state only, no server data.
  - `src/shared/ConnectionBanner.tsx` — props `state` and `compact`. Colours map to tokens: Live =
    `status-operational`, Reconnecting = `sev-high`, Offline = `sev-critical` (each on its `-tint`). Always **icon +
    text + colour**, never colour alone. `role="status"` so changes are announced.
  - Compact Live indicator in the top bar; a full-width strip below the top bar only for Reconnecting / Offline.
  - The banner re-renders directly from the store subscription (no polling or timers), so state changes show
    immediately.

**Acceptance Criteria:**
- [x] Connection banner reflects SignalR state changes within 1s

**Dependencies:** FE-03.01, FE-02 (MSAL account), FE-01. FE-04 will drive the connection store.

**Files to touch:**
- `src/app/layout/AppLayout.tsx`, `src/app/layout/NavRail.tsx`, `src/app/layout/TopBar.tsx`
- `src/app/RootLayout.tsx` — wrap the `<Outlet>` in `AppLayout`
- `src/realtime/connectionStore.ts`
- `src/shared/ConnectionBanner.tsx`, `src/shared/UserAvatar.tsx`
- `src/app/layout/AppLayout.test.tsx`, `src/shared/ConnectionBanner.test.tsx`, `src/shared/UserAvatar.test.tsx`,
  `src/realtime/connectionStore.test.ts`

**Tests:**
- Vitest + RTL (memory router, `useMsal` mocked with an account named e.g. "Ana Reyes"):
  - Nav (role `navigation`) has links Monitor, Incidents, Admin; on `/incidents/INC-1042` the Incidents link has
    `aria-current="page"`.
  - Top bar has a "Report incident" link/button pointing to `/report`, a "Notifications" button and an avatar whose
    accessible name is the account name (initials `AR` visible).
  - All of these are reachable by keyboard (`userEvent.tab`).
- `ConnectionBanner` / layout with fake timers:
  - Default store state shows the Offline strip (role `status`, text "Offline").
  - Setting the store to `'reconnecting'`, then `'live'`, shows the new text within 1000 ms (advance timers ≤ 1000 ms
    and assert); `'live'` hides the full strip and shows the compact Live indicator.
  - Each state renders an icon and text, not colour alone.
- `connectionStore`: default `'offline'`, setter updates `useConnectionState()`.
- Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` before done.

**Out of scope:**
- Router, lazy routes, `ErrorBoundary`, `EmptyState` (FE-03.01)
- Real SignalR connection writing the store, `accessTokenFactory`, handlers (FE-04, D-07)
- ⌘K search in the top bar (new deferred item)
- Notification count, list and mark-as-read (FE-09)
- Avatar from `useCurrentUser()` (D-01, after BE-11)
- Hiding Admin by role (D-06, D-12 → FE-13)
- `aria-live` announcement of new Critical incidents (needs `IncidentCreated` from FE-04; dashboard/real-time specs)
- Colour-scheme toggle (D-09)
