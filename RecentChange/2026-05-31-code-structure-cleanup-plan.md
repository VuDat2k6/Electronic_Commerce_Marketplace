# Code structure cleanup plan

## Goal

Prepare the project for a cleaner GitHub push by organizing code without breaking Next.js routing, backend API contracts, auth/session behavior, or E2E coverage.

## Constraints

- The repository currently has many functional changes waiting to be committed, so broad file moves can make review harder.
- Next.js `app/` routes are file-system routes and should not be moved casually.
- Backend route/controller/service boundaries should remain stable unless there is a direct bug or duplication to remove.
- Keep each cleanup pass buildable and easy to review.

## Proposed phased cleanup

1. **Safe root cleanup**
   - Keep source, docs, tests, and public templates.
   - Remove or ignore generated artifacts.
   - Move future utility/debug scripts into a dedicated scripts/test helper location instead of root.

2. **Frontend component organization**
   - Keep generic primitives in `components/ui`.
   - Keep shared layout components in `components/layout`.
   - Group marketplace components under `components/marketplace`.
   - Group product detail components under `components/product`.
   - Group dashboard-specific components under `components/dashboard`.

3. **App route cleanup**
   - Keep route files in `app/`.
   - Extract large route UI blocks into colocated or domain components rather than moving route folders.

4. **Backend cleanup**
   - Preserve `routes -> controllers -> services`.
   - Avoid mixing new logic into controllers when a service exists.
   - Keep JS/TS conversion as a separate future task because the backend currently mixes both.

5. **Verification**
   - Run `npx tsc --noEmit --pretty false`.
   - Run `npm run build`.
   - Run targeted Playwright smoke after any import-moving pass.

## Cleanup pass 1

- Moved global layout shell components into `components/layout/`:
  - `Header`
  - `Footer`
  - `ProgressBar`
  - `SessionTimeoutWrapper`
- Updated `app/layout.tsx` imports to use the new layout component paths.
- Kept barrel exports in `components/index.ts` compatible for callers importing from `@/components`.
