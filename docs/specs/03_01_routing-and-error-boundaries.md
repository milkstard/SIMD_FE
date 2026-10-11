# FE-03.01 · Routing & error boundaries
Parent: FE-03 · App shell & routing (docs/FRONTEND-SPECS.md) · Sub-spec 01 of 2

**Context:** Every feature screen needs a URL to plug into. Today `src/app/App.tsx` renders a single heading inside
`AuthGuard` (FE-02). This slice adds the React Router 6 router with one lazy chunk per top-level route, a route-level
`ErrorBoundary` so one broken screen never blanks the app, and the shared `EmptyState` that later screens use. The
layout chrome (nav rail, top bar, connection banner) comes in FE-03.02 and mounts around the router `<Outlet>`.

**Decisions (agreed during planning, refine the parent spec):**

| Topic | Decision |
|---|---|
| Nav labels | Follows the design system: `/` is the **Monitor** (dashboard) screen; `/report` is reached from the top-bar "Report incident" button (FE-03.02), not a nav item |
| Route screens | Placeholder screens only (heading + `EmptyState`). Real screens arrive in FE-05 to FE-08 and FE-13 |
| Retry | Same-URL `replace` navigation resets the route's boundary (`revalidate()` doesn't without loaders); a failed chunk download does a full reload |
| Root boundary | `ErrorBoundary` is also the root `errorElement`: unknown URLs show "Page not found" until D-13 |
| Admin access | `/admin/*` is reachable by every signed-in user until role guards exist (D-06, D-12 → FE-13) |

**Requirements:**
- Lazy routes: `/`, `/incidents`, `/incidents/:number`, `/report`, `/admin/*`.
  - Data router (`createBrowserRouter` + `RouterProvider`) built in `src/app/router.tsx`, rendered inside
    `AuthGuard`, so routes only load for a signed-in account.
  - Each top-level route uses React Router `lazy` (or `React.lazy`) with a **default-exported** route module in its
    feature folder (`features/dashboard`, `features/incidents`, `features/report`, `features/admin`), so each one is
    its own chunk. `/incidents` and `/incidents/:number` may share the incidents chunk.
  - A root layout route renders an `<Outlet>`; FE-03.02 fills it with the shell. While a chunk loads, show a
    skeleton (MUI `Skeleton`, theme tokens), not a blank screen or spinner.
  - Placeholder screens show an `h1` with the screen name and an `EmptyState` saying the screen is coming soon.
    `/incidents/:number` shows the incident number from the URL.
- `ErrorBoundary` per route:
  - `src/shared/ErrorBoundary.tsx`, a function component used as each top-level route's `errorElement`
    (`useRouteError`), so a throw inside one route's tree is caught **below** the root layout and the rest of the
    app (shell, other routes) keeps working.
  - Shows a friendly error message (MUI `Alert`), plus the `traceId` when the error is an `ApiError` from
    `api/client.ts`, and an inline **Retry** button that re-renders or revalidates the route.
  - Theme tokens only; keyboard-reachable; the message is announced (`role="alert"`).
- Shared `EmptyState` component:
  - `src/shared/EmptyState.tsx`: props `title`, optional `description`, optional `action` (a node, for example a
    button). Uses theme tokens and design-system typography, and works in light and dark mode.

**Acceptance Criteria:**
- [x] Each top-level route loads as a separate chunk (verified in the build output)
- [x] An error thrown inside one route's tree doesn't blank the whole app — only that route's boundary catches it

**Dependencies:** FE-02 (`AuthGuard`, `AppProviders`, `ApiError`), FE-01

**Files to touch:**
- `src/app/router.tsx` — route table with lazy route modules and per-route `errorElement`
- `src/app/RootLayout.tsx` — root layout route (`<Outlet>` + `Suspense` skeleton); FE-03.02 adds the shell
- `src/app/App.tsx` — render `RouterProvider`; `src/app/App.test.tsx` updated
- `src/features/dashboard/DashboardRoute.tsx`, `src/features/incidents/IncidentListRoute.tsx`,
  `src/features/incidents/IncidentDetailRoute.tsx`, `src/features/report/ReportRoute.tsx`,
  `src/features/admin/AdminRoute.tsx` — default-exported placeholder route modules
- `src/shared/ErrorBoundary.tsx`, `src/shared/EmptyState.tsx`
- `src/app/router.test.tsx`, `src/shared/ErrorBoundary.test.tsx`, `src/shared/EmptyState.test.tsx`

**Tests:**
- Vitest + RTL with `createMemoryRouter` using the same route objects:
  - Each path (`/`, `/incidents`, `/incidents/INC-1042`, `/report`, `/admin/teams`) renders its placeholder
    heading (query by role `heading`); the detail screen shows `INC-1042`.
  - A route whose element throws renders the `ErrorBoundary` alert (role `alert`) while the root layout content
    stays rendered; navigating to another route still works.
  - The boundary shows the `traceId` for an `ApiError`, and clicking **Retry** (role `button`) re-renders the route
    (a component that throws once then succeeds shows its content).
  - `EmptyState` renders title, description and action, queried by role/text.
- Chunk check: run `npm run build` and confirm the output lists a separate JS chunk per route module; record the
  result in `current-status.md`. A unit test can also assert every top-level route defines `lazy`.
- Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` before done.

**Out of scope:**
- Nav rail, top bar, avatar, bell, connection banner (FE-03.02)
- Real screen content (FE-05 report, FE-06 list, FE-07 detail, FE-08 dashboard, FE-13 admin)
- Role-based route guards for `/admin/*` (D-12 → FE-13)
- Not-found page for unknown URLs and `404` API responses (later feature specs)
- Colour-scheme toggle (D-09, kept deferred)
