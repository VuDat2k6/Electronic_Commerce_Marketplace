# Testing Execution Round 01

## Pham vi

- Chay theo `TESTING_CHECKLIST.md` tren local frontend
  `http://localhost:3000` va backend `http://localhost:5000`.
- Kiem tra auth/header, storefront/product/filter, checkout/order, seller,
  admin moderation, review, notification/RBAC va production build.
- Sua cac loi duoc tai hien, sau do chay lai regression tren Chromium va Mobile
  Chrome.

## Loi da phat hien va xu ly

| Issue | Severity | Root cause | Xu ly / Trang thai |
|---|---:|---|---|
| AUTH-LOGIN-01 | P0 | Submit form truoc hydration gui `email/password` qua URL query | Disable login controls den khi interactive; browser regression pass |
| AUTH-HEADER-01 | P1 | Header/menu control nhan click truoc hydration; test cu di vao route `/account` khong ton tai | Khoa control pre-hydration, dung `/account/orders`; auth desktop/mobile pass |
| NOTIFY-01 | P1 | Notification hook lookup email bang raw fetch khong bearer token, backend tra `401` | Dung `session.user.id` va `apiClient`; warning/RBAC E2E pass |
| STOCK-01 | P1 | Stock chi duoc coi in-stock khi bang `1` | Dung `inStock > 0`, an CTA het hang; responsive test pass |
| PRICE-01 | P1 | Seller nhap decimal, controller cat ve `Int` trong storefront VND | Validate integer VND o UI/backend/bulk; fractional API tra `400` |
| CHECKOUT-01 | P0 | Checkout nhan `customerId`, shipping va tax tu client | Bat buoc session, tinh tong tren server; unauth `401`, order total pass |
| ORDER-01 | P1 | Runtime/type service va order history khong khop Prisma/subOrders | Dong bo service/UI props; typecheck va order history pass |
| MARKET-HYDRATION-01 | P1 | Filter/CTA/card co the mat click dau tien truoc hydration | Disable den khi interactive; search/card/filter regressions pass |
| ADMIN-MOD-01 | P1 | Can xac minh admin moderation thay vi seller CRUD | Admin delete bi `403`, warning toi seller va mailbox isolation pass |
| RATE-01 | P1 | General limiter `100/15 min` va seller namespace bi upload limiter | Baseline configurable default `1000`, skip OPTIONS, bo mount seller sai; khong con 429/404 gia |
| IMAGE-01 | P2 | DB Garmin con placeholder cu du asset local dung | Reconcile rieng `mainImage`; browser assert image load pass |
| BUILD-01 | P1 | JSX apostrophe chua escape trong admin seller details chan build | Escape text, on dinh hook dependency; production build pass |

## Ket qua xac minh

| Gate | Lenh / Flow | Ket qua |
|---|---|---|
| Startup | `GET /`, `GET /health` sau restart | PASS, deu `200` |
| Type/lint | `npx tsc --noEmit --pretty false`; ESLint cac file sua | PASS |
| API pricing | Seller/generic product fractional VND va bulk validation | PASS, reject `400` |
| Auth header | `e2e/auth.spec.ts`, Chromium + Mobile Chrome | PASS, `2 passed` |
| Storefront CTA | `e2e/marketplace.spec.ts`, Chromium + Mobile Chrome | PASS, `4 passed` |
| Mobile storefront | marketplace, filters, inventory, checkout, Mobile Chrome | PASS, `6 passed, 1 skipped` |
| Chromium linked regression | auth, marketplace, inventory, checkout, admin, seller, reviews, filters, moderation notifications | PASS, `16 passed, 1 skipped` |
| Checkout security | Guest POST checkout; authenticated QR/order history/total | PASS, guest `401`; order `201`, total `29,439,500` VND |
| Moderation/RBAC | Admin warning -> seller notification; buyer cross-mailbox access | PASS, buyer API `403`; notification cleanup done |
| Build | `npm run build`; `npx next build` voi backend dang hoat dong | PASS |

## Du lieu test va van hanh

- Da archive cac listing E2E gia `99` VND tao truoc khi co validation va mot
  listing `Test Product 92375` legacy con published; khong xoa order history.
- DB check sau archive: `0` product title `Test Product` con `PUBLISHED`;
  marketplace responsive regression assert catalog khong hien listing test.
- Da cap nhat hep anh chinh Garmin sang local sellable asset; khong reseed.
- Checkout/review tests tao order/review hop le va lam giam stock nhu hanh vi
  nghiep vu thong thuong.
- Khi sua code trong luc dev server dang chay, Next da mot lan gap stale chunk;
  xoa generated `.next` va restart frontend sach da xu ly runtime test.

## Ton dong khong chan

- Build con warning ve mot so `<img>` cu tai seller reviews, CategoryMenu va
  SimpleSlider; can chuyen sang `next/image` trong dot toi uu hieu nang rieng.
- `components/modules/cart/index.tsx` con warning dependency `useMemo`; khong
  lam build fail nhung nen don dep sau khi khoa behavior gio hang.

## Trang thai

- Frontend dang chay tai `http://localhost:3000`.
- Backend health dang chay tai `http://localhost:5000/health`.
