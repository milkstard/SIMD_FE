# FE-05.02 · Attachment dropzone
Parent: FE-05 · Report incident screen (docs/FRONTEND-SPECS.md) · Sub-spec 02 of 4

**Context:** Users attach screenshots and logs to a report. Files are uploaded before the incident is submitted and linked through `attachmentIds`. Builds on the form from FE-05.01.

**Requirements:**
- `AttachmentDropzone` in `features/report/`: drag-and-drop plus a keyboard-accessible "Choose files" button.
- Client-side checks before any network call: max 25 MB per file; allowed types per the contract: `.png`, `.jpg`/`.jpeg`, `.gif`, `.webp`, `.txt`, `.log`, `.json` (extension and content type must agree; SVG and PDF rejected). Max 10 files per report. Rejected files show an inline error naming the file and the reason; they are never uploaded.
- Accepted files upload immediately via `POST /attachments` (`multipart/form-data`, one part named `file`) through a `useUploadAttachment` hook; one request per file, with per-file pending/progress and error states and a remove action.
- Each uploaded file shows its `scanStatus` as icon + text + colour (`Pending`, `Clean`, `Infected`). `Infected` and failed uploads cannot be submitted: they are excluded from `attachmentIds` and flagged to the user. `Pending` files may be submitted (the contract allows linking them).
- Server errors: `413` and `422` on `file` shown as a per-file error; other errors as per-file retry.
- Uploaded ids feed the form's `attachmentIds` field (added to RHF state; removing a file removes its id). Removing a file only drops it from the form; the server deletes unlinked uploads after 24 h.
- Display file size and name; dates via the shared pattern if shown.

**Acceptance Criteria:**
- [ ] Oversized/disallowed file is rejected client-side before any network call
- [ ] Uploaded files show their scan status with icon + text + colour
- [ ] Submitted `attachmentIds` contain only successfully uploaded, non-infected files
- [ ] Dropzone is fully operable by keyboard and announces errors to assistive tech

**Dependencies:** FE-05.01, BE-08 (`POST /attachments`).

**Files to touch:**
- `src/features/report/AttachmentDropzone.tsx` (+ `AttachmentRow.tsx` for the per-file row)
- `src/features/report/attachmentRules.ts` (size/type validation)
- `src/features/report/useUploadAttachment.ts`
- `src/features/report/ReportIncidentForm.tsx` (mount the dropzone, bind `attachmentIds`)
- `src/test/msw/handlers.ts` (`POST /attachments`)

**Tests:**
- `attachmentRules.test.ts`: oversize, wrong extension, extension/content-type mismatch, SVG/PDF, eleventh file.
- `AttachmentDropzone.test.tsx`: rejected file triggers no request (MSW handler not called); valid file uploads and shows `Pending`; `Infected` status shown and excluded; remove drops the id.
- Form integration test: submit body contains the ids of accepted files only.
- Upload `413`/`422` shows a per-file error.

**Out of scope:**
- Polling or live refresh of scan status after upload (not required by the parent spec).
- Downloading attachments (incident detail, FE-07).
- Attachments on comments.
