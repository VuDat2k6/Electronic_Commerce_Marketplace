# Moderation Warning Notification Verification

## Pham vi kiem thu

- Admin gui compliance warning cho mot product thuoc seller.
- Seller xem duoc system alert trong Notification Center.
- Buyer khac khong doc duoc mailbox cua seller.
- Notification test duoc xoa sau assertion de khong lam ban du lieu demo.

## Ly do

- Admin product surface moi duoc thiet ke de warning seller thay vi xoa product.
- Can regression end-to-end cho API RBAC va thong bao nguoi nhan, khong chi kiem tra nut tren UI.

## Loi phat hien trong khi test

- Warning API tao notification thanh cong, nhung Notification Center cua seller
  hien trang rong.
- Backend log ghi `GET /api/users/email/...` tra `401` vi
  `hooks/useNotifications.ts` dung `fetch` truc tiep khong kem backend bearer
  token, sau do dung khong tai notifications.
- NextAuth session da co `session.user.id`, nen lookup email vua khong can thiet
  vua tao them request cham.

## Sua loi du kien

- `hooks/useNotifications.ts`: dung user ID co san trong session de tai mailbox
  va unread count thong qua `notificationApi` da gan token dung cach.
- `lib/notification-api.ts`: bo helper lookup email khong con caller va khong
  dam bao bearer token.
- `e2e/moderation-notifications.spec.ts`: tao warning, xac minh seller nhan duoc,
  buyer bi cam doc mailbox seller, va xoa notification test sau khi kiem tra.

## Ket qua

- Da bo lookup email khong xac thuc; Notification Center va unread count dung
  `session.user.id` voi `apiClient` bearer token.
- `e2e/moderation-notifications.spec.ts`: pass. Admin tao warning, seller thay
  notification, buyer doc mailbox seller bi tra `403`, notification test duoc
  delete trong cleanup.
