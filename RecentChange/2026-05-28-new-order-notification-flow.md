# NEW_ORDER notification flow

## Muc tieu

Bo sung va kiem thu notification type `NEW_ORDER` cho luong marketplace, de seller nhan thong bao khi buyer dat don moi.

## Van de hien tai

- Prisma schema da co `NotificationType.NEW_ORDER`.
- Frontend type, filter va notification card chua expose `NEW_ORDER`.
- Backend notification create validator chua chap nhan `NEW_ORDER`.
- Server helper chua co ham tao notification don hang moi cho seller.
- Luong checkout hien moi tao notification cap nhat don hang cho buyer, chua thong bao don moi cho seller.

## Huong sua an toan

- Them `NEW_ORDER` vao shared frontend enum va UI filter.
- Them icon/mau hien thi rieng cho `NEW_ORDER`.
- Cap nhat backend validator de chap nhan `NEW_ORDER`.
- Bo sung server helper tao `NEW_ORDER` cho seller, gom orderId/subOrderId/productCount/total trong metadata.
- Gan helper vao luong tao order sau khi order duoc ghi database thanh cong.
- Khong doi schema, khong doi API contract hien co, khong mo rong quyen doc notification.

## Kiem thu du kien

- TypeScript typecheck.
- ESLint cac file notification/checkout lien quan.
- Node syntax check backend controllers/helpers.
- E2E checkout/seller notification neu co luong test phu hop.
- Kiem tra `NEW_ORDER` hien trong trang Notifications va filter.

## Thay doi da thuc hien

- Them `NotificationType.NEW_ORDER` vao shared frontend type.
- Them metadata vao interface notification de khop voi Prisma `Notification.metadata`.
- Them icon/mau rieng va filter "New Orders" tren trang Notifications.
- Backend `/api/notifications` chap nhan `NEW_ORDER` va ho tro ca `metadata` lan `data` de tuong thich nguoc.
- Them helper `createNewOrderNotification` cho server JS va frontend helper.
- Gan notification `NEW_ORDER` vao luong checkout moi trong `server/services/order.service.ts`.
- Dong bo logic vao `server/services/order.service.js` vi Next runtime dang resolve file `.js` cu trong dev.
- Gan notification `NEW_ORDER` vao luong Express legacy `/api/orders`.
- Cap nhat checkout E2E de buyer dat hang xong seller phai thay notification don moi.

## Ket qua kiem thu

- `node --check server/controllers/notificationController.js`: pass.
- `node --check server/utils/notificationHelpers.js`: pass.
- `node --check server/controllers/customer_orders.js`: pass.
- `node --check server/services/order.service.js`: pass.
- `npx tsc --noEmit --pretty false`: pass.
- `npx eslint "types/notification.ts" "components/NotificationCard.tsx" "app/notifications/page.tsx" "lib/notification-helpers.ts" "server/services/order.service.ts" "e2e/checkout.spec.ts"`: pass.
- `npx playwright test e2e/checkout.spec.ts --project=chromium --reporter=line --workers=1`: pass, 2/2 tests.
- Manual backend API validation: admin POST `/api/notifications` voi `type=NEW_ORDER` tra ve `201`, sau do da xoa notification test.
- `npx playwright test e2e/moderation-notifications.spec.ts --project=chromium --reporter=line --workers=1`: pass, 1/1 test.

## Ghi chu dieu tra

- Lan E2E dau tien checkout tao order thanh cong nhung seller khong thay notification.
- DB khong co notification cho order do.
- Nguyen nhan la runtime Next dang dung `server/services/order.service.js` cu thay vi `.ts`, nen logic moi can duoc dong bo sang file JS.
- Sau khi dong bo va restart frontend, seller nhan duoc `NEW_ORDER` dung theo orderId moi.
