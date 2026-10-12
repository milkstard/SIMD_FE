---
name: spec-quality-gate
description: Orchestrates frontend QA, security review, and senior code review after a specified frontend feature is implemented. Runs QA and security reviews in parallel and invokes code review only when both pass.
---

# Frontend Specification Quality Gate

## Purpose

Act as the quality-gate orchestrator for the React and TypeScript frontend in `SIMD_FE`.

When a specified feature in `docs/specs/` has finished implementation, coordinate the QA and security agents in parallel. Invoke the senior code reviewer only after both initial reviews pass.

This workflow coordinates reviews; it does not replace the responsibilities of individual agents.

## 1. Identify the Completed Specification

Before starting:

1. Read `CLAUDE.md` and relevant project instructions.
2. Inspect the implementation status file, if available.
3. Identify the exact specification in `docs/specs/` that has just been implemented.
4. Review its acceptance criteria and identify the relevant code changes.
5. Confirm that implementation is complete and ready for review.

Do not start the quality gate for an incomplete feature. If the target specification or implementation status is ambiguous, ask the user for clarification.

## 2. Stage One: Run QA and Security in Parallel

Invoke both agents concurrently using the available Claude Code agent-delegation mechanism:

- `.claude/agents/qa-engineer.md`
- `.claude/agents/security-engineer.md`

Provide both agents with:
- The exact specification path.
- Relevant acceptance criteria.
- The implementation scope and changed files.
- Instructions to inspect existing code and tests.
- Instructions to report findings with evidence and file locations.

### QA agent responsibilities

Evaluate existing frontend tests, run relevant tests and checks, investigate failures through root cause analysis, and identify missing test coverage.

The QA agent must not automatically modify code or tests.

### Security agent responsibilities

Review the security of the implemented frontend flows, including authentication, tokens, authorization assumptions, API integration, sensitive data, and other relevant risks.

The security agent must not modify code or configuration.

### Parallel execution rules

- Start both reviews before waiting for either result.
- Wait until both agents have completed before making a gate decision.
- Collect their actual reports and distinguish confirmed findings from potential issues and environmental limitations.
- Do not infer that an agent passed simply because it returned no findings in an incomplete review.

## 3. Stage Two: Evaluate the Gate

Proceed only if **both QA and security reviews pass without actionable findings**.

A review passes only when:
- The required checks have been executed successfully, or any unexecuted checks are demonstrably irrelevant to the specification.
- No unresolved test failures or acceptance-criteria gaps remain.
- No actionable security issues remain in the reviewed scope.
- Neither report contains an unresolved limitation that prevents a reliable pass decision.

If either review identifies an issue:

1. Do not invoke the senior code reviewer.
2. Report the findings and their severity.
3. Include evidence, root cause where applicable, and recommended fixes.
4. Identify what needs to be resolved before the quality gate can continue.
5. Stop and wait for the user or authorized implementation workflow to address the issues.

Do not automatically modify code or tests. Do not repeatedly rerun the workflow in an unbounded loop.

After fixes are made, rerun both QA and security reviews against the updated implementation. Both must pass again before advancing.

## 4. Stage Three: Invoke the Senior Code Reviewer

Only after both QA and security pass, invoke the existing senior code reviewer.

Use `.claude/agents/senior-code-reviewer.md`. If the project instead names the agent `.claude/agents/code-reviewer.md`, use that actual file.

Provide the reviewer with:
- The current specification and acceptance criteria.
- The changed files and implementation scope.
- The QA report and test results.
- The security report and review scope.
- Instructions to inspect the implementation for correctness, readability, maintainability, consistency, and unnecessary complexity.

The reviewer must follow the project's backend/frontend conventions or applicable coding-conventions skill where relevant.

The reviewer must not modify files. It should report evidence-based findings, severity, impact, and recommended fixes.

If the senior reviewer identifies actionable issues, report them and mark the quality gate as requiring follow-up. Do not claim final approval while unresolved issues remain.

## 5. Final Report

Always provide a concise orchestration report.

Include:

- **Specification:** Exact specification path.
- **Implementation status:** Complete or incomplete.
- **QA result:** Pass, Fail, or Incomplete.
- **Security result:** Pass, Fail, or Incomplete.
- **Code review result:** Pass, Fail, Blocked, or Not Run.
- **Blocking findings:** Count and short descriptions.
- **Non-blocking findings:** Count and short descriptions.
- **Next action:** The required fix, verification, or approval step.

Clearly explain why a stage was skipped or blocked.

The overall quality gate passes only when QA and security have passed and the senior code review has no unresolved actionable findings. Never claim approval based solely on successful test execution or an absence of reported issues.

## 6. No-Modification Policy

This skill coordinates review agents; it does not directly edit source code, tests, configuration, or specifications.

Follow the read-only policies of the individual agents. Fixes must be proposed for an authorized implementation step, followed by another review cycle.
