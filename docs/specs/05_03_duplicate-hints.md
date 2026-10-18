# FE-05.03 · Duplicate hints
Parent: FE-05 · Report incident screen (docs/FRONTEND-SPECS.md) · Sub-spec 03 of 4

**Context:** While typing a title, users see open incidents that may be the same problem, reducing duplicate reports. Builds on the form from FE-05.01.

**Requirements:**
- `DuplicateHints` in `features/report/`, shown inline under the title field.
- `useSimilarIncidents(applicationId, title)` hook: `GET /incidents/similar?applicationId=&title=` with a key from `api/keys.ts`; the title is debounced 400 ms before the request; the query is disabled until an application is selected and the debounced title has at least 3 characters (the API returns `[]` below 3).
- Show up to 5 open matches: incident number, title, status (`StatusBadge`), and a link to `/incidents/:number` that opens in a new tab so the draft is not lost.
- States: loading → small skeleton; no matches → render nothing; error → quiet inline message with retry (never blocks submit).
- Hints are advisory only; they never prevent submitting.
- The list is announced politely (`aria-live="polite"`) when matches appear.
- Uses theme tokens only; works in light and dark mode.

**Acceptance Criteria:**
- [ ] Typing in the title triggers at most one `/incidents/similar` request per 400 ms pause
- [ ] Up to 5 open matches are shown inline with number, title and status
- [ ] No request is made without an application or with a title under 3 characters
- [ ] A failing hints request does not block submitting the report

**Dependencies:** FE-05.01; BE-06 (`GET /incidents/similar`). `StatusBadge` from `shared/` (create it there if still missing).

**Files to touch:**
- `src/features/report/DuplicateHints.tsx`
- `src/features/report/useSimilarIncidents.ts` (+ a small `useDebouncedValue` in `src/shared/hooks/` if none exists)
- `src/api/keys.ts` (similar-incidents key)
- `src/features/report/ReportIncidentForm.tsx` (mount under title)
- `src/test/msw/handlers.ts` (`GET /incidents/similar`)

**Tests:**
- `useSimilarIncidents.test.tsx` with fake timers: rapid typing yields one request after 400 ms; disabled without application or with short title.
- `DuplicateHints.test.tsx`: renders 5 matches with links; renders nothing for `[]`; shows retry on error.
- Form integration: submit still works while the hints request fails.

**Out of scope:**
- Auto-selecting or merging into a suggested duplicate.
- Highlighting matched text.
- Closing incidents as duplicates (incident detail, FE-07).
