# Seller status page hardening

## Van de

Khi seller bi suspend chon dashboard, user thay trang gan nhu trong: header + footer, khong thay noi dung trang thai suspended. Flow co luc nhap nhay login/home/dashboard do dang dung `/become-seller` client page lam trang thai cho seller suspended.

## Root cause

- `/become-seller` la client form page, can `useSession` va fetch `/api/account/status` moi biet seller suspended.
- Protected seller routes redirect inactive seller ve `/become-seller`, nen trang thai suspended phu thuoc vao client hydration/fetch.
- Neu session token stale hoac route transition bi canh tranh, UI co the hien header/footer truoc nhung content status chua render ro rang.

## Huong sua

- Tao server-rendered `/seller/status` doc DB truc tiep theo session user id.
- Seller ACTIVE vao `/seller/status` se redirect `/seller/dashboard`.
- Buyer/non-seller vao `/seller/status` se redirect `/become-seller`.
- Seller PENDING/SUSPENDED thay trang thai ro rang ngay tu server render.
- Middleware va seller layout redirect seller khong ACTIVE ve `/seller/status`.
- Header account menu link `Seller status` ve `/seller/status`.

## Kiem thu du kien

- Seller suspended click dashboard/status tu header -> `/seller/status`, thay `Shop suspended`.
- Seller suspended go truc tiep `/seller/dashboard` -> `/seller/status`.
- Seller suspended dang nhap tu callback `/seller/dashboard` -> `/seller/status`.
- Seller active van vao dashboard.
- Buyer van vao become-seller.

## Fix da ap dung

- `app/seller/status/page.tsx`
  - Them server-rendered seller status page.
  - Doc DB truc tiep tu `session.user.id`, khong phu thuoc client fetch.
  - ACTIVE seller redirect `/seller/dashboard`.
  - Non-seller redirect `/become-seller`.
  - PENDING/SUSPENDED render status card va restriction list.
- `middleware.ts`
  - Seller protected routes redirect token khong ACTIVE ve `/seller/status`.
- `app/(seller)/layout.tsx`
  - Fallback server layout cung redirect inactive seller ve `/seller/status`.
- `components/Header.tsx`
  - Account menu cua seller khong ACTIVE link den `/seller/status`.
- `app/become-seller/page.tsx`
  - Seller non-ACTIVE vao form become-seller se redirect sang `/seller/status`.
- `e2e/seller-suspension.spec.ts`
  - Cap nhat expected URL sang `/seller/status`.
  - Assert `What is restricted` de dam bao content khong bi trong.

## Kiem thu da chay

- `npx eslint -- app/seller/status/page.tsx middleware.ts "app/(seller)/layout.tsx" components/Header.tsx app/become-seller/page.tsx e2e/seller-suspension.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npx playwright test e2e/seller-suspension.spec.ts --project=chromium --reporter=line --workers=1` passed.
- Manual smoke dung account trong screenshot:
  - `buyer@tfdtronic.com / buyer123`
  - Click account menu -> `Seller status`.
  - Final URL `http://localhost:3000/seller/status`.
  - Hien `Shop suspended` va `What is restricted`.
  - Screenshot luu tai `test-evidence/buyer-suspended-seller-status-fixed.png`.
- Direct dashboard smoke:
  - Login `buyer@tfdtronic.com`.
  - Go `/seller/dashboard`.
  - Redirect dung `/seller/status`.
- Health check:
  - Frontend `/` -> 200.
  - Backend `/health` -> 200.

## Trang thai test account sau kiem thu

- `buyer@tfdtronic.com`: `role=seller`, `shopStatus=SUSPENDED`.
- `gadget.seller@tfdtronic.com`: `role=seller`, `shopStatus=ACTIVE`.
