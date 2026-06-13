# Persistent User Cart and Wishlist

## Problem

Cart and wishlist are currently kept in browser `sessionStorage`.

This prevents data leakage between accounts, but it also means:

- Logout clears local cart and wishlist.
- Logging back into the same account does not restore saved items.
- Wishlist UI add/remove does not consistently write to the existing database `Wishlist` table.
- Cart has no database model yet, so it cannot persist by user.

## Root Cause

- The frontend Zustand stores are local-first only.
- `Wishlist` exists in Prisma, but product detail/card wishlist actions only update local state.
- There is no `CartItem` model/API for account-scoped cart persistence.
- `SessionStoreSync` clears local session data on account changes but does not hydrate from database afterwards.

## Fix Plan

- Add a `CartItem` Prisma model linked to `User` and `Product`.
- Add account-scoped Next API routes:
  - `/api/account/cart`
  - `/api/account/wishlist`
- Hydrate cart and wishlist from DB after login.
- Persist cart and wishlist store changes back to DB for authenticated users.
- Keep logout clearing browser-local state only, not deleting saved DB data.
- Verify same-account logout/login restores cart and wishlist, while account switching does not leak data.

## Fix Applied

- Added `CartItem` to `prisma/schema.prisma` and `server/prisma/schema.prisma`.
- Ran `npx prisma db push` to create/sync the cart table.
- Ran `npx prisma generate` after stopping leftover Node processes that locked Prisma engine files.
- Added a Prisma migration SQL file for `CartItem` so other environments can migrate the database from version control.
- Added account APIs:
  - `app/api/account/cart/route.ts`
  - `app/api/account/wishlist/route.ts`
- Added `setCart` to the Zustand cart store.
- Updated `SessionStoreSync` to:
  - hydrate authenticated cart/wishlist from DB;
  - persist authenticated cart/wishlist changes to DB;
  - clear local browser data on account changes without deleting DB data.
- Updated logout behavior so it clears browser-local storage/token only, avoiding accidental DB wipes.
- Added mounted guards to cart/wishlist UI to prevent persisted Zustand hydration mismatches.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npx next build`: passed.
- E2E browser test with Microsoft Edge headless:
  - Login as `buyer@tfdtronic.com`.
  - Add a product to wishlist and cart.
  - Confirm DB has 1 cart item and 1 wishlist item.
  - Logout via header menu.
  - Confirm DB still has the cart/wishlist rows after logout.
  - Login again with the same account.
  - Confirm `/wishlist` restores the product.
  - Confirm `/cart` restores the product.
  - Console errors: none.
  - Hydration errors: 0.
