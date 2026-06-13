# Admin product warning send UX fix

## Van de

Trong trang admin product moderation, admin khong bam duoc nut `Send warning to seller` khi nhap reason ngan nhu `bad`.

## Root cause

- Backend yeu cau `reason` tu 10 den 1000 ky tu.
- Frontend cung disable button khi `reason.trim().length < 10`.
- UI chi hien counter `3/1000`, khong noi ro toi thieu 10 ky tu, nen admin tuong nut/flow bi loi.

## Huong sua

- Giu validation backend 10-1000 ky tu.
- Khong disable nut vi reason ngan; cho admin bam de hien validation message ro rang.
- Them helper/error text duoi textarea.
- Chi disable nut khi dang gui request.

## Kiem thu du kien

- Reason ngan hon 10 ky tu: bam Send hien loi ro rang, khong goi API thanh cong.
- Reason hop le: gui warning den seller thanh cong.
- Static checks va typecheck pass.

## Fix da ap dung

- `app/(dashboard)/admin/products/[id]/page.tsx`
  - Them `reasonError` de hien inline validation.
  - Nut `Send warning to seller` chi bi disable khi dang gui request.
  - Reason ngan hon 10 ky tu se hien toast + inline error thay vi lam nut khong bam duoc.
  - Counter doi sang dem `trim()` de khop backend validation.
- `e2e/moderation-warning.spec.ts`
  - Sua login wait predicate de tranh flaky redirect.
  - Them test UI cho case nhap `bad` va bam send.

## Kiem thu da chay

- `npx eslint -- "app/(dashboard)/admin/products/[id]/page.tsx" e2e/moderation-warning.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npx playwright test e2e/moderation-warning.spec.ts --project=chromium --reporter=line --workers=1` passed, 2 tests.
