# Remove Dashboard Export Report

## Yeu cau
- Go bo tinh nang export report khoi khu vuc admin va seller vi khong can thiet cho van hanh hien tai.

## Phan tich pham vi
- Admin dashboard co CTA `Export Report`.
- Seller analytics co CTA `Export CSV`, handler tai client va endpoint `GET /api/seller/analytics/export`.
- Bulk upload CSV cua seller la tinh nang import product rieng, khong thuoc export report va se duoc giu nguyen.

## Sua doi du kien
- Xoa CTA export tren admin dashboard.
- Xoa button va logic tai file CSV tren seller analytics.
- Xoa route/controller export analytics khong con duoc su dung o backend.
- Giu API analytics doc du lieu va cac dashboard metric hien co.

## Rui ro va xac minh
- Xac minh khong con reference toi endpoint analytics export.
- Chay TypeScript check va lint cac file frontend lien quan.
- Kiem tra backend controller/router load khong loi sau khi go export handler.

## Ket qua
- Da xoa CTA `Export Report` khoi admin overview.
- Da xoa CTA, handler tai CSV va dependency thong bao export khoi seller analytics.
- Da xoa backend endpoint `GET /api/seller/analytics/export` va handler `exportAnalytics`.
- Da giu nguyen route overview co RBAC, analytics widgets va tinh nang bulk upload product CSV.
- `rg` khong con reference `Export Report`, `Export CSV`, `/api/seller/analytics/export` hoac `exportAnalytics`.
- `npx tsc --noEmit --pretty false`: pass.
- `npx eslint 'app/(dashboard)/admin/page.tsx' 'app/(seller)/seller/analytics/page.tsx' --no-cache`: pass.
- `node --check 'server/routes/sellerAnalytics.js'` va `node --check 'server/controllers/sellerAnalytics.js'`: pass.
