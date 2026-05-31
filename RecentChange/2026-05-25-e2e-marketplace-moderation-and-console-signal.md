# E2E Marketplace Moderation And Console Signal

## Van de tai hien

### TEST-MARKET-01 - Marketplace test nuot loi

- Suite pass nhung log `Timeout waiting for cart or login page` va `Cart appears empty`.
- `AddToCartSingleProductBtn` co chu dich chan guest bang toast; `/cart` redirect guest sang login.
- Test hien tai dung `try/catch` va `if` de bo qua assertion, tao false pass.

### TEST-ADMIN-01 - Chua co regression cho product moderation boundary

- Admin suite chi cover sellers, orders va users.
- Chua assertion rang admin chi thay review/warning surface va khong thay thao tac tao/sua/xoa product cua seller.

### CONSOLE-01 - Next route-transition warning

- Seller E2E log canh bao Next ve `scroll-behavior: smooth`.
- `app/globals.css` khai bao smooth scrolling, trong khi root `<html>` chua co `data-scroll-behavior="smooth"`.

### GUEST-CART-01 - CTA guest chi goi toast, khong dua nguoi dung den login

- Tai hien khi siết marketplace E2E: guest nhan `Add to cart` tren product page nhung luong khong co navigation tiep tuc.
- Gio hang duoc bao ve boi login, nen CTA guest can chuyen den login voi callback ve san pham dang xem.

### TEST-MARKET-02 - Locator search mobile match nham product CTA

- Tren mobile, `getByRole("button", { name: "Go" })` cung match accessible
  name `Add Google Pixel ...`.
- Test fail truoc khi thuc thi tim kiem, khong phai loi cua search UI.

### HYDRATION-CTA-01 - Mobile interaction bi mat truoc hydration

- Sau khi san pham render dung, click rat som vao `Filters` khong mo drawer va
  click `Add to cart` cua guest khong redirect.
- Hai button duoc SSR render co ve clickable truoc khi React gan handler; voi
  `type="button"`, click som bi mat ma khong co fallback.
- Kiem tra source phat hien `ProductItem` khong dua `session` vao dependencies
  cua callback cart/wishlist, nen card co the giu auth state cu sau login.
- Vong Chromium day du tai hien tuong tu voi sidebar `Filters`: label duoc bam
  truoc handler nen gia tri khong doi, sau do Apply dung state mac dinh.

## Sua doi du kien

- Viet lai marketplace E2E de assert search, guest toast va redirect login mot cach deterministic.
- Dung dung search control desktop/mobile de suite chay duoc tren responsive viewport.
- Them filter regression: thay doi control khong reload listing cho den khi bam `Apply`, hoat dong trong mobile drawer.
- Them admin moderation UI regression va API denial cho thao tac delete seller, khong gui canh bao hay thay doi data.
- Them attribute duoc Next yeu cau vao root layout.
- Dieu huong guest khi nhan `Add to cart` hoac `Buy Now` den login, giu callback quay lai listing.
- Match chinh xac nut `Go` trong test search mobile de loai bo ambiguity.
- Disable mobile filter trigger va product purchase CTA den khi client da gan
  interaction handler, de nguoi dung khong gui thao tac vao UI chua san sang.
- Dong bo card product voi session hien tai va chuyen guest den login voi
  callback ve san pham dang quan tam.
- Khoa fieldset filter den khi interactive de desktop sidebar va mobile drawer
  deu khong lam mat thay doi dau tien.

## Kiem thu

- ESLint va TypeScript.
- Re-run `e2e/marketplace.spec.ts`, `e2e/admin.spec.ts` va seller regression de kiem tra console warning.

## Ket qua

- Da them regression deterministic cho search, guest redirect tu product detail
  va product card, inventory, filters va admin moderation boundary.
- Da sua interaction pre-hydration tai Header, MobileFilters, Filters,
  `ProductItem`, Add-to-cart va Buy-now CTA.
- `e2e/marketplace.spec.ts`: 4/4 pass tren Chromium va Mobile Chrome.
- `e2e/filters.spec.ts`: 2 applicable tests pass (desktop/sidebar va
  mobile/drawer), 2 viewport-inapplicable tests skip co chu dich.
- Vong Chromium tong hop: `16 passed, 1 skipped`; admin delete product bi tu
  choi `403` va moderation UI chi cho warning.
