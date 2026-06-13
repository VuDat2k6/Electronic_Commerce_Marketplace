# Auth Header Regression Coverage

## Khoang trong kiem thu

- `e2e/auth.spec.ts` dang ky va login, nhung tim `Logout` tren trang ma khong mo account menu.
- Neu nut khong ton tai, test bo qua bang `if`, nen loi header thieu menu/logout van co the pass.
- Bai test dieu huong toi `/account`, nhung buyer account route hien co la
  `/account/orders`; trang 404 van lam assertion URL cu pass.
- Mobile capture cho thay account button co the duoc bam truoc hydration va
  khong mo dropdown, cung kieu interaction bi mat nhu CTA storefront.

## Sua doi du kien

- Sau login, assert link `Login`/`Register` bien mat.
- Mo account menu buyer va assert `My orders`, `Order history`, `Become a seller`, `Log out`.
- Reload trang va lap lai assertion de kiem tra session persistence.
- Bat buoc click `Log out` va assert guest header quay lai.
- Tren mobile, mo navigation drawer thay cho desktop account dropdown va kiem tra cac action buyer tuong duong.
- Sau full-document redirect cua login, cho document moi san sang truoc khi
  test tu dieu huong sang `/account`; tranh abort navigation do test tao ra.
- Dung route buyer that `/account/orders` va assert noi dung page thay vi chi
  assert URL.
- Disable cac button mo menu/search cua `components/Header.tsx` den khi client
  interactive, de click vao account menu khong bi mat truoc hydration.
- Scope assertion `My orders` vao link menu, vi page `/account/orders` cung co
  heading trung ten va lam locator text khong xac dinh.

## Kiem thu

- Chay `e2e/auth.spec.ts` tren Chromium va Mobile Chrome.

## Ket qua

- Header account control gio chi interactive sau hydration; menu buyer hien
  `My orders`, `Order history`, `Become a seller` va `Log out`.
- Auth test dung route that `/account/orders`, assertion menu duoc scope dung
  link, va kiem tra reload/logout khong con false pass.
- `npx playwright test e2e/auth.spec.ts --project=chromium --project='Mobile Chrome'`:
  `2 passed`.
