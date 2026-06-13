# Seller voucher creation fix

## Van de

Seller tao voucher tren dashboard bi loi `error while saving`.

## Huong dieu tra

- Audit UI tao voucher va payload gui len backend.
- Audit route/controller `/api/seller/vouchers`.
- Reproduce bang API de lay status/body that.
- Fix root cause nhung giu API contract va RBAC.

## Root cause da xac nhan

- UI gui `sellerId` cua user hien tai len `/api/seller/vouchers`.
- Backend luu `sellerId` nay vao `Voucher.merchantId`.
- Theo Prisma schema, `Voucher.merchantId` la foreign key den bang `Merchant` legacy, khong phai bang `User`.
- Seed hien tai tao seller trong bang `User` nhung khong tao ban ghi `Merchant` tuong ung, nen create voucher bi Prisma `P2003 Foreign key constraint failed`.
- UI chi doc `err.message`, trong khi error handler backend tra `{ error: "Foreign key constraint failed" }`, nen nguoi dung chi thay fallback `Error while saving`.
- Sau khi fix foreign key va restart backend, phat hien loi tiep theo: `getSellerVouchers` order theo `createdAt` nhung model `Voucher` khong co cot `createdAt`, lam list voucher fail sau khi create.

## Fix du kien

- Dong bo seller ACTIVE sang `Merchant` legacy truoc khi tao voucher seller.
- Giu API contract hien tai: seller voucher van gan theo `merchantId = seller user id`.
- Chuan hoa/validate payload tao va sua voucher de tra loi ro rang hon.
- UI doc duoc `error`, `message`, `details` tu backend.
- Sua quick action `Create Voucher` trong seller dashboard ve dung route hien co.
- Doi sort danh sach voucher sang cot co that trong schema.

## Fix da ap dung

- `server/controllers/sellerVoucher.js`
  - Them `ensureSellerMerchant()` de upsert ban ghi `Merchant` legacy tu seller ACTIVE truoc khi tao voucher.
  - Dung `AppError` voi HTTP status ro rang cho validation, duplicate code, seller khong hop le, permission.
  - Chuan hoa voucher code thanh uppercase va validate numeric fields.
  - Doi list sort tu `createdAt` sang `startsAt`.
- `app/(seller)/seller/vouchers/page.tsx`
  - Doc thong bao loi tu `message`, `error`, hoac `details` thay vi chi doc `message`.
- `app/(seller)/seller/dashboard/page.tsx`
  - Doi quick action `Create Voucher` tu `/seller/vouchers/new` ve `/seller/vouchers`.
- `e2e/seller-voucher.spec.ts`
  - Them E2E tao voucher bang UI, confirm list, va cleanup qua API.

## Kiem thu du kien

- Static checks.
- API create voucher voi seller ACTIVE.
- E2E/UI flow neu can.

## Kiem thu da chay

- `node --check server/controllers/sellerVoucher.js` passed.
- `npx eslint -- "app/(seller)/seller/vouchers/page.tsx" "app/(seller)/seller/dashboard/page.tsx" e2e/seller-voucher.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- API smoke: POST `/api/seller/vouchers` -> 201, GET list -> 200 va tim thay voucher, DELETE -> 204.
- `npx playwright test e2e/seller-voucher.spec.ts --project=chromium --reporter=line --workers=1` passed.
