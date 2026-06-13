# Order, notification, dashboard, and settings fixes

## Van de can xu ly

- Buyer dat hang thanh cong nhung khong thay notification dat hang; hien moi co notification cho seller.
- Seller dashboard/order flow sau khi co order moi chua hien san pham/du lieu don hang dung nhu mong doi.
- Buyer "My orders" va "Order history" co dau hieu trung lap hoac tro ve cung mot trang khong ro rang.
- Admin dashboard co so lieu ao/hardcoded, khong phan anh du lieu that.
- Admin Platform Settings dang bi 404.

## Huong dieu tra

- Audit checkout service moi `app/api/customer-orders/checkout` va `server/services/order.service.*`.
- Audit seller dashboard API va seller orders page/API.
- Audit buyer account menu/header va trang account orders.
- Audit admin dashboard data source.
- Audit dashboard sidebar route settings.

## Nguyen tac sua

- Khong doi schema neu khong can.
- Giu API contract hien co neu co the.
- Uu tien du lieu that tu database thay cho hardcoded dashboard metrics.
- Them notification buyer sau khi order tao thanh cong, khong lam fail checkout neu notification fail.
- Platform settings neu chua co backend setting storage thi tao UI page an toan voi trang thai ro rang, khong fake save thanh cong.

## Kiem thu du kien

- TypeScript.
- ESLint cac file lien quan.
- E2E checkout notification.
- Seller dashboard/order regression.
- Admin route `/admin/settings` khong 404.

## Da sua

- Them buyer `ORDER_UPDATE` notification sau khi checkout tao order thanh cong trong `server/services/order.service.ts` va `server/services/order.service.js`.
- Seller `GET /api/seller/orders` doc ca order flow moi `SubOrder/SubOrderProduct` va legacy `order_item`, tra ve product snapshot de dashboard/orders hien dung san pham vua dat.
- Seller status update chap nhan order item legacy va sub-order product moi, cap nhat buyer notification khi seller doi trang thai.
- Trang `/seller/orders` render product snapshot, order id, gia, customer, ngay dat hang va status moi tu API.
- Trang checkout them `hasPlacedOrder` de tranh race `clearCart()` day nguoi dung ve `/cart`; sau khi dat hang thanh cong chuyen ve `/account/orders`.
- Header account menu bo trung lap buyer `My orders`/`Order history`; seller/admin van co link purchases rieng neu can.
- Them API `/api/admin/dashboard` lay so lieu that tu database: users, sellers, products, orders, revenue, recent orders, top products.
- Rebuild admin overview de dung API that thay cho mang hardcoded/fake.
- Them page `/admin/settings` de sidebar Platform Settings khong con 404.
- Mo rong E2E checkout de verify buyer notification, seller notification, seller orders hien product vua dat.
- Mo rong E2E admin de verify dashboard API va `/admin/settings`.

## Ket qua kiem thu

- `node --check server/controllers/seller.js`: pass.
- `node --check server/services/order.service.js`: pass.
- `npx eslint app/(seller)/seller/orders/page.tsx app/(dashboard)/admin/page.tsx app/(dashboard)/admin/settings/page.tsx app/api/admin/dashboard/route.ts components/Header.tsx app/checkout/page.tsx e2e/checkout.spec.ts e2e/admin.spec.ts`: pass.
- `npx tsc --noEmit --pretty false`: pass.
- `npx playwright test e2e/checkout.spec.ts --project=chromium --reporter=line --workers=1`: 2/2 pass.
- `npx playwright test e2e/admin.spec.ts --project=chromium --reporter=line --workers=1`: 5/5 pass.
- `npx playwright test e2e/seller-flow-full.spec.ts --project=chromium --reporter=line --workers=1`: 1/1 pass.

## Ghi chu van hanh

- Backend Express phai restart sau khi sua `server/controllers/seller.js`; da restart backend va health check `http://localhost:5000/health` tra ve 200.
