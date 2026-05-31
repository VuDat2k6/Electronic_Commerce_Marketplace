# Stock, Price And Review Test Stabilization

## Loi tai hien duoc

### STOCK-01 - Trang product bao sai tinh trang ton kho
- Reproduction: mo Garmin Fenix trong `e2e/review-flow.spec.ts`.
- Du lieu DB: `prod-garmin-fenix.inStock = 89`, `status = PUBLISHED`.
- Actual: UI hien `Availability: Out of stock` nhung nut `Add to cart` van hien va checkout tao order duoc.
- Root cause: `components/StockAvailabillity.tsx` dung dieu kien `inStock === 1`, trong khi CTA dung `Boolean(inStock)`.

### PRICE-01 - Seller form va backend khong thong nhat don vi gia
- Evidence: `e2e/seller.spec.ts` nhap `99.99`; order checkout sau do co `subTotal: 99`.
- Actual: form ghi `Price ($)` va chap nhan decimal, trong khi storefront hien `VND` va database dung `Int`.
- Root cause: form parse float, controller parse int lam mat phan thap phan va khong validate gia VND nguyen duong.

### TEST-REV-01 - Review suite co assertion co the false positive
- Lan chay dau: review flow fail o Buyer 2; DB khong co comment moi du Buyer 1 co order dung product.
- Reproduction scoped form sau do: `POST /api/reviews` tra `201` va luu du lieu thanh cong.
- Root cause test risk: suite khong cho doi response submit va tim text tren toan page, co the match noi dung trong textarea thay vi review article.

### TEST-DATA-01 - E2E de lai product gia khong hop le trong catalog
- Regression checkout tra `subTotal: 99` do test mua product `Test Product ...` cu thay vi listing seed.
- DB co 4 product `PUBLISHED` gia `99`, deu thuoc `gadget.seller@tfdtronic.com`, tao tu test seller truoc khi validation VND duoc sua.
- Root cause: seller E2E tao product nhung khong cleanup; checkout E2E chon card dau tien khong deterministic.
- Sau regression, phat hien them `Test Product 92375` gia VND hop le nhung van
  la listing test legacy dang `PUBLISHED`; can archive cung de khong hien tren
  storefront demo.

## Sua doi du kien
- Hien `In stock` khi `inStock > 0`; an CTA neu `inStock <= 0`.
- Doi seller product form sang gia `VND`, chi gui integer va khong cho gia/stock khong hop le.
- Them validation server-side cho product create/update cua seller de tu choi gia khong phai so nguyen duong va stock khong phai so nguyen khong am.
- Dieu chinh bulk CSV validation cung quy uoc VND integer.
- Harden `e2e/review-flow.spec.ts`: scope review form, cho response `201`, va tim comment trong `article`.
- Seller E2E xoa product test sau assertion; checkout E2E dung listing Garmin seed co gia VND thuc te.
- Archive chi product test cu co title `Test Product`, gia nho hon `100000`, seller gadget va dang `PUBLISHED`; order history van duoc bao toan.

## Rủi ro va regression
- Listing cu trong DB khong bi sua gia tu dong.
- CSV co gia decimal truoc day se bi tu choi thay vi cat phan le im lang.
- Checkout/order hien tai tiep tuc dung Int VND, khong thay doi API response.

## Kiem thu du kien
- ESLint/Node syntax check cho cac file thay doi.
- Re-run `e2e/seller.spec.ts`, `e2e/checkout.spec.ts` va `e2e/review-flow.spec.ts`.
- Manual/API check product co stock lon hon 1 hien `In stock`.

## Ket qua
- Da sua `StockAvailabillity`/purchase controls: ton kho lon hon `0` hien
  `In stock`, het hang an nut mua.
- Da ap dung validation integer VND cho form seller, hai product controller va
  bulk upload; smoke API voi gia decimal tra `400`.
- Da archive cac listing test legacy gia `99` VND va listing `Test Product
  92375` gia `999000` VND con published; order cu duoc giu nguyen. Seller E2E
  gio xoa listing no tao.
- DB check sau cleanup: so listing co title `Test Product` va status
  `PUBLISHED` bang `0`; marketplace E2E assert khong con card test va pass
  tren Chromium/Mobile Chrome.
- `e2e/inventory-display.spec.ts`: pass tren Chromium va Mobile Chrome.
- `e2e/review-flow.spec.ts`: pass voi assertion response `201`/`403` va review
  article that, nam trong vong Chromium tong hop pass ngay 2026-05-25.
