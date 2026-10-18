# FE-05.01 · Report form and submit
Parent: FE-05 · Report incident screen (docs/FRONTEND-SPECS.md) · Sub-spec 01 of 4

**Context:** The primary entry point for users reporting a problem. This slice builds the form shell, its validation and the submit flow on the existing `/report` route (`ReportRoute.tsx`, currently a placeholder). Attachments, duplicate hints and draft saving plug into this form in sub-specs 02–04.

**Requirements:**
- `ReportIncidentForm` in `features/report/` using React Hook Form + a Zod schema in `reportIncident.schema.ts`, with fields: application, environment, severity, title, description, steps to reproduce, and `attachmentIds` (form field only; populated by 05.02).
- Schema mirrors the contract limits: `applicationId` required; `environment` and `severity` required; `title` 5–200 chars; `description` required, max 20,000 chars; `stepsToReproduce` optional, max 5,000 chars; `attachmentIds` max 10.
- `useApplications` hook (`GET /applications`, key from `api/keys.ts`) feeds the application select. The API already limits non-Admins to their teams' applications. The environment select offers only the environments of the chosen application and resets when the application changes.
- Severity select/radio with help text per level (Critical, High, Medium, Low); use `SeverityChip` pattern (icon + text + colour) and theme tokens only.
- Description and steps are plain multi-line inputs (the server sanitizes HTML); no rich-text editor in this slice.
- `useReportIncident` mutation: `POST /incidents` with `Idempotency-Key: crypto.randomUUID()`. The key is generated once per submit attempt and reused while that request is in flight; the submit button is disabled while pending so a double-click sends one request. A new key is generated after a failed attempt is edited and resubmitted.
- On `201`: navigate to `/incidents/:number` using the returned `number`.
- Error handling: `422` `ProblemDetails.errors` mapped to field errors with `setError` (camelCase keys match form fields; unmapped keys go to a form-level alert); `409` "Duplicate incident" shows an inline alert linking to `existingIncidentNumber`; `413`/`500` etc. show a toast (with `traceId` on 500).
- Loading → skeleton while applications load; no applications → `EmptyState`; applications fetch error → inline retry.
- `ReportRoute.tsx` renders the form; keep components under ~200 lines (extract field groups).

**Acceptance Criteria:**
- [ ] Submitting twice in quick succession (double-click) results in one incident, not two (same idempotency key reused for the in-flight request)
- [ ] A 422 validation response highlights the correct field(s), not a generic banner only
- [ ] Client-side validation blocks submit and shows field errors for missing/too-short/too-long values before any network call
- [ ] Successful `201` navigates to the new incident's detail page
- [ ] Form is keyboard-operable with labelled controls (WCAG 2.1 AA); severity is never conveyed by colour alone

**Dependencies:** FE-01–FE-04, BE-05, BE-06 (`POST /incidents`, `GET /applications`); `apiRequest` in `src/api/client.ts`. Related ledger items: D-05 (403/409/429/500 handling) is only delivered here for this form's mutation.

**Files to touch:**
- `src/features/report/ReportIncidentForm.tsx` (+ small field-group subcomponents, e.g. `SeverityField.tsx`)
- `src/features/report/reportIncident.schema.ts`
- `src/features/report/useApplications.ts`
- `src/features/report/useReportIncident.ts`
- `src/features/report/ReportRoute.tsx`
- `src/api/keys.ts` (application key factory if missing)
- `src/test/msw/handlers.ts` (`GET /applications`, `POST /incidents`)

**Tests:**
- `reportIncident.schema.test.ts`: limits for title, description, steps, attachmentIds.
- `ReportIncidentForm.test.tsx` (RTL, query by role/label): validation messages; environment options follow the selected application; severity help text per level.
- `useReportIncident.test.tsx` (MSW): sends `Idempotency-Key`; double submit issues one request with one key; `201` navigates to detail.
- 422 response with `errors: { title: [...] }` shows the error on the title field; unmapped key shows the form-level alert.
- 409 duplicate shows the link to `existingIncidentNumber`.

**Out of scope:**
- Attachment upload and `AttachmentDropzone` (05.02).
- `DuplicateHints` (05.03).
- Draft autosave/restore (05.04).
- Rich-text editing; Playwright E2E for the full lifecycle (cross-cutting E2E spec).
