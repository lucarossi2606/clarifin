# Clarifin Project Guidance

## Project identity

- Clarifin is a mobile-first market-intelligence application for retail investors.
- The core product flow is: Event -> Evidence -> Economic channel -> Direct impact -> Indirect impact -> Exposures -> Missing data -> Counterarguments.
- Write the product name as `clarifin` in every user-facing string. Never use `Clarifin`, `CLARIFIN`, or another capitalization in UI copy.
- Do not rename technical identifiers, existing storage keys, or filenames solely to apply the user-facing `clarifin` capitalization rule.
- Before any substantial Clarifin task, read `docs/event_intelligence_current_status.md`.
- Use only the repository containing this `AGENTS.md`.
- Never use `C:\Users\luca2\OneDrive\Dokumente\clarifin`.
- Do not duplicate changing project status inside `AGENTS.md`. The status document remains the source of truth for current progress.

## Preflight

- Start every task with `git status --short`.
- Record the starting state.
- Identify the permitted file scope before editing.
- If staged, untracked, deleted, or unexpectedly modified files exist, stop and report them.
- Never overwrite or discard existing user changes.
- Never use destructive Git commands.
- Confirm the repository root when path ambiguity exists.

## Approval boundaries

Without explicit user authorization, never:

- commit
- push
- deploy
- create a pull request
- perform DB writes
- modify Supabase schemas or production data
- invoke OpenAI, remote evals, or paid APIs
- enable a new external data source
- install or add dependencies
- expose, read, or modify secrets
- modify production entrypoints
- change storage formats
- perform broad refactors outside the approved scope

## Clarifin product quality

- Preserve concrete facts, values, units, timestamps, and provenance.
- Clearly distinguish fixtures, test data, and live data.
- Never present fixture data as current or official live information.
- Do not expose debug, timeout, connector, GDELT, or system-error text in user-facing content.
- Preserve the distinction between Direct, Indirect, Rejected, and Referenced.
- Do not add weak or unsupported assets merely to fill a list.
- For macro events, verify rate, yield, duration, dollar, growth, and broad-equity channels when relevant.
- Insider sales are not automatically bearish. Preserve transaction type and context, including open-market purchases, sales, options, RSUs, grants, and planned sales.
- Treat X and social media as signal sources, not standalone sources of truth.
- Do not permit publication when evidence, materiality, review status, or source quality is insufficient.
- Preserve backward compatibility unless a breaking change is explicitly approved.

## Autonomous verified-change loop

For an approved task with clear acceptance criteria:

1. Read `AGENTS.md` and the current status document.
2. Run the preflight.
3. Inspect only relevant files.
4. State the intended scope and smallest viable plan.
5. Implement only the approved change.
6. Run targeted tests and syntax checks.
7. Run broader regression tests in proportion to risk.
8. Run `git diff --check`.
9. Inspect the complete diff.
10. Delegate a read-only diff review to a reviewer subagent.
11. Receive the reviewer findings in the main task.
12. Verify each finding against the actual diff.
13. Fix only concrete P0, P1, and relevant P2 problems caused by the current diff.
14. Repeat tests and read-only review.
15. Allow at most three review/fix iterations.
16. Produce the final report.
17. Stop before commit, push, or deploy unless the user explicitly authorizes that action.

## Reviewer subagent rules

- The reviewer subagent is read-only.
- It must not modify, stage, commit, push, or deploy.
- Give it the actual diff, task scope, and acceptance criteria.
- It reports only concrete problems caused by the current diff.
- It must not turn general feature ideas or pre-existing issues into findings.
- The main agent verifies findings before changing code.
- Never allow multiple agents to edit the same files concurrently.
- Use subagents only for independent analysis, testing, or read-only review.

## Mandatory stop conditions

Stop and ask the user when any of these occurs:

- product semantics are ambiguous
- Direct versus Indirect classification requires a product decision
- a new data, storage, identity, or schema contract is required
- a stable identifier is missing
- a breaking change appears necessary
- the requested scope must materially expand
- a new API, connector, or data source is required
- a dependency is required
- a DB migration or DB write is required
- a production deploy is required
- secrets or credentials are required
- acceptance criteria conflict
- the same relevant finding remains after three loops
- an unexpected file is modified
- the working tree differs from the expected preflight

## Verification

Choose the relevant existing tests from `package.json` and the nearby eval/test files.

Always finish implementation work with:

- targeted tests
- relevant regression tests
- syntax checks
- `git diff --check`
- `git diff --name-status`
- `git status --short`
- full diff inspection
- read-only reviewer result

Do not claim browser, external-source, or live-data verification unless it actually occurred.

## Final report

Always report:

- starting Git status and commit
- files changed
- implementation summary
- tests and exact pass counts
- reviewer iterations and findings
- unresolved limitations
- external/OpenAI/Supabase activity
- DB-write status
- deploy status
- commit and push status
- `git diff --check`
- final `git status --short`

## Documentation

- Update `docs/event_intelligence_current_status.md` when a material project phase, contract, or verified capability changes.
- Do not rewrite unrelated historical sections.
- Do not mark a feature complete without evidence.
- Do not modify `AGENTS.md` itself unless the user explicitly asks to update the project guidance.
