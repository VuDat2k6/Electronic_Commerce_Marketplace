# Stylesheet Import Type Resolution Fix

## Van de
- IDE bao loi tai `app/layout.tsx` dong import `./globals.css` va `svgmap/dist/svgMap.min.css`.
- `next build` van thanh cong, nen day khong phai loi bundling hoac CSS bi thieu.

## Tai hien
- Lenh `npx tsc --noEmit --pretty false --noUncheckedSideEffectImports` bao `TS2307` cho hai import CSS trong layout.
- Cung kiem tra nay con phat hien `slick-carousel/slick/slick.css` va `slick-theme.css` trong `components/SimpleSlider.tsx` co chung nguyen nhan.

## Nguyen nhan
- TypeScript voi che do kiem tra side-effect imports can mot ambient module declaration cho stylesheet imports.
- Project hien chua co khai bao `*.css`, trong khi Next bundler van tu xu ly CSS luc build.

## Huong sua
- Them declaration file cap project cho `*.css`.
- Khong sua import trong `app/layout.tsx`, vi vi tri global stylesheet trong root layout la dung voi Next App Router.

## Kiem thu du kien
- `npx tsc --noEmit --pretty false --noUncheckedSideEffectImports`.
- `npx tsc --noEmit`.
- `npx next lint --file app/layout.tsx`.

## Ket qua
- Them `types/styles.d.ts` voi ambient declaration `declare module "*.css";`.
- `npx tsc --noEmit --pretty false --noUncheckedSideEffectImports`: dat; hai loi tai `app/layout.tsx` va loi cung loai cua slider da het.
- `npx tsc --noEmit --pretty false`: dat.
- `npx next lint --file app/layout.tsx`: dat, khong co warning/error.
