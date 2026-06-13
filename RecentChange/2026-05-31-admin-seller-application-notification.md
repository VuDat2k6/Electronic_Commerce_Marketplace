# Admin notification for seller applications

## Van de

Buyer dang ky Become a Seller thi request thanh cong va pending seller xuat hien trong admin dashboard, nhung admin khong nhan notification trong Notification Center.

## Nguyen nhan du kien

- Backend `registerAsSeller` chi update user role/shopStatus.
- Chua co logic tao notification cho admin sau khi co seller application moi.

## Huong sua

- Them helper tao `SYSTEM_ALERT` notification cho tat ca admin khi co seller application moi.
- Notification failure khong duoc lam fail seller registration.
- Bo sung E2E verify admin thay notification sau khi buyer dang ky become seller.

## Kiem thu du kien

- `node --check server/controllers/seller.js`
- `npx eslint e2e/seller-flow-full.spec.ts`
- `npx tsc --noEmit --pretty false`
- `npx playwright test e2e/seller-flow-full.spec.ts --project=chromium --reporter=line --workers=1`

## Da sua

- Them `createAdminSellerApplicationNotifications` trong `server/controllers/seller.js`.
- Sau khi buyer dang ky Become a Seller thanh cong, backend tao `SYSTEM_ALERT` notification cho tat ca admin.
- Notification co title `New seller application`, message gom shop name va seller email, metadata gom `sellerId`, `sellerEmail`, `shopName`, `shopStatus`.
- Loi tao notification duoc catch/log rieng, khong lam fail seller registration.
- Mo rong `e2e/seller-flow-full.spec.ts` de admin verify notification trong Notification Center truoc khi vao Seller Approval.

## Ket qua kiem thu

- `node --check server/controllers/seller.js`: pass.
- `npx eslint e2e/seller-flow-full.spec.ts`: pass.
- `npx tsc --noEmit --pretty false`: pass.
- Restart backend Express va health check `http://localhost:5000/health`: 200.
- `npx playwright test e2e/seller-flow-full.spec.ts --project=chromium --reporter=line --workers=1`: 1/1 pass.
