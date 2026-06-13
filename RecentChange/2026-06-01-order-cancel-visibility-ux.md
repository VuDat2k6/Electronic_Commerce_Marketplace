# Order Cancel Visibility UX

## Problem

The buyer order page only shows the "Cancel order" button when an order is cancellable.

If the order is outside the 12-hour window or blocked by status, the page shows no cancellation control or reason, so it looks like the feature is missing.

## Fix Plan

- Keep the existing cancellation business rules.
- Add a clear cancellation reason helper.
- Show the active cancel button when available.
- Show a disabled "Cancel unavailable" state with a reason when cancellation is not allowed.
- Surface the 12-hour policy in the expanded order details.

## Fix Applied

- Updated `app/account/orders/page.tsx`.
- Added `getCancelUnavailableReason(order)`.
- Order cards now show:
  - `Cancel order` when cancellation is available.
  - `Cancel unavailable` when cancellation is blocked.
- Expanded order details now show either the cancellation deadline or the reason cancellation is unavailable.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- Browser test with Microsoft Edge headless:
  - Logged in as `buyer@tfdtronic.com`.
  - Opened `/account/orders`.
  - Existing older orders show `Cancel unavailable`.
  - Console/page errors: none.
