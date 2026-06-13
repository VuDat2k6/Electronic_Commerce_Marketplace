# Wishlist, cart, category, and order cancellation fixes

## Goal

Fix four marketplace regressions found during manual testing:

- Product detail page is missing an add-to-wishlist action.
- Cart remains from the previous account after logout and logging in as another user.
- Shop by category navigation does not filter products by selected category.
- Buyers need the ability to cancel an order within 12 hours after placing it.

## Investigation plan

- Inspect product detail UI, wishlist store, and product card wishlist behavior.
- Inspect cart Zustand persistence, logout/login flows, and session ownership behavior.
- Inspect shop route params, category slugs, product fetch logic, and backend filtering.
- Inspect account orders page/API, order status fields, and backend order status update safety.

## Safety

- Keep existing API contracts where possible.
- Do not alter database schema unless unavoidable.
- Preserve seller/admin order oversight behavior.
- Avoid clearing cart unexpectedly for the same active user.

## Applied changes

- Added an `Add to wishlist` / `Saved to wishlist` action on the product detail dynamic section.
- Fixed the product detail wishlist state subscription so the button rerenders immediately after add/remove.
- Added a session owner guard for cart and wishlist persisted state so account changes clear stale sessionStorage data.
- Cleared cart, wishlist, and backend token cache during logout.
- Fixed backend product filter parsing for keys like `filters[category][$equals]`.
- Changed category navigation to `/shop?category=...` to avoid route collision with `/shop/[merchantId]`.
- Added redirects for legacy `/shop/<category>` URLs so old category links still land on the filtered marketplace.
- Preserved the `category` query when applying or resetting marketplace filters.
- Added buyer order cancellation API: `PATCH /api/account/orders/[orderId]/cancel`.
- Added 12-hour cancellation validation, sub-order status guard, payment cancel update, stock restoration, voucher usage restoration, and buyer/seller notifications.
- Blocked automatic cancellation for `COMPLETED` payments because refund handling is not automated yet.
- Added cancel button to the buyer order page when the order is still eligible.

## Verification

- `npx tsc --noEmit --pretty false` passed.
- `npx next build` passed.
- `git diff --check` passed with only existing CRLF normalization warnings.
- Backend product API returned only `Smartphones` for `filters[category][$equals]=Smartphones`.
- Browser smoke test confirmed `/shop?category=smartphones` renders smartphone product titles.
- Browser smoke test confirmed product detail shows a wishlist button.
- Focused UI test confirmed guest wishlist redirects to login callback and buyer wishlist changes to `Saved to wishlist`.
- Browser smoke test confirmed legacy anonymous persisted cart/wishlist data is cleared and owner is set to `guest`.
- Focused UI test confirmed logout/login as a second buyer does not inherit the first buyer's cart.
- Focused UI test confirmed homepage category click lands on `/shop?category=smartphones`, renders category products, and preserves category after Apply.
- Focused UI test confirmed buyer can cancel a fresh order from `/account/orders`, with DB order/sub-order/payment state and stock restoration verified.
- Integration smoke test created a test order, cancelled it, verified parent/sub-order/payment statuses and stock restoration, then cleaned up the test order.

## Notes

- `npm run build` starts with `prisma generate`; it can fail on Windows while the backend is running because Prisma's query engine DLL is locked. `npx next build` was used for the Next build check after `tsc` passed.
