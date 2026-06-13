# Revert component structure cleanup

## Reason

The component folder reorganization caused runtime issues during local testing, so the safest action is to undo that structural change and restore the previous import paths.

## Scope

- Move layout, dashboard, and product components back to the root `components/` folder.
- Restore `app/layout.tsx`, `app/(seller)/layout.tsx`, and `components/index.ts` imports/exports.
- Keep unrelated application fixes untouched.
- Verify with TypeScript/build after rollback.

## Rollback applied

- Restored all moved components to their previous root-level `components/` locations.
- Restored `app/layout.tsx` imports to `@/components/Header`, `@/components/Footer`, `@/components/SessionTimeoutWrapper`, and `@/components/ProgressBar`.
- Restored `components/index.ts` exports for `Header` and `Footer`.
- Removed the now-empty `components/layout`, `components/dashboard`, and `components/product` directories.
