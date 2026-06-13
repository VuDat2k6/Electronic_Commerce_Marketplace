# Session Store Sync Runtime Crash Fix

## Problem

The app can show a Next.js runtime overlay at `app/layout.tsx` on the `<SessionStoreSync />` line:

`Cannot read properties of undefined (reading 'call')`

This appeared after adding the client-side cart/wishlist session synchronization component.

## Investigation Direction

- Verify the root layout client/server component boundary.
- Check `SessionStoreSync` and Zustand persisted stores.
- Run TypeScript checks and browser reproduction.
- Clear stale Next development cache if webpack runtime state is inconsistent.

## Fix Plan

- Keep cart/wishlist account switching protection.
- Reduce the chance of root layout crashing from the sync component.
- Restart the app from a clean Next cache.
- Verify the homepage renders without the runtime overlay.

## Fix Applied

- Updated `components/SessionStoreSync.tsx` so it no longer imports persisted Zustand stores at module top-level.
- The component now loads cart and wishlist stores inside `useEffect`, after the client session status is known.
- Removed stale `.next` development cache and restarted the frontend/backend.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npx next build`: passed.
- Browser smoke test with Microsoft Edge headless:
  - `/`: status 200, no runtime overlay.
  - `/login`: status 200, no runtime overlay.
  - `/register`: status 200, no runtime overlay.
- API smoke test:
  - `/api/products`: status 200.
