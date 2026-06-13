# Storefront UI Merge Rollback

## Ly do
- Sau khi xem ban tich hop theo archive UI, nguoi dung danh gia giao dien nay kem hap dan hon giao dien storefront truoc do.
- Archive chi la storefront mock, khong mang lai gia tri chuc nang de danh doi visual identity hien co cua TFDTRONIC.

## Pham vi rollback
- Hoan tac rieng thay doi presentation tu dot merge ZIP tren homepage storefront.
- Khoi phuc thu tu section, hero, category, incentives, product card/grid, footer va visual header ve huong truoc khi merge.

## Giu nguyen
- Fix login mot lan submit va session/account menu.
- Buyer `Become a seller`, `Log out` va role-aware dashboard links.
- Electronics product seed, API-backed product rendering, cart va wishlist logic.
- Cac sua loi backend, RBAC va product detail da co.

## Kiem thu du kien
- `npx tsc --noEmit --pretty false`.
- `npm run lint`.
- `npx next build`.
- Browser smoke: homepage desktop/mobile, hero navigation, cart/wishlist, buyer login va account menu.

## Ket qua
- Dang thuc hien rollback visual co pham vi, chua hoan tat xac minh.
