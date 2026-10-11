# Current status

Audit log of implementation progress, shared by Claude and the user. Entries are added only for upcoming and future
implementations; nothing is back-filled.

**Rules**
1. Before starting an implementation, add a row (status `In progress`) with the spec, the planned scope and the start date.
2. When the implementation is done, update the same row: status, end date, the checks that were run and any follow-ups
   (new items go to `deferred-items.md`, delivered ones move to `completed-items.md`).
3. Keep one row per implementation. Do not delete rows. Keep this file short (it is loaded every session).

**Status values:** `In progress` · `Blocked` · `Done`

| Spec | Scope | Status | Started | Finished | Checks (typecheck / lint / test / build) | Notes |
|---|---|---|---|---|---|---|
| 03_01 | Router (`createBrowserRouter`), `React.lazy` routes `/`, `/incidents`, `/incidents/:number`, `/report`, `/admin/*` (placeholders), `ErrorBoundary` per route + root, `EmptyState` | Done | 2026-10-11 | 2026-10-11 | ✅ / ✅ / ✅ 37 tests / ✅ | Chunks: Dashboard, IncidentList, IncidentDetail, Report, Admin route modules each ~0.3 KB gzip; main 161 KB gzip (< 250 KB). Retry = same-URL `replace` navigation (`revalidate()` doesn't reset without loaders; approved). Vite 500 kB warning remains for vendor code in main. D-10 completed, D-11 narrowed, D-13 added |
| 03_02 | Nav rail, top bar (Report incident, bell stub, avatar), connection store + `ConnectionBanner`, in-shell 404 | Done | 2026-10-11 | 2026-10-11 | ✅ / ✅ / ✅ 55 tests / ✅ | Main 177 KB gzip (< 250 KB; +16 KB for the shell and MUI icon). Offline banner is grey per the design system, not red as the spec said (approved). Icons: MUI Outlined (design system's icon-set flag still open). Avatar not focusable until a user menu exists. D-11 completed; D-14, D-15 added |
