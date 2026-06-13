# Voucher Limit Text and Product Card Heart Position

## Problem

- Checkout voucher validation only shows the minimum order value when validation fails, so vouchers with a maximum discount cap do not clearly show their max limit.
- Product card wishlist hearts are positioned at the top-right, which can overlap the sale discount badge.

## Fix Plan

- Add clearer voucher validation text for maximum discount caps.
- Keep minimum order wording but format all VND values consistently.
- Move product card wishlist heart to the top-left.
- Keep discount badge on the top-right.
- Avoid overlap with HOT/NEW badges by moving those badges below the heart.

## Fix Applied

- Updated `components/ProductItem.tsx`:
  - wishlist heart now uses `left-3 top-3`;
  - discount badge remains `right-3 top-3`;
  - HOT/NEW badges move to `left-3 top-14` to avoid overlapping the heart.
- Updated `server/controllers/voucher.js`:
  - failed voucher validation now includes `Maximum discount: ... VND` when `maxDiscount` is configured.
- Updated `app/checkout/page.tsx`:
  - multiple voucher validation messages are separated with periods instead of a comma-only string.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- `node --check server/controllers/voucher.js`: passed.
- Stopped frontend/backend, removed stale `.next`, and ran `npx next build`: passed.
- Restarted frontend/backend:
  - `/`: status 200.
  - `/api/products`: status 200.
- Voucher API check for `SUMMER2` returns:
  - `This voucher has reached its usage limit`
  - `Maximum discount: 100.000.000 VND`
- Browser check with Microsoft Edge headless:
  - product card wishlist heart is positioned on the left side;
  - no console errors.
