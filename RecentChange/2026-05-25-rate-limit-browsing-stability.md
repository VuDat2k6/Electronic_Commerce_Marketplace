# Rate Limit Browsing Stability

## Van de phat hien

- Vong regression Chromium dat, nhung vong mobile ngay sau do hien `404 Product
  not found` va `/shop` co `0 products`.
- `server/logs/error.log` xac nhan cac endpoint doc san pham va slug tra `429`.
- `generalLimiter` dang gioi han moi IP `100` request trong `15` phut tren moi
  API request; day la muc qua thap cho mot storefront SSR va dashboard.
- `uploadLimiter` dang mount tren toan bo `/api/seller`, nen ca viec seller doc
  danh sach/quan ly thong thuong cung bi khoa sau `20` request.

## Root cause

- Baseline anti-abuse dang duoc dung nhu limiter cho hanh vi duyet hop le.
- Rate limit chong upload bi gan vao route namespace seller thay vi chi gan
  vao endpoint upload/import.
- Khi data-fetch bi `429`, frontend map that bai tai san pham thanh giao dien
  khong co du lieu hoac product-not-found, lam nguoi dung hieu sai.

## Pham vi sua

- `server/middleware/rateLimiter.js`: baseline general limiter su dung gia tri
  cau hinh `GENERAL_RATE_LIMIT_MAX`, mac dinh hop ly hon cho browsing; khong dem
  `OPTIONS` preflight vao quota.
- `server/app.js`: bo `uploadLimiter` khoi toan bo `/api/seller`; bulk/image
  upload van tiep tuc co limiter rieng.
- `e2e/marketplace.spec.ts`: locator nut search mobile match chinh xac `Go`,
  khong nham voi accessible name cua nut `Add Google ...`.

## Bao toan an toan

- Khong bo rate limit cho upload, bulk import, search hoac order.
- Cac endpoint auth/RBAC va permission khong thay doi.
- Baseline van ton tai va co the ha/nang qua bien moi truong production.

## Xac minh

- Khoi dong backend voi source moi va chay lai mobile regression sau vong desktop.
- Kiem tra product detail, filter drawer, search mobile va checkout khong bi
  chuyen thanh 404 do `429`.

## Ket qua

- `GENERAL_RATE_LIMIT_MAX` gio cau hinh duoc, mac dinh `1000/15 min`; OPTIONS
  khong tieu quota.
- Da bo `uploadLimiter` khoi namespace `/api/seller`; image va bulk-upload van
  giu limiter rieng.
- Sau restart backend, mobile product detail/inventory/checkout khong con 404
  gia do `429`; mobile storefront regression dat `6 passed, 1 skipped`.
- Vong Chromium lien ket tiep theo dat `16 passed, 1 skipped` ma khong tai dien
  product-rate-limit failure.
