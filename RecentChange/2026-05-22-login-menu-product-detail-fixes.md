# Login Menu And Product Detail Fixes

## Van de
- Login phai bam `Sign in` hai lan moi chuyen trang. Lan dau co ve da login thanh cong nhung khong redirect ngay.
- Buyer account menu thieu loi vao `Become seller`.
- Menu/filter o goc marketplace tren mobile nhin chua on, dang chiem bo cuc va co filter auto state khong ro rang.
- Product detail description qua so sai, tab title bi dinh chu, khong co review/danh gia hien thi.
- Mot so product dang hien anh placeholder lon, can dam bao du lieu/hinh anh san pham dung hon.

## Nguyen nhan du kien
- Login dang cho `update()`/session refetch qua chat; neu `update()` tra session cu/null trong tick dau, code co the throw va khong redirect du co cookie login.
- Header account menu buyer dang tro `Account settings` ve `/become-seller`, nhung label sai nen user khong thay hanh dong become seller ro rang.
- Marketplace mobile filter/navigation can tach ro breadcrumb/menu va filter drawer; UI hien tai dang giong sidebar desktop bi nhoi vao mobile.
- Product detail page hien description raw text, tab labels khong co spacing/button UI, chua fetch/render reviews.
- Public product data co the van co archived/placeholder product trong route/detail hoac seed cu.

## Pham vi sua
- `app/login/page.tsx`
- `components/Header.tsx`
- `components/Filters.tsx`
- `components/MobileFilters.tsx`
- `app/shop/[[...slug]]/page.tsx`
- `app/product/[productSlug]/page.tsx`
- Co the can kiem tra `server/controllers/review.js`, `server/controllers/products.js`, seed data neu can.

## Huong xu ly
- Sua login de redirect ngay sau khi NextAuth signIn thanh cong; khong block redirect bang session verification khong on dinh.
- Sau login goi `router.refresh()` va `router.replace(callbackUrl || "/")` theo thu tu an toan, dong thoi de Header tu refetch session.
- Dua `Become a seller` vao nhom quan li tai khoan/account menu neu role la buyer; seller/admin khong hien action nay.
- Cai thien mobile marketplace menu/filter: nut filter ro rang, state apply/reset ro rang, bo UI bi chen lech.
- Cai thien product detail tab UI, description co noi dung premium hon, them reviews/rating section neu API co du lieu hoac fallback hop ly.

## Kiem thu
- Login buyer/admin/seller chi can bam 1 lan la redirect.
- Header sau login hien account menu va logout.
- Buyer thay `Become a seller`.
- Marketplace mobile filter khong bi chen lech, click apply/reset moi thay doi query.
- Product detail co tab description/reviews ro rang va text khong dinh chu.

## Ket qua
- Da sua `app/login/page.tsx`: login redirect ngay sau khi NextAuth signIn thanh cong, khong con chan redirect bang `update()`/session verification.
- Da sua `components/Header.tsx`: `Become a seller` nam trong nhom `Account management` cua account dropdown/mobile account menu.
- Da sua `components/MobileFilters.tsx` va `components/Filters.tsx`: filter mobile co drawer gon hon; Apply/Reset tu dong dong drawer sau khi cap nhat query.
- Da sua `components/Breadcrumb.tsx`: breadcrumb marketplace dung layout ngang on dinh, tranh roi doc nhu screenshot.
- Da sua `app/product/[productSlug]/page.tsx` va `components/ProductTabs.tsx`: product detail co description/specifications/reviews tabs, fetch reviews tu API, doc dung `averageRating`.
- Da sua `server/controllers/slugs.js`: product detail chi tra san pham `PUBLISHED`.
- Da sua `server/scripts/seed.js` va da chay `npm run db:seed`: co review mau cho product detail.
- Da chay `npx tsc --noEmit`: pass.
- Da chay `npm run lint`: pass, con warning cu khong lien quan task nay.
