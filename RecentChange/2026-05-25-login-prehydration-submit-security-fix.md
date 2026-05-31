# Login Pre-hydration Submit Security Fix

## Van de

- Khi Playwright thao tac login ngay sau khi HTML hien thi, URL chuyen thanh
  `/login?email=...&password=...`.
- Mat khau bi dua vao query string va login khong chay qua NextAuth.

## Tai hien

- Mo mot browser context moi tai `/login`.
- Dien credential va bam `Sign in` ngay khi control xuat hien.
- Trinh duyet submit form GET truoc khi React gan `onSubmit`.

## Nguyen nhan

- Login la client component nhung markup form van duoc render ban dau.
- Truoc hydration, event handler `preventDefault()` chua ton tai.
- Form khong co lop bao ve HTML-native de ngan submit credential bang URL.

## Pham vi sua

- `app/login/page.tsx`: disable cac dieu khien gui credential den khi client da
  hydrate; giu disabled trong luc dang submit.
- `e2e/moderation-notifications.spec.ts`: thao tac login tren browser context moi
  la regression cho submit som va tiep tuc kiem tra warning/RBAC.

## Rui ro va xac minh

- Login co the bi khoa trong mot khoang rat ngan truoc hydration; day la hanh vi
  an toan hon viec gui password bang GET.
- Kiem tra login mot lan, persistence/logout, moderation notification va RBAC.
- Xac nhan URL khong chua `password=` trong regression browser.

## Ket qua

- Login controls bi disable cho den khi client hydrate, nen submit som khong
  the gui credential qua GET query string.
- Regression browser context moi thu thap navigation va assert khong co
  `password=` trong URL: pass trong `e2e/moderation-notifications.spec.ts`.
- Auth desktop/mobile pass voi sign in mot lan, refresh persistence va logout.
