# Suspended seller dashboard login redirect fix

## Van de

Khi seller da bi suspend dang nhap lai, sau do bam/vao seller dashboard thi UI nhap nhay login roi quay ve trang chu. Nguoi dung khong thay trang thai `Shop suspended` nhu mong doi.

## Root cause du kien

- `middleware.ts` dang dung `authorized` callback de yeu cau seller route phai co `token.shopStatus === ACTIVE`.
- Voi seller suspend moi dang nhap, token co `shopStatus=SUSPENDED`, nen `authorized` tra false va NextAuth redirect thang ve `/login`.
- Middleware body khong co co hoi redirect seller suspended sang `/become-seller`.
- Login page chi chap nhan callbackUrl dang relative path. CallbackUrl do NextAuth tao thuong la absolute same-origin, nen bi fallback ve `/`, gay hien tuong quay lai homepage.

## Huong sua

- Cho seller co token hop le di qua `authorized`, sau do middleware body quyet dinh:
  - chua login -> login,
  - seller khong ACTIVE -> `/become-seller`,
  - seller ACTIVE -> dashboard.
- Chuan hoa callbackUrl trong login page de chap nhan absolute URL cung origin, nhung van chan open redirect.
- Them E2E cho flow: vao `/seller/dashboard` khi chua login, login bang seller suspended, phai thay `Shop suspended`.

## Kiem thu du kien

- Seller suspended login lai khong quay ve homepage.
- Direct `/seller/dashboard` cua seller suspended redirect dung `/become-seller`.
- Seller active van vao dashboard binh thuong.
- Unauthenticated user van bi dua ve login.

## Fix da ap dung

- `middleware.ts`
  - Seller protected routes trong `authorized` bay gio chi yeu cau co token.
  - Middleware body tiep tuc enforce `role === seller` va `shopStatus === ACTIVE`.
  - Seller suspended se duoc redirect den `/become-seller` thay vi bi NextAuth dua ve `/login`.
  - Bo sung `/seller/bulk-upload` vao danh sach authorized route.
- `app/login/page.tsx`
  - Them `resolveSafeCallbackUrl()`.
  - Chap nhan callbackUrl relative path hoac absolute URL cung origin.
  - Van fallback `/` neu callbackUrl la external URL de tranh open redirect.
- `e2e/seller-suspension.spec.ts`
  - Them case: vao `/seller/dashboard` khi chua login, login bang seller suspended, phai den `/become-seller` va hien `Shop suspended`.

## Kiem thu da chay

- `npx eslint -- middleware.ts app/login/page.tsx e2e/seller-suspension.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npx playwright test e2e/seller-suspension.spec.ts --project=chromium --reporter=line --workers=1` passed.
- DB cleanup sau test:
  - `User.shopStatus = ACTIVE`
  - `Merchant.status = ACTIVE`
- Health check:
  - Frontend `http://localhost:3000` -> 200.
  - Backend `http://localhost:5000/health` -> 200.
