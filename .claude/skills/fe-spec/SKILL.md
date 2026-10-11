---
name: fe-spec
description: Break a frontend spec (FE-NN) from docs/FRONTEND-SPECS.md into focused spec files in docs/specs/.
argument-hint: <spec number, e.g. 03 or 3>
disable-model-invocation: true
---

# /fe-spec — write focused spec files for one FE spec

Input: `$ARGUMENTS`

This command **only writes spec files**. Never implement code, install packages or edit anything outside
`docs/specs/`.

## 1. Parse the argument
- Trim the input. It must match `^\d{1,2}$` (e.g. `3`, `03`, `14`).
- Convert to an integer and zero-pad to two digits: `3` and `03` both mean **`03`** → spec `FE-03`.

## 2. Validate against the source
- Read `docs/FRONTEND-SPECS.md` and collect every heading of the form `### FE-NN · <Title>`.
  Always derive the valid IDs from the file; never assume a fixed range.
- The input is **invalid** if it is empty, not numeric, `0`, longer than two digits, or has no matching
  `FE-NN` heading (Phase 3 bullets have no FE id and are not valid).
- If invalid:
  1. Say briefly why (e.g. "`abc` is not a number", "There is no FE-99").
  2. List the valid IDs with their titles (e.g. `01 · Project scaffold`).
  3. Ask the user to reply with a spec number, then **stop and wait**. Do not guess or pick one.
  4. When the user replies, start again at step 1 with that value. Repeat until valid.

## 3. Extract the spec
- Copy the full `FE-NN` section: Context, Requirements, Acceptance Criteria, Dependencies.
- Note the rules that apply to it from the **CROSS-CUTTING** section of `FRONTEND-SPECS.md` (Testing,
  UI/Accessibility, Performance), from `CLAUDE.md`, and from the API contract (endpoints, DTOs, errors,
  SignalR events). Use them to fill in Files to touch, Tests and the details of each requirement.
  Do not invent requirements beyond the parent spec.
- If something in the spec is ambiguous or conflicts with `CLAUDE.md` or the API contract, ask the user
  (AskUserQuestion) instead of deciding.

## 4. Check for existing files
- Glob `docs/specs/NN_*.md`.
- If any exist, list them and ask (AskUserQuestion) whether to:
  - **Overwrite**: delete the existing `NN_*` files and regenerate.
  - **Add sub-specs**: keep them; continue numbering after the highest existing `nn`.
  - **Cancel**: stop without changes.

## 5. Assess breadth and propose a split
A spec is **too broad** when, roughly, it has more than ~5 requirements, contains more than one
independently testable component or hook group, or would be too large for a single reviewable PR.

- Split along natural seams: by component, by hook group, or by layer (data hooks → UI → real-time).
- Every parent requirement and acceptance criterion goes to **exactly one** sub-spec, so nothing is lost
  or duplicated.
- Order sub-specs by dependency (earlier ones do not depend on later ones).
- Show the proposal as a table:

  | nn | file name | requirements covered | acceptance criteria covered |
  |---|---|---|---|

- Ask the user (AskUserQuestion) to **approve**, **edit** (they describe the change; re-propose), or
  **keep as a single file**. If the spec is not broad, propose a single `_01_` file and still confirm.
- **Write nothing until the user approves.**

## 6. Write the files
- Folder: `docs/specs/` (create it if missing).
- File name: `NN_nn_spec-name.md`
  - `NN`: two-digit spec number (`03`)
  - `nn`: two-digit sub-spec number, starting at `01`; an unsplit spec is still `_01_`
  - `spec-name`: kebab-case, lowercase ASCII, words separated by `-`, no `&` or other symbols
    (e.g. `03_01_layout-shell.md`, `01_01_project-scaffold.md`)
- Content template:

```md
# FE-NN.nn · <Title>
Parent: FE-NN · <Parent title> (docs/FRONTEND-SPECS.md) · Sub-spec nn of N

**Context:** <why this slice exists and what it builds on>

**Requirements:**
- <requirement>

**Acceptance Criteria:**
- [ ] <criterion, copied or narrowed from the parent>

**Dependencies:** <FE-xx, BE-xx, and earlier sub-specs such as FE-NN.01>

**Files to touch:**
- <planned paths following the CLAUDE.md folder structure>

**Tests:**
- <Vitest + RTL + MSW, or Playwright, cases that prove each acceptance criterion>

**Out of scope:**
- <what is left for sibling sub-specs or later specs>
```

## 7. Report
List the created file paths with a one-line summary each. Do not start implementing.
