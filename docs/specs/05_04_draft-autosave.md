# FE-05.04 · Draft autosave
Parent: FE-05 · Report incident screen (docs/FRONTEND-SPECS.md) · Sub-spec 04 of 4

**Context:** A refresh or crash must not lose a half-written report. The draft is saved on this device per user and cleared when the report is submitted. Builds on the form from FE-05.01 and the attachment/hint features from 05.02–05.03.

**Requirements:**
- Deliver `useCurrentUser()` first (ledger items D-01, D-02, D-03): `src/shared/hooks/useCurrentUser.ts` using `meKeys.current()` and the generated `CurrentUserDto` (`GET /me` is now in `src/api/generated`), plus the `GET /me` MSW handler and `useCurrentUser.test.tsx`. Move D-01–D-03 to `completed-items.md` when done.
- `useReportDraft` hook in `features/report/`: key `incidenthub:report-draft:<userId>` with `userId` from `useCurrentUser().id`; nothing is read or written until the user is known.
- Autosave form values (debounced, e.g. 500 ms) to `localStorage`; restore on mount via RHF `reset`. Saved: application, environment, severity, title, description, steps to reproduce. Not saved: files themselves; uploaded `attachmentIds` are not restored because unlinked uploads may expire or belong to a stale session (restore shows no attachments).
- Validate restored data with the form's Zod schema (partial); discard a corrupt or outdated draft instead of crashing. Wrap all storage access in try/catch (storage may be blocked or full) and let the form work without it.
- Clear the draft on successful submit (`201`), not on a failed one. Provide a "Discard draft" action with confirmation (MUI dialog).
- When a draft is restored, show a dismissible notice ("Draft restored").
- Deliver deferred item D-08: the saved-draft sentence in the Session expired note ("Your unsent report draft is still saved on this device.") — shown only when a draft exists for the user.
- Only the draft is stored locally; never tokens or server data other than the user's own typed input.

**Acceptance Criteria:**
- [ ] Refreshing mid-fill restores the draft from `localStorage`
- [ ] A successful submit clears the draft; a failed submit keeps it
- [ ] Drafts are per user: a second user on the same browser does not see the first user's draft
- [ ] Corrupt or blocked storage does not break the form
- [ ] `useCurrentUser()` resolves with roles matching the signed-in account (completes the 02.02 AC)

**Dependencies:** FE-05.01 (required), 05.02 and 05.03 (draft covers the same form); BE-11 (`GET /me`, now in swagger); FE-02.

**Files to touch:**
- `src/shared/hooks/useCurrentUser.ts`, `src/shared/hooks/useCurrentUser.test.tsx`
- `src/features/report/useReportDraft.ts`
- `src/features/report/ReportIncidentForm.tsx` (wire restore/clear, notice, discard)
- Session-expired note component under `src/app/` (D-08 sentence)
- `src/test/msw/handlers.ts` (`GET /me`)
- `docs/implementation/deferred-items.md`, `completed-items.md` (D-01, D-02, D-03, D-08)

**Tests:**
- `useCurrentUser.test.tsx`: resolves with `roles: ['Responder']`; cache entry under `meKeys.current()`.
- `useReportDraft.test.tsx`: debounced save; restore on remount; per-user keys; corrupt JSON discarded; storage that throws is tolerated.
- Form integration: fill → unmount → remount restores values; successful submit clears the draft; failed (422) submit keeps it; discard clears it after confirmation.
- Session-expired note shows the draft sentence only when a draft exists.

**Out of scope:**
- Syncing drafts across devices or tabs.
- Restoring uploaded attachments.
- Multiple concurrent drafts per user.
- Role-based `useCan` checks (D-06).
