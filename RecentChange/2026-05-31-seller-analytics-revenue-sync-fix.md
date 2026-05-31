# Seller analytics revenue sync fix

## Van de

Seller dashboard co doanh thu va don hang, nhung trang `/seller/analytics` lai hien:

- Total Revenue = 0
- Total Orders = 0
- Last 7 Days Revenue = 0
- Order Status = 0

Trong khi total products van dung.

## Root cause

- Dashboard seller dang tong hop ca du lieu order moi tu `subOrder`/`subOrderProduct` va legacy `order_item`.
- Analytics controller `server/controllers/sellerAnalytics.js` chi doc bang legacy `order_item`.
- Cac order moi tao qua checkout hien tai nam trong `subOrder`, nen analytics khong thay doanh thu/don hang.
- Analytics con tinh total revenue legacy sai vi lay `_sum.priceAtPurchase` ma khong nhan quantity.

## Huong sua

- Dong bo analytics voi dashboard bang cach doc ca:
  - legacy `order_item`
  - current `subOrder` + `subOrder.products`
- Tinh revenue theo `unitPrice * quantity`.
- Tinh totalOrders theo order/subOrder unique.
- Tinh recentRevenue/recentOrders 7 ngay theo order date.
- Tinh dailyRevenue 30 ngay co du lieu thuc.
- Tinh orderStatusBreakdown tu status thuc thay vi mock percentage.
- Tinh topProducts tu item sales thuc.

## Kiem thu du kien

- Seller co dashboard monthly revenue > 0 thi analytics total/recent revenue cung cap nhat.
- API `/api/seller/analytics/overview` tra totalOrders/revenue khac 0 voi seller co order.
- E2E/Playwright verify analytics page hien revenue/order.
- Static checks va typecheck pass.

## Fix da ap dung

- `server/controllers/sellerAnalytics.js`
  - Thay logic analytics legacy-only.
  - Doc `order_item` legacy va `subOrder` hien tai.
  - Tinh revenue theo `unitPrice * quantity`.
  - Tinh `totalOrders`, `totalRevenue`, `recentOrders`, `recentRevenue`, `averageOrderValue`.
  - Tao `dailyRevenue` 30 ngay tu doanh thu thuc.
  - Tao `orderStatusBreakdown` tu status thuc.
  - Tao `topProducts` tu sales thuc cua ca legacy/current orders.
- `e2e/seller-analytics.spec.ts`
  - Them test API so sanh dashboard va analytics cho seller trong screenshot (`qypV892p0Ly6ernjU6oL3`).
  - Them test UI analytics cho seller co order.
- Restart backend port 5000 de load controller moi.

## Kiem thu da chay

- `node --check server/controllers/sellerAnalytics.js` passed.
- `npx eslint -- server/controllers/sellerAnalytics.js e2e/seller-analytics.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- API verify cho seller trong screenshot:
  - Dashboard: `totalProducts=2`, `totalOrders=3`, `totalRevenue=49.970.000`.
  - Analytics: `totalProducts=2`, `totalOrders=3`, `totalRevenue=49.970.000`, `recentOrders=3`, `recentRevenue=49.970.000`.
  - `orderStatusBreakdown.pending=3`.
  - `topProducts` co Samsung Galaxy S24 Ultra va Sony WH-1000XM5.
- `npx playwright test e2e/seller-analytics.spec.ts --project=chromium --reporter=line --workers=1` passed, 2 tests.
- Health check:
  - Frontend `/` -> 200.
  - Backend `/health` -> 200.
  - Backend error log moi khong co loi runtime.
