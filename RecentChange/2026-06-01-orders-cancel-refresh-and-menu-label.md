# Orders Cancel Refresh and Menu Label

## Problem

- Buyer order rows may still appear without any cancellation action if the browser/dev bundle is stale.
- Account menu uses inconsistent wording:
  - buyer sees `My orders`;
  - seller/admin account menu shows buyer purchases as `My purchases`.

## Fix Plan

- Standardize account menu wording to `My orders`.
- Add the same buyer orders link to the mobile menu for seller/admin users.
- Restart frontend from a clean cache and verify with `anna.buyer@tfdtronic.com`.

## Fix Applied

- Updated `components/Header.tsx`:
  - desktop seller/admin buyer-orders link now says `My orders` instead of `My purchases`;
  - mobile seller/admin menu also includes a `My orders` link.
- Restarted frontend from a clean `.next` cache.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- Browser test with Microsoft Edge headless:
  - Logged in as `anna.buyer@tfdtronic.com`.
  - Opened `/account/orders`.
  - New order `1f447aad-8e7f-4507-9432-1de52ef83058` shows `Cancel order`.
  - Older non-cancellable orders still show `Cancel unavailable`.
  - Console/page errors: none.
