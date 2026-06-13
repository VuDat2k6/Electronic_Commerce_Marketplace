# Expanded Dashboard Test Seed

## Van de
- Seed hien tai chua du phong phu de test toan bo dashboard seller/admin.
- Can it nhat 5 buyer, 5 seller, 1 admin.
- Moi seller can co 1 shop va khoang 10 san pham trung bay.
- Can co user buyer de test `Become a seller` va seller pending de admin duyet.
- Can du lieu orders/reviews/stock/category de test seller dashboard, admin dashboard, seller approval, product/order flows.

## Nguyen nhan du kien
- Seed dang tap trung vao catalog electronics nho va user mau it.
- Dashboard can data quan he: seller, products, orders, reviews, pending seller.

## Pham vi sua
- `server/scripts/seed.js`
- Co the can kiem tra Prisma schema de tao dung quan he order/payment/subOrder/subOrderProduct/review.

## Huong xu ly
- Tao 1 admin.
- Tao 5 active sellers, moi seller co shop metadata va it nhat 10 products.
- Tao 5 buyers active.
- Tao them 1 buyer thuong de test become seller.
- Tao them 1 pending seller de admin test approve/suspend.
- Tao categories electronics.
- Tao orders/subOrders/subOrderProducts/payments/reviews de dashboard co metric.
- Giu id deterministic va dung upsert/updateMany de seed lap lai an toan.

## Kiem thu
- `npm run db:seed`
- Query DB dem users/products/orders/reviews.
- `npx tsc --noEmit`

## Ket qua
- Da thay `server/scripts/seed.js` bang seed dashboard test deterministic.
- Seed tao:
  - 1 admin: `admin@tfdtronic.com / admin123`
  - 5 active sellers, moi seller co shop metadata.
  - 1 pending seller: `pending.seller@tfdtronic.com / password`
  - 6 buyer, gom buyer chinh va buyer test become seller: `become.seller.test@tfdtronic.com / password`
  - 10 electronics categories.
  - 50 published products, moi active seller co dung 10 products.
  - 15 seeded orders, 30 legacy order items, 15 subOrders, payments, tracking data.
  - Reviews de test product detail/review dashboard.
- Da giu cac slug quan trong cho hero/product links nhu iPhone, MacBook, Sony headphones, Apple Watch, PlayStation.
- Da chuyen seller legacy `style.seller@tfdtronic.com` ve buyer de admin sellers list khong bi lan du lieu cu.
- Da chay `npm run db:seed`: pass.
- Query DB xac nhan:
  - 5 active sellers.
  - 1 pending seller.
  - 50 published products.
  - Moi active seller co 10 products.
  - 15 seed orders, 30 seed order items, 15 seed subOrders, 86 published reviews.
- Da chay `npx tsc --noEmit`: pass.
- Da chay `npm run lint`: pass, con warning cu khong lien quan.
