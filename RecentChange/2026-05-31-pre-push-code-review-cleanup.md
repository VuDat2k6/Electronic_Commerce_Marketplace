# Pre-push code review and cleanup

## Goal

Review the repository state before pushing to GitHub, classify source changes versus generated/debug artifacts, and clean only safe non-source files.

## Scope

- Inspect git status, ignore rules, package scripts, and test/build entry points.
- Preserve existing source changes, E2E tests, documentation, seed data, and user-provided files.
- Remove local screenshots, temporary repro scripts, Playwright reports/results, and other generated artifacts that should not be committed.
- Update `.gitignore` so the same generated files do not come back in future runs.

## Safety rules

- Do not revert user changes.
- Do not delete the uploaded UI zip file unless explicitly requested.
- Do not delete source, routes, components, tests, seed files, or docs.
- Verify cleanup paths are inside the workspace before recursive removal.

## Verification plan

- Re-check `git status --short`.
- Run TypeScript/build checks that are practical for the current repo state.
- Summarize remaining files that should be reviewed before commit.

## Cleanup applied

- Added focused ignore rules for Playwright output, local test evidence, root screenshots, and temporary repro scripts.
- Removed generated folders: `playwright-report/`, `test-results/`, and `test-evidence/`.
- Removed root-level debug screenshots, temporary repro scripts, stale build output, and the manual bulk upload HTML test page.
- Kept source changes, E2E specs, public product/template assets, `RecentChange`, `TESTING_CHECKLIST.md`, and the user-provided zip file.

## Test cleanup

- Updated the auth E2E smoke test to match the current account menu contract: buyer order access is `My orders`, not a duplicate `Order history` item.
- Removed ad hoc root screenshot/debug logging from the auth E2E test so test output stays inside Playwright's ignored output directories.
