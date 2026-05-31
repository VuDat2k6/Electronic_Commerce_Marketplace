# Checkout voucher application

## Van de

Trang checkout hien tai khong co cho nhap/ap dung voucher, nen seller voucher vua tao khong the duoc buyer su dung trong qua trinh dat hang.

## Huong dieu tra

- Kiem tra UI checkout co state/input voucher hay khong.
- Kiem tra payload tao order co gui `voucherCodes` hay khong.
- Kiem tra backend `order.service` da tinh discount tu voucher chua.
- Kiem tra validation voucher co ton tai API rieng khong.

## Nguyen tac fix

- Giu contract order hien co, su dung `voucherCodes` neu backend da ho tro.
- Khong pha luong COD/checkout hien tai.
- Hien thi discount ro rang trong order summary.
- Neu voucher khong hop le, chan submit va hien loi cu the.

## Root cause

- `app/checkout/page.tsx` khong co UI/state de nhap voucher.
- Payload checkout khong gui `voucherCodes` len `/api/customer-orders/checkout`.
- Backend order service co field `voucherCodes`, nhung logic apply voucher chua enforce seller scope, nen seller voucher co nguy co tinh tren toan bo cart.
- API preview `/api/vouchers/apply` cung tinh percentage tren toan bo order thay vi subtotal cua seller neu voucher gan voi seller.

## Fix da ap dung

- Them UI voucher trong `Order Summary`:
  - nhap ma voucher
  - nut Apply
  - hien voucher da ap dung
  - nut remove voucher
  - hien dong `Voucher discount`
- Checkout payload gui `voucherCodes` khi voucher da apply.
- `PaymentQRCode` va total UI dung tong sau discount.
- Backend preview voucher tinh seller voucher theo subtotal cua seller tuong ung.
- Backend order service validate lai voucher khi tao order:
  - voucher khong ton tai/het han/het luot/sai seller se reject order
  - seller voucher chi giam tren subtotal cua seller do
  - min order cua seller voucher tinh theo eligible seller subtotal
- E2E checkout tao voucher seller that, apply tren checkout, va verify `discountTotal`.

## Kiem thu du kien

- Static checks.
- API smoke neu can.
- E2E checkout voi voucher hop le.

## Kiem thu da chay

- `node --check server/controllers/voucher.js; node --check server/services/order.service.js` passed.
- `npx eslint -- app/checkout/page.tsx e2e/checkout.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- Restart backend va health check `http://localhost:5000/health` passed.
- Frontend health check `http://localhost:3000` passed.
- `npx playwright test e2e/checkout.spec.ts --project=chromium --reporter=line --workers=1` passed.
  - Checkout E2E tao voucher seller that.
  - Buyer apply voucher tren checkout.
  - Order API tra `discountTotal: 100000`.
  - Total order duoc verify bang `subTotal - discountTotal + tax + shipping`.
