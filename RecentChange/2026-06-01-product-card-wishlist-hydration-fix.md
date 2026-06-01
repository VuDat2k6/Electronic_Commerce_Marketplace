# Product Card Wishlist Hydration Fix

## Problem

The homepage can show a React hydration warning in `components/ProductItem.tsx`.

Server-rendered product cards initially render the wishlist button as "Add to wishlist", while the client can immediately read persisted wishlist state and render "Remove from wishlist".

## Root Cause

- `ProductItem` is a client component but still participates in SSR.
- The server cannot read Zustand persisted wishlist data from browser storage.
- The client can read the hydrated wishlist store.
- `aria-label`, icon classes, and button opacity differ between server HTML and client hydration.

## Fix Plan

- Keep product cards server/client markup stable during initial hydration.
- Only apply the real wishlist state after the component is mounted on the client.
- Preserve existing wishlist behavior after hydration.
- Verify the homepage renders without hydration warnings.

## Fix Applied

- Updated `components/ProductItem.tsx` so `isWishlisted` is treated as `false` until the component has mounted on the client.
- After mount, the component reads the real Zustand wishlist state and updates the heart button normally.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- First `npx next build` failed because the running dev server was holding a stale `.next` cache.
- Stopped the frontend dev server, removed `.next`, reran `npx next build`: passed.
- Restarted frontend dev server.
- Browser test with Microsoft Edge headless:
  - Preloaded `wishlist-storage` before visiting `/`.
  - Loaded homepage.
  - Hydration warnings: none.
  - Console/page errors: none.
