# FE-02.02 · API client & current user
Parent: FE-02 · Auth (docs/FRONTEND-SPECS.md) · Sub-spec 02 of 2

**Context:** With MSAL in place (FE-02.01), every API call needs a bearer token and must survive token expiry
mid-session. This slice adds the single fetch wrapper all feature hooks will use, and `useCurrentUser()` so
later features can read the signed-in user's roles and teams.

> **Blocked on BE-11 for `useCurrentUser()`:** `GET /api/v1/me` and the `CurrentUser` schema are not yet in
> `../SIMD_BE/contracts/swagger.json` or `src/api/generated/`. Once BE-11 ships, run `npm run gen:api` and use
> the generated type. Do **not** hand-write a `CurrentUser` interface. The fetch wrapper part can be built
> before BE-11.

**Decisions:**

| Topic | Decision |
|---|---|
| BE-11 | Build the client, keys, `QueryClientProvider` and MSW now. `useCurrentUser` and its test are **deferred** until `/me` is in swagger (`npm run gen:api`); AC1 stays open |
| Session expired | Included (mock `Login.dc.html`). `InteractionRequiredAuthError` from the silent token call sets `expired` in a small Zustand store (`src/app/sessionStore.ts`); `AuthGuard` then shows the sign-in page in the expired state |
| Expired copy | Generic: "Your session ended. Sign in again to carry on." The saved-draft sentence is added when the report form ships |

**Requirements:**
- `api/client.ts` — fetch wrapper used by every hook (components never call `fetch`):
  - Base URL from `config.apiBaseUrl` (`app/config.ts`).
  - Attaches `Authorization: Bearer <token>`, token from MSAL `acquireTokenSilent` with `config.apiScope`
    and the active account (instance from `app/msal.ts`).
  - On `401`: run a silent token refresh (`forceRefresh: true`), then retry the original request **once**.
    If the retry also fails, surface the error to the caller (no loop, no third request).
  - Non-2xx responses with `application/problem+json` are parsed into a typed error (HTTP `status` plus the
    `ProblemDetails` body, including `errors` and `traceId`), using the generated `ProblemDetails` type, so
    callers can react to the error.
- `useCurrentUser()` — calls `GET /api/v1/me` through `api/client.ts`, cached via TanStack Query:
  - Query key from a factory in `api/keys.ts` (e.g. `meKeys.current()`), never an inline array.
  - Returns the generated `CurrentUser` type (`id`, `displayName`, `email`, `roles: Role[]`, `teamIds`).
  - Server data stays in TanStack Query only (not copied to Zustand or `useState`).
  - `QueryClientProvider` is added to `app/providers.tsx` (inside `MsalProvider`).

- Session expired: when the silent refresh needs interaction, the sign-in page shows a note, heading "Sign in again" and the
  "Sign in with Microsoft" button (`signIn/SignInCard.tsx`, `signIn/icons.tsx`, `app/AuthGuard.tsx`).

**Acceptance Criteria:**
- [ ] After login, `useCurrentUser()` resolves with roles matching the signed-in account's groups
- [x] A silent refresh that needs interaction shows the Session expired sign-in page
- [x] A `401` mid-session triggers a silent refresh and retries the original request once before surfacing an error

**Dependencies:** FE-02.01, FE-01, BE-02, BE-11 (`/me`)

**Files to touch:**
- `src/api/client.ts` — fetch wrapper, token attach, 401 refresh + single retry, ProblemDetails error type
- `src/api/keys.ts` — query key factories, starting with `meKeys`
- `src/shared/hooks/useCurrentUser.ts` — in `shared/` because many features need it and there is no auth feature folder
- `src/app/providers.tsx` — add `QueryClientProvider`
- `src/api/generated/` — regenerated only via `npm run gen:api` after BE-11 (never edited by hand)
- `src/app/sessionStore.ts`, `src/app/queryClient.ts`, `src/app/AuthGuard.tsx`, `src/app/signIn/` — Session expired + query defaults
- `src/test/msw/handlers.ts`, `src/test/msw/server.ts` — MSW handlers (incl. `GET /api/v1/me`)
- `src/test/setup.ts` — start/reset/close the MSW server
- `src/api/client.test.ts`, `src/shared/hooks/useCurrentUser.test.tsx`

**Tests:**
- Vitest + MSW, MSAL `acquireTokenSilent` mocked:
  - Every request carries `Authorization: Bearer <token>` and goes to `config.apiBaseUrl`.
  - `401` then `200` → `acquireTokenSilent` called again with `forceRefresh: true`, exactly 2 requests
    reach the server, the caller gets the `200` data.
  - `401` twice → the caller gets a typed error with `status: 401`, and no third request is sent.
  - `422` / `500` `application/problem+json` → typed error exposing `status`, `errors` and `traceId`.
- Vitest + RTL (`renderHook` with a `QueryClientProvider`) + MSW:
  - `useCurrentUser()` resolves with the `/me` payload, e.g. `roles: ['Responder']`, and its cache entry is
    stored under `meKeys.current()`.
- Run `npm run typecheck`, `npm run lint`, `npm run test` before done.

**Out of scope:**
- MSAL provider and auth guard (FE-02.01)
- UI behaviour for 403 / 409 / 429 / 500 (toasts, rollback, Retry-After) — owned by the feature specs that use them
- `useCan` role checks (later feature specs)
- SignalR `accessTokenFactory` (FE-04)
