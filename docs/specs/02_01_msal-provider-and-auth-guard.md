# FE-02.01 · MSAL provider & auth guard
Parent: FE-02 · Auth (docs/FRONTEND-SPECS.md) · Sub-spec 01 of 2

**Context:** Every screen needs a signed-in user before it can call the API. This slice wires MSAL React into
the app and gates the whole tree behind an Entra ID sign-in. It builds on the FE-01 scaffold, where
`src/app/config.ts` already exposes `msalClientId`, `msalAuthority` and `apiScope`. The API client and
`useCurrentUser()` come in FE-02.02.

**Decisions (agreed during planning, refine the parent spec):**

| Topic | Decision |
|---|---|
| Flow | Signed-out users see an IncidentHub sign-in page (design mock `Login.dc.html`); "Sign in with Microsoft" calls `loginRedirect`. No automatic redirect |
| States | Sign in, Signing in, Access denied. Session expired waits for FE-02.02 |
| Loading | Follows the mock: MUI `CircularProgress` (role `progressbar`) + "Signing you in…" |
| Theme | Minimal MUI theme from the design-system tokens in `src/app/theme.ts` (FE-03 extends it) |
| Help links | Help text only; no service-desk link, Privacy/Accessibility footer or env label until configured |
| Errors | MSAL v5 has no `LOGIN_FAILURE`; redirect failures arrive as `ACQUIRE_TOKEN_FAILURE`. `AADSTS50105` / `access_denied` → Access denied; others → inline retry message with trace |

**Requirements:**
- `MsalProvider` wraps the app in `app/providers.tsx`.
  - The `PublicClientApplication` instance is built from `config.msalClientId` and `config.msalAuthority`.
    Env values are read only through `app/config.ts` (`import.meta.env.VITE_*` nowhere else).
  - Tokens are cached by MSAL only. The app never writes auth tokens to `localStorage` itself.
  - The login request uses the API scope `config.apiScope`, so the token later works for `/api/v1`.
- Auth guard:
  - No signed-in account → sign-in page; its button calls `loginRedirect` (`prompt: 'select_account'` from Access denied).
  - Entra refusal (`AADSTS50105` / `access_denied`) → Access denied state with error code and trace id.
  - While MSAL is starting up or handling the redirect response, show a loading state (MUI progress or
    skeleton, not a blank screen). Use theme tokens only.
  - With an account, render the app (children).

**Acceptance Criteria:**
- [ ] Unauthenticated visit to any route shows the sign-in page; "Sign in with Microsoft" redirects to Entra login

**Dependencies:** FE-01, BE-02 (Entra ID JWT auth on the API)

**Files to touch:**
- `src/app/msal.ts` — `PublicClientApplication` instance and the shared login request (`scopes: [config.apiScope]`)
- `src/app/providers.tsx` — `AppProviders` with `MsalProvider` (QueryClient is added in FE-02.02)
- `src/app/AuthGuard.tsx` — redirect when unauthenticated, loading state while resolving
- `src/app/App.tsx`, `src/main.tsx` — wrap the app in `AppProviders` and `AuthGuard`
- `src/app/theme.ts` — design-system tokens as an MUI theme (light + dark via `data-theme`)
- `src/app/signIn/` — `SignInPage.tsx`, `BrandPanel.tsx`, `SignInCard.tsx`, `icons.tsx`
- `index.html` — Google Fonts (Space Grotesk, IBM Plex Sans, IBM Plex Mono)
- `vite.config.ts` — dummy `VITE_*` test env
- `src/app/AuthGuard.test.tsx`, `src/app/msal.test.ts`

**Tests:**
- Vitest + RTL, with `useMsal` mocked to return a stub instance:
  - No account and no interaction in progress → sign-in heading shown, children not rendered; clicking
    "Sign in with Microsoft" calls `loginRedirect` once with `config.apiScope` in `scopes`.
  - `ACQUIRE_TOKEN_FAILURE` with `AADSTS50105` → Access denied alert with code and trace; button uses `prompt: 'select_account'`.
  - Other MSAL error → inline retry message; event callback removed on unmount.
  - `isAccessDenied` narrows MSAL errors correctly.
  - Interaction in progress (startup / redirect handling) → a loading indicator is shown (query by role
    `progressbar`) and children are not rendered.
  - Account present → children are rendered and `loginRedirect` is not called.
- Run `npm run typecheck`, `npm run lint`, `npm run test` before done.

**Out of scope:**
- Session expired state (FE-02.02) and configurable help/privacy links
- Fetch wrapper, Bearer token on requests, 401 silent refresh, `useCurrentUser()` (FE-02.02)
- App shell, sidebar, routes, `ErrorBoundary` (FE-03)
- Role-based route guards, e.g. Admin-only screens (FE-13)
- SignalR `accessTokenFactory` (FE-04)
