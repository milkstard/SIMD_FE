---
name: fe-commit-specs
description: Draft a commit message (subject + 1-3 sentence summary) for the implemented frontend spec(s), show it for approval, then commit.
argument-hint: <spec(s), e.g. 03 or 03_01 03_02> (optional)
disable-model-invocation: true
---

# Commit implemented frontend specs

Draft a commit message that summarises the spec(s) implemented in the current changes, show it to the user, and
commit only after they approve.

Arguments: `$ARGUMENTS`

## 1. Identify the specs

- If arguments are given, use those specs (`03` means every `docs/specs/03_*.md`; `03_01` means that file).
- Otherwise, read `docs/implementation/current-status.md` and pick the rows whose work is in the uncommitted
  changes (usually the most recent `Done` rows not yet in `git log`). If unclear, ask the user which specs to cover.
- Read each spec's title and goal, and its `current-status.md` row (scope, notes).

## 2. Inspect the changes

- Run `git status`, `git diff`, `git diff --staged` and list untracked files.
- If nothing has changed, say so and stop.
- Decide which files belong to the commit: the spec's implementation, tests, and its docs/ledger updates.
  Do not include unrelated changes, secrets (`.env*`), or build output (`dist/`). If some changes don't belong to
  the specs, list them and leave them unstaged.
- If any spec row in `current-status.md` is still `In progress`, warn the user before continuing.

## 3. Draft the message

Format:

```
<Subject: imperative, ≤ 72 chars, ends with the spec id, e.g. "(FE-03)" or "(FE-03.01)">

<Body: 1-3 sentences summarising what the spec(s) delivered — features, not file names.
Mention notable deferrals or doc/ledger updates only if they fit in the 3 sentences.>

Co-Authored-By: <the attribution line from the current session's instructions>
```

Rules:
- Subject uses an imperative verb (`Add`, `Implement`, `Fix`) and matches existing `git log` style.
- Body is **1-3 sentences maximum**. No bullet lists.
- Summarise behaviour the user would recognise; don't restate the diff.

## 4. Confirm, then commit

1. Show the user the proposed message and the exact list of files to be committed.
2. Ask for approval. Apply any edits they request and show the result again.
3. Only after approval: stage exactly those files (`git add <paths>`, never `git add -A`), then commit with the
   message via a heredoc. Never use `--no-verify` or `--amend`, and never push.
4. If a pre-commit hook fails, report the output and stop; do not bypass it.
5. Finish with `git log -1 --stat` output summarised in one line (hash + subject).
