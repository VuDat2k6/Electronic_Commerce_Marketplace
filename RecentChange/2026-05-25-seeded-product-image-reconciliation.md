# Seeded Product Image Reconciliation

## Loi tai hien duoc

- Screenshot product detail Garmin trong regression hien anh placeholder thay vi anh san pham.
- DB hien tai: `garmin-fenix-7x-pro-solar.mainImage = /product_placeholder.jpg`.
- `server/scripts/seed.js` hien tai da khai bao asset dung `/images/products/garmin-fenix.jpg`, va file asset ton tai trong `public/images/products`.
- Root cause: DB dang chay con du lieu tu buoc thay URL Unsplash 404 bang placeholder truoc khi local product assets duoc them.

## Sua doi du kien

- Cap nhat chi truong `mainImage` cua Garmin seeded listing dang bi placeholder,
  dung asset local `/images/products/garmin-fenix.jpg`.
- Khong chay lai seed tong the, khong sua stock, order, review hay user.
- Kiem tra lai product detail va homepage cards tai browser.

## Ket qua

- DB duoc cap nhat hep cho `garmin-fenix-7x-pro-solar`; khong reseed va khong
  doi stock/order/review.
- `e2e/inventory-display.spec.ts` assert image Garmin load co
  `naturalWidth > 0` tren Chromium va Mobile Chrome: pass.
