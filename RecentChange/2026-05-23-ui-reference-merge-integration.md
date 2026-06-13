# UI Reference Merge Integration

## Yeu cau
- Tich hop UI tu archive `Sua loi va cai thien UI (1).zip` vao marketplace hien tai.
- Giao dien moi phai phu hop voi ung dung electronics va khong lam hong auth, RBAC, API hoac du lieu dashboard da sua.

## Trang thai truoc khi sua
- Workspace dang co nhieu thay doi chua commit tren homepage, dashboard, auth va seller flow.
- Archive chua duoc ap dung; can audit source va assets truoc khi merge.
- Cac thu muc `skills/...` va `rules/common/...` duoc neu trong yeu cau truoc khong ton tai trong workspace de doc.

## Cach tich hop an toan
- Doc cau truc archive va doi chieu voi component/route dang su dung.
- Khong copy de toan bo project; chi chon visual patterns hoac assets co the gan vao business logic hien tai.
- Giu nguyen API calls, session handling, RBAC va electronics catalog.
- Uu tien cac man hinh nguoi dung dang mo: dashboard components va cac surface bi anh huong truc tiep neu archive co thiet ke tuong ung.

## Audit archive
- Archive la app Vite/React trinh bay storefront bang mock data, khong chua dashboard backend hoac NextAuth integration de merge truc tiep.
- Cac pattern co the tai su dung: header nen sang co thanh category navigation, feature strip compact, category/product card toi gian va footer sang.
- Khong nhap `mockProducts`, shadcn dependency tree hay remote Unsplash image cua archive; project tiep tuc dung API va anh electronics local hien tai.

## Pham vi ap dung
- `app/page.tsx`: sap xep feature strip theo bo cuc storefront cua archive.
- `components/Header.tsx`: visual system moi nhung giu search, cart/wishlist, auth account dropdown va seller action.
- `components/HeroSlider.tsx`, `components/HeroSliderSkeleton.tsx`: giam trang tri nang, giu local hero image/autoplay/swipe/CTA.
- `components/CategoriesGrid.tsx`, `components/Incentives.tsx`, `components/ProductsSection.tsx`, `components/ProductItem.tsx`, `components/Footer.tsx`: ap dung card/band/footer sang va route hop le.

## Kiem thu du kien
- `npx tsc --noEmit`.
- `npm run lint`.
- `npx next build` neu pham vi tich hop anh huong route/render.
- Kiem tra UI route da tich hop tren desktop va mobile neu co the chay browser automation.

## Ket qua
- Da audit archive; dang ap dung cac pattern storefront co chon loc vao component noi du lieu that.
