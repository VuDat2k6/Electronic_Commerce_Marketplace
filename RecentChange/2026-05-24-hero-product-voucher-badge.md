# Hero Product Voucher Badge

## Yeu cau
- Thay badge chung `Best deals` tren anh hero bang voucher cua san pham dang hien thi.

## Phan tich
- `heroSlides` hien co truong `discount`, nhung khong co ma voucher gan voi product.
- Seed va API voucher chua cung cap lien ket voucher theo tung featured product tren hero.
- Hien thi mot voucher code tu tao se lam UI hua mot uu dai chua chac ap dung duoc tai checkout.

## Sua doi du kien
- Hien badge `Voucher` voi gia tri `discount` cua slide hien tai.
- Chi hien badge neu slide co uu dai, tranh hien voucher rong tren san pham khong co offer.
- Giu transition theo `activeSlide.id` de badge di cung anh san pham.

## Kiem thu du kien
- `npx tsc --noEmit --pretty false`.
- `npx eslint components/HeroSlider.tsx --no-cache`.

## Ket qua
- Da thay `Best deals` bang badge `Voucher` va muc giam cua slide dang active.
- Badge chi render tren slide co `discount`, nen khong quang cao voucher rong hoac ma khong ton tai.
- Transition theo slide duoc giu nguyen qua key `voucher-badge-${activeSlide.id}`.
- `npx tsc --noEmit --pretty false`: pass.
- `npx eslint components/HeroSlider.tsx --no-cache`: pass.
