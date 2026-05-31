# Hero Best Deals Transition Fix

## Van de
- Badge `Best deals` tren hero card nhin nhu dung yen khi hinh anh slide thay doi.
- Badge dang co noi dung tinh va khong co animation state rieng de nguoi dung nhan thay no thuoc ve tung slide.

## Nguyen nhan
- Card anh duoc thay bang `activeSlide.id`, nhung badge khong hien thi thong tin bien thien theo slide.
- Khong co enter/exit transition tren badge, nen trong luc doi anh, badge tao cam giac bi tach khoi animation cua product.

## Sua doi du kien
- Doi badge thanh `motion.div` va dong bo enter/exit voi image card.
- Hien thi discount cua slide trong badge neu co, de badge ro rang gan voi featured product hien tai.
- Khong thay doi autoplay, swipe, CTA hay du lieu san pham.

## Kiem thu du kien
- `npx tsc --noEmit --pretty false`.
- `npm run lint`.
- Kiem tra hero khi bam next/previous va khi autoplay doi slide.

## Ket qua
- Da chuyen badge sang `motion.div` co key theo `activeSlide.id` va enter/exit transition.
- Badge hien thi discount cua slide dang active, nen su thay doi duoc nhan biet dong bo voi hinh anh.
- `npx tsc --noEmit --pretty false`: pass.
- `npx eslint components/HeroSlider.tsx --no-cache`: pass.
- `npm run lint`: bi chan boi loi ton tai ngoai pham vi tai `app/(dashboard)/admin/sellers/[id]/page.tsx:137` (`react/no-unescaped-entities`) va cac warning hien co.
