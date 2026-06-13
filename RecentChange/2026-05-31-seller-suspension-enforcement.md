# Seller suspension enforcement fix

## Van de

Admin suspend mot seller nhung seller do van co the hoat dong ban hang nhu binh thuong.

## Rui ro

- RBAC/authorization khong enforce trang thai `shopStatus` tren seller actions.
- Session/JWT cua seller co the stale, van mang `shopStatus=ACTIVE` sau khi admin suspend.
- Product cua seller suspended co the van hien tren marketplace va van checkout duoc.

## Huong dieu tra

- Audit admin seller suspend endpoint.
- Audit auth middleware `requireActiveSeller` va token payload.
- Audit seller dashboard/product/order/voucher routes.
- Audit product listing/detail/search/checkout co loc seller suspended hay khong.
- Audit Next seller layout co doc DB hay chi doc session.

## Nguyen tac sua

- Backend phai la source of truth, khong tin shopStatus trong JWT cho suspend enforcement.
- Seller suspended khong duoc truy cap seller tools/actions.
- Product cua seller suspended khong duoc hien nhu hang dang ban va khong duoc checkout.
- Khong xoa order history/snapshot.
- Neu can archive product khi suspend thi lam theo cach an toan va idempotent.

## Kiem thu du kien

- Static checks.
- E2E admin suspend seller, seller bi chan dashboard/actions.
- Verify suspended seller product khong checkout duoc.

## Root cause

- `requireActiveSeller` dang tin `shopStatus` trong JWT/backend token. Neu seller da login truoc khi admin suspend, token cu van co `shopStatus=ACTIVE`.
- Public marketplace query chi loc `Product.status=PUBLISHED`, chua loc seller `shopStatus=ACTIVE`.
- Checkout service chi validate product status/stock, chua validate seller shop status.

## Da sua

- `server/middleware/auth.js`: `requireActiveSeller` doc DB moi request va chi cho seller tiep tuc neu `role=seller` va `shopStatus=ACTIVE`; token cu khong con bypass duoc suspend.
- `app/api/backend-token/route.ts`: backend token lay role/shopStatus moi nhat tu DB, khong lay stale session token.
- `server/controllers/products.js`, `server/controllers/search.js`, `server/controllers/slugs.js`: public product listing/search/detail chi tra product cua seller ACTIVE.
- `server/services/order.service.ts` va `server/services/order.service.js`: checkout flow moi reject product cua seller khong ACTIVE va stock decrement cung check seller ACTIVE.
- `server/controllers/customer_orders.js`: legacy order flow cung reject product cua seller khong ACTIVE.
- Them `e2e/seller-suspension.spec.ts`: seller login truoc khi suspend, admin suspend, seller token cu bi 403, public product detail 404, buyer checkout product cua seller suspended bi reject, sau do approve lai seller de cleanup.

## Ket qua kiem thu

- `node --check server/middleware/auth.js; node --check server/controllers/products.js; node --check server/controllers/search.js; node --check server/controllers/slugs.js; node --check server/controllers/customer_orders.js; node --check server/services/order.service.js`: pass.
- `npx eslint app/api/backend-token/route.ts e2e/seller-suspension.spec.ts`: pass.
- `npx tsc --noEmit --pretty false`: pass.
- Restart backend Express va health check `http://localhost:5000/health`: 200.
- `npx playwright test e2e/seller-suspension.spec.ts --project=chromium --reporter=line --workers=1`: 1/1 pass.
- `npx playwright test e2e/checkout.spec.ts --project=chromium --reporter=line --workers=1`: 2/2 pass sau khi dev server warm.
