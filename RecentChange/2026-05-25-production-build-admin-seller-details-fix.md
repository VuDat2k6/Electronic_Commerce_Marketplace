# Production Build Admin Seller Details Fix

## Van de

- `npm run build` da qua Prisma generate va Next compilation, nhung fail o ESLint:
  `app/(dashboard)/admin/sellers/[id]/page.tsx:141` co apostrophe khong escape.
- Cung component co warning `useEffect` thieu dependency `fetchSeller`.

## Pham vi sua

- Escape noi dung empty state de JSX dat quy tac `react/no-unescaped-entities`.
- Bao `fetchSeller` bang `useCallback` phu thuoc `id`, sau do dung callback lam
  dependency cua `useEffect`.

## Rui ro

- Khong doi API, RBAC hoac noi dung lay du lieu seller.
- Reload sau approve/suspend van goi cung ham fetch theo seller ID hien tai.

## Xac minh

- Chay ESLint file.
- Chay lai `npm run build` khi cac dev process khong khoa Prisma DLL.

## Ket qua

- Da escape text JSX va on dinh dependency cua `fetchSeller`.
- `npx eslint app/(dashboard)/admin/sellers/[id]/page.tsx --no-cache`: pass.
- `npm run build`: pass khi Prisma DLL khong bi dev process khoa.
- `npx next build` voi backend health `200`: pass va khong con log fetch
  featured-products bi tu choi ket noi.
- Build van bao warning khong chan tai cac `<img>` cu va mot dependency
  `useMemo`; ghi nhan la toi uu hieu nang con lai ngoai blocker nay.
