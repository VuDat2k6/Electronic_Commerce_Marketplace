# UI Hydration And Hero Layout Fix

## Van de
- Header tao khoang trang lon o dau trang, noi dung header co luc khong hien.
- Trang chu, login va register deu co hien tuong layout bi trong/lech.
- Hero slider chi hien nen gradient, dots, nut dieu huong va badge; noi dung chinh/anh san pham co luc khong hien.
- Trai nghiem load cham va de bi cam giac trang bi loi.

## Nguyen nhan du kien
- `Header` dung Framer Motion voi `initial={{ y: -100 }}` tren phan tu sticky header. Khi SSR/hydration cham hoac animation khong chay dung, header van chiem chieu cao layout nhung noi dung bi transform ra khoi man hinh, tao khoang trang trang.
- `HeroSlider` boc noi dung quan trong bang `AnimatePresence` va cac `motion.div` co `initial` opacity/transform. Neu hydration gap loi/cham, text va anh co the nam o trang thai an, chi con nen gradient render duoc.
- Login/Register la page client nhung van nam trong global layout co `Header`, nen cung bi anh huong boi header blank state.
- Hero hien tai dat `min-h-[620px]`, nen khi content bi an thi loi trong rat lon va de thay ro.
- Mot so ky tu trong UI dang bi mojibake do encoding cu, can thay bang ASCII/Unicode dung de tranh hien thi loi.

## Pham vi sua
- `components/Header.tsx`
- `components/HeroSlider.tsx`
- `components/HeroSliderSkeleton.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
- Co the can kiem tra them `components/ProgressBar.tsx` va `app/globals.css` neu van con layout shift.

## Huong xu ly
- Bo animation `initial={{ y: -100 }}` tren sticky header. Header phai render o vi tri dung ngay tu SSR, khong phu thuoc animation de hien.
- Chuyen animation header sang hover/micro-interaction nhe, khong animate layout-critical container.
- Trong `HeroSlider`, dam bao text, CTA va anh co fallback visible state ngay ca khi Framer Motion/hydration chua san sang.
- Giam `min-height` hero theo breakpoint va dung layout responsive on dinh hon.
- Tach nen gradient/animation decorative ra khoi noi dung chinh; decorative animation loi thi content van hien.
- Dung fallback image local `/product_placeholder.jpg` neu hero image khong load duoc.
- Sua search button can giua bang fixed height/flex alignment, tranh bi lech xuong.
- Kiem tra login/register de dam bao card nam dung vi tri sau khi header render binh thuong.

## Kiem thu
- Mo trang chu lan dau va reload nhieu lan.
- Mo `/login` va `/register`, kiem tra khong con khoang trang header bat thuong.
- Kiem tra hero slider tren desktop va mobile.
- Kiem tra autoplay, nut next/prev va swipe.
- Kiem tra search button can giua trong header.
- Kiem tra console/dev terminal khong con warning/lien tuc ve image 404.

## Ket qua
- Chua sua code trong file nay. Day la phuong an xu ly truoc khi implement.
