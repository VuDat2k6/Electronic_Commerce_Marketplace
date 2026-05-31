# Seller suspension and bulk upload recheck

## Van de

User test thuc te thay admin suspend seller nhung seller van co the hoat dong ban hang binh thuong. Dong thoi bulk upload hoac file `bulk-upload-example.csv` co dau hieu loi.

## Huong dieu tra

- Reproduce luong admin suspend seller bang endpoint/UI thuc te.
- Kiem tra admin API co cap nhat dung `User.shopStatus` hay khong.
- Kiem tra middleware seller, product APIs, voucher APIs, public marketplace va checkout co enforce `shopStatus = ACTIVE` dong bo khong.
- Kiem tra bulk upload UI, route, controller, parser, template CSV va example CSV.
- Fix root cause, khong patch theo trieu chung.

## Kiem thu du kien

- Static checks.
- API smoke suspend seller -> seller API bi 403.
- Public product cua seller suspended bi an.
- Checkout san pham cua seller suspended bi reject.
- Bulk upload voi CSV example/template pass hoac loi validation ro rang.

## Root cause da xac nhan

### Seller suspension

- Admin suspend da cap nhat `User.shopStatus = SUSPENDED`.
- Cac API seller moi da dung `requireActiveSeller`, nen stale token khong bypass duoc.
- Tuy nhien legacy shop page `/shop/{merchantId}` dung `getMerchantShop()` tu `server/services/order.service.ts`.
- `getMerchantShop()` chi doc bang `Merchant` legacy va lay products theo `sellerId`, khong check `User.shopStatus`.
- Admin suspend khong sync `Merchant.status`, nen legacy merchant van `ACTIVE`; ket qua la `/shop/{sellerId}` van hien san pham.

### Bulk upload

- UI download link tro toi `/template.csv` nhung file nay khong ton tai trong `public`.
- `bulk-upload-example.csv` dung slug de trung voi data da co, gay Prisma `P2002`.
- Khi ghi loi Prisma dai vao `bulk_upload_item.error`, cot `error` bi vuot gioi han va gay `P2000`, lam ca upload fail 500 thay vi batch PARTIAL/FAILED.
- CSV guide noi `categoryName`, trong khi parser chi doc `categoryId`, gay nham lan.

## Fix da ap dung

- `server/controllers/adminSellers.js`
  - Khi approve/suspend seller, dong bo bang `Merchant` legacy bang upsert.
  - `Merchant.status` bay gio di theo `User.shopStatus`.
- `server/services/order.service.ts` va `.js`
  - `getMerchantShop()` check `User.role = seller` va `User.shopStatus = ACTIVE`.
  - Suspended shop tra empty/unavailable thay vi hien san pham.
  - Chi lay products `PUBLISHED`.
- `server/services/bulkUploadService.js`
  - Rut gon error message truoc khi luu vao `bulk_upload_item.error`.
  - Map duplicate slug thanh loi ngan gon, khong gay 500.
  - CSV co the dung `categoryId`, `categoryName`, hoac `category`.
  - Category lookup doc danh sach category va match theo id/name lowercase.
- `app/(seller)/seller/bulk-upload/page.tsx`
  - Doi link download ve `/bulk-upload-example.csv`.
  - Sua guide dung header thuc te va giai thich `categoryId` chap nhan ID/name.
- CSV files
  - Cap nhat `bulk-upload-example.csv` va `product-template-ready.csv`.
  - Them `public/bulk-upload-example.csv` va `public/product-template-blank.csv`.
- Tests
  - Cap nhat `e2e/seller-suspension.spec.ts` de verify `/shop/{sellerId}` khong con hien product sau suspend.
  - Them `e2e/bulk-upload.spec.ts` upload CSV thanh cong va verify row loi khong lam crash batch.

## Kiem thu da chay

- `node --check server/controllers/adminSellers.js; node --check server/services/order.service.js; node --check server/services/bulkUploadService.js` passed.
- `npx eslint -- "app/(seller)/seller/bulk-upload/page.tsx" e2e/seller-suspension.spec.ts e2e/bulk-upload.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- API smoke suspend:
  - `PATCH /api/admin/sellers/seller-gadget-pro/suspend` -> 200.
  - `GET /api/seller/products` voi stale seller token -> 403.
  - `GET /api/slugs/{sellerProduct}` -> 404.
  - `/shop/seller-gadget-pro` khong con product.
  - DB `User.shopStatus = SUSPENDED` va `Merchant.status = SUSPENDED`.
  - Approve cleanup dua ca hai ve `ACTIVE`.
- API smoke bulk upload:
  - Upload `bulk-upload-example.csv` -> 201 COMPLETED, 5 products created.
  - Cleanup batch voi `deleteProducts=true` -> 200, 5 products deleted.
- `npx playwright test e2e/seller-suspension.spec.ts --project=chromium --reporter=line --workers=1` passed.
- `npx playwright test e2e/bulk-upload.spec.ts --project=chromium --reporter=line --workers=1` passed.
