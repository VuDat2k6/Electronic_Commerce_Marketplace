# Notification E2E coverage expansion

## Muc tieu

Bo sung E2E test toan dien hon cho notification flow cua buyer, seller va admin sau khi them `NEW_ORDER`.

## Pham vi du kien

- Kiem tra backend chap nhan day du cac notification type hop le.
- Kiem tra UI Notifications co filter/search va hien thi dung notification type.
- Kiem tra seller nhan `NEW_ORDER`.
- Kiem tra buyer/seller chi xem duoc mailbox cua chinh minh.
- Kiem tra mark as read va delete notification tren UI/API.
- Don dep notification test de khong lam ban database sau khi test.

## Nguyen tac

- Khong tao flow qua dai neu co the kiem bang API + UI hop ly.
- Khong dung notification that cua seed lam assertion chinh.
- Moi notification test duoc tao voi token admin va xoa sau test.
- Giu checkout E2E hien co, bo sung spec rieng cho notification center.

## Thay doi da thuc hien

- Them `e2e/notifications.spec.ts`.
- Test moi bao phu:
  - Buyer nhan va filter duoc `ORDER_UPDATE`, `PAYMENT_STATUS`, `PROMOTION`.
  - Seller nhan va filter duoc `NEW_ORDER`.
  - Admin nhan va filter duoc `SYSTEM_ALERT`.
  - Seller mark read notification va API xac nhan `isRead=true`.
  - Seller delete notification va API xac nhan record khong con trong mailbox.
  - Buyer khong doc duoc mailbox/unread count cua seller.
  - Admin reject invalid notification type.
  - Buyer khong duoc tao notification truc tiep.
- Sua `useNotifications` de bo qua response cu khi search/filter request ve nguoc thu tu.
- Sua `apiClient.request` de custom headers khong ghi de mat `Authorization`.

## Loi an da phat hien nho E2E moi

- Race condition tren Notification Center: search request va filter request co the tra ve nguoc thu tu, lam UI hien notification sai filter.
- DELETE request tu UI bi mat token vi `apiClient.request` merge headers sai. Backend nhan user anonymous va tra `401`.

## Ket qua kiem thu

- `npx eslint "e2e/notifications.spec.ts" "hooks/useNotifications.ts" "lib/api.ts"`: pass.
- `npx tsc --noEmit --pretty false`: pass.
- `npx playwright test e2e/notifications.spec.ts --project=chromium --reporter=line --workers=1`: pass, 2/2 tests.
- `npx playwright test e2e/notifications.spec.ts e2e/checkout.spec.ts e2e/moderation-notifications.spec.ts --project=chromium --reporter=line --workers=1`: pass, 5/5 tests.
- Kiem tra DB sau test: `remaining_e2e_notifications=0`.
