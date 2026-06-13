# Seller Dashboard Real Data Fix

## Yeu cau

- Seller moi chua ban hang khong duoc thay doanh thu tuan, recent orders hoac
  store views gia.
- Dashboard phai phan anh dung du lieu cua seller dang dang nhap.

## Van de va root cause

| Khu vuc | Muc do | Hien tuong | Nguyen nhan |
|---|---:|---|---|
| Recent Orders | P1 | Seller moi van thay `ORD001`, `ORD002`, `ORD003` | Frontend hardcode `recentOrders` trong dashboard |
| Weekly Revenue | P1 | Seller moi thay `45.200.000` | Frontend hardcode doanh thu tuan va trend `+18%` |
| Store Views | P2 | Seller moi thay `1,234 views` va `+25%` | Chua co tracking view trong schema nhung UI dung so demo |
| Metric trend cards | P2 | Moi card deu hien `+12%` | `StatCard` hardcode trend badge |
| Seller dashboard API | P1 | API chi co tong legacy `order_item`, chua tra du lieu dashboard du de render that | Controller chua tong hop current `SubOrder/SubOrderProduct` flow va chua co recent orders/revenue theo ky |

## Sua doi du kien

- Backend `/api/seller/dashboard` tra ve so lieu that:
  - total products
  - orders today / pending orders
  - monthly revenue
  - weekly revenue
  - weekly revenue change neu co previous-week baseline
  - recent orders cua seller
  - store views = 0 va trend = null cho den khi co tracking schema.
- Frontend bo hardcoded order/revenue/views/trend, render empty state khi khong co order.
- Giu API contract cu bang cac field fallback (`totalOrderItems`, `totalRevenue`) de khong lam vo component khac neu dang dung.

## Kiem thu du kien

- `node --check server/controllers/seller.js`
- `npx tsc --noEmit --pretty false`
- `npx eslint app/(seller)/seller/dashboard/page.tsx`
- Browser/API smoke: seller moi dashboard khong hien `ORD001`, `45.200.000`,
  `1,234`; seller co order hien so lieu theo du lieu database.

## Ket qua

- Backend `/api/seller/dashboard` da tong hop du lieu that tu ca legacy
  `order_item` va current `SubOrder/SubOrderProduct`.
- API tra them `totalOrders`, `monthlyRevenue`, `weeklyRevenue`,
  `weeklyRevenueChangePercent`, `recentOrders`, `storeViewsLast7Days` va
  van giu field cu `totalOrderItems`/`totalRevenue`.
- Frontend dashboard da bo hardcoded:
  - `ORD001/ORD002/ORD003`
  - `45.200.000`
  - `1,234 views`
  - trend `+12%`, `+18%`, `+25%`
- Seller moi khong co order se thay empty state `No orders yet`, weekly revenue
  la `0` va store views la `0` voi note analytics neutral.
- `node --check server/controllers/seller.js`: pass.
- `npx tsc --noEmit --pretty false`: pass.
- `npx eslint app/(seller)/seller/dashboard/page.tsx e2e/seller-flow-full.spec.ts`: pass.
- `npx playwright test e2e/seller-flow-full.spec.ts --project=chromium`: pass,
  test tao seller moi, admin duyet va xac minh khong con so/order demo.
- `npm run build`: pass.
- Frontend dang chay tai `http://localhost:3000`, backend health tai
  `http://localhost:5000/health`.
