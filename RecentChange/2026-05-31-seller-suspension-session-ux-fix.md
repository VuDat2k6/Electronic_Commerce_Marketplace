# Seller suspension session UX fix

## Van de

Admin suspend seller da cap nhat backend va chan cac seller API, nhung seller dang dang nhap van co the thay UI nhu seller active:

- Header/account menu van hien Seller dashboard do NextAuth JWT con `shopStatus=ACTIVE` cu.
- `/seller/dashboard` bi layout redirect ve `/become-seller`, nhung `/become-seller` lai redirect moi role `seller` ve `/seller/dashboard`.
- Ket qua la seller suspended co the bi vong redirect va UI gay hieu nham rang suspend khong hoat dong.

## Huong sua

- Them endpoint doc user status moi nhat tu database cho client.
- Header dong bo role/shopStatus moi nhat va khong link seller suspended ve dashboard.
- Become seller page hien trang thai PENDING/SUSPENDED ro rang thay vi redirect moi seller ve dashboard.
- Tang test suspend de bat loi redirect loop va UI state sai.

## Root cause da xac nhan

- Backend suspend enforcement da dung: seller APIs tra 403, public seller API tra 404, checkout bi chan.
- Loi con lai nam o frontend session UX:
  - NextAuth JWT cua seller dang login van giu `shopStatus=ACTIVE` cho den khi session update.
  - Header dung session cu nen van hien Seller dashboard.
  - `/seller/dashboard` redirect ve `/become-seller` theo DB moi, nhung `/become-seller` lai redirect tat ca role `seller` ve dashboard theo session cu.
  - Ket qua tao redirect loop va man hinh trong nhu seller van con active.

## Fix da ap dung

- `app/api/account/status/route.ts`
  - Them endpoint doc role/shopStatus moi nhat tu database bang session user id.
  - Response `Cache-Control: no-store`.
- `components/Header.tsx`
  - Sau khi authenticated, fetch `/api/account/status`.
  - Neu role/shopStatus trong DB khac session, goi `useSession().update(...)`.
  - Account menu cua seller khong ACTIVE chuyen sang `Seller status`, link ve `/become-seller` thay vi dashboard.
- `app/become-seller/page.tsx`
  - Khong redirect moi role `seller` ve dashboard nua.
  - Seller ACTIVE moi redirect dashboard.
  - Seller PENDING/SUSPENDED thay trang thai ro rang.
  - Seller SUSPENDED thay noi dung: seller tools, listings, vouchers, bulk upload va checkout bi khoa den khi admin reactivate.
- `e2e/seller-suspension.spec.ts`
  - Them assertion UI `Shop suspended`.
  - Them assertion account menu hien `Seller status`.

## Kiem thu du kien

- Admin suspend seller qua UI/API.
- Seller dang login truoc khi bi suspend khong con thay seller dashboard la account action chinh.
- Truy cap `/seller/dashboard` sau suspend hien trang thai suspended hoac bi chuyen ve trang seller status dung.
- Seller API, storefront va checkout van bi chan nhu truoc.

## Kiem thu da chay

- `npx eslint -- components/Header.tsx app/become-seller/page.tsx app/api/account/status/route.ts e2e/seller-suspension.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npx playwright test e2e/seller-suspension.spec.ts --project=chromium --reporter=line --workers=1` passed.
- Manual smoke:
  - Login admin va seller truoc.
  - Admin suspend `seller-gadget-pro`.
  - Seller vao `/seller/dashboard` -> final URL `/become-seller`.
  - UI hien `Shop suspended`.
  - Account menu hien `Seller status`.
  - Cleanup approve lai `seller-gadget-pro`.
