# Remaining Stability And Performance Fixes

## Pham vi

- Xu ly cac ton dong sau dot regression critical: canh bao toi uu anh, warning
  hook gio hang, cach hien thi loi API tren storefront va metadata build cu.
- Giu nguyen API contract, du lieu don hang, RBAC va luong auth da duoc xac
  minh truoc do.

## Van de tai hien va nguyen nhan

| Feature | Muc do | Hien tuong | Nguyen nhan |
|---|---:|---|---|
| Seller reviews / category menu / legacy slider | P2 | `next build` canh bao raw `<img>` va bo qua image optimization | Component cu chua dung `next/image` du da co kich thuoc asset xac dinh |
| Cart | P1 | Build warning dependency; ten shop co the trong va key nhom khong on dinh | UI tinh nhom bang `useMemo` phu thuoc gia; store tao `sellerId/sellerName` nhung view doc `merchantId/merchantName` |
| Cart seller identity | P1 | Chi tiet san pham/cart co the van roi vao `Unknown Shop` | Public product responses chua kem `seller.shopName`; detail/wishlist button chi luu truong merchant legacy |
| Homepage featured products | P1 | Backend loi van co the hien san pham demo nhu du lieu that | Wrapper nuot loi API va section tu fallback demo khi danh sach rong |
| Shop / search | P1 | API `429/500` hoac mat ket noi bi trinh bay nhu khong co san pham | Non-OK response va exception deu bi quy ve `[]` |
| Product detail | P1 | Loi backend co the bi trinh bay thanh `404` product khong ton tai | Route khong phan biet HTTP `404` va cac response fail khac |
| Build tooling | P3 | Build/dev canh bao database browser metadata cu | `caniuse-lite` / `baseline-browser-mapping` can duoc dong bo lai |
| Dependency audit | P0 | `npm audit` bao `next@15.5.3` co RCE critical; co them advisory o sanitizer, auth va Prisma tooling | Cac dependency truc tiep dang dung ban truoc patch bao mat kha dung |
| Backend dependency audit | P1 | `server/npm audit` bao 7 high o `axios`, Express stack va Prisma tooling | Backend co lockfile va cay dependency rieng, chua duoc bao phu boi audit root |

## Sua doi du kien

- Chuyen cac anh component ton dong sang `next/image`, giu kich thuoc va
  layout hien tai.
- Cho cart tinh lai groups theo render cua Zustand; hien dung `sellerId` va
  `sellerName` cua contract hien tai, van ho tro alias merchant trong store.
- Mo rong response product public theo cach additive voi `seller.id/shopName`;
  luu seller identity vao cart tu card, detail va wishlist de checkout group
  hien dung shop.
- Tao error-state dung chung cho storefront va helper map status; `429`/`5xx`
  khong con hien nhu empty/not-found.
- Featured products trang chu chi hien san pham API khi response hop le; khong
  che outage bang catalog demo.
- Cap nhat browsers database package sau khi source fixes on dinh.
- Nang cac ban patch tuong thich cua `next`, `dompurify`, `next-auth`,
  `postcss`, `prisma` va `@prisma/client`; khong tu dong chuyen major auth
  hoac ORM neu can thay doi kien truc.
- Nang patch backend rieng cho `axios`, `express`, `uuid`, `prisma` va
  `@prisma/client`, sau do audit lai trong thu muc `server`.

## Kiem thu du kien

- `npx eslint` cho cac file thay doi va `npx tsc --noEmit --pretty false`.
- `npm run build`, kiem tra khong con cac warning `<img>`/hook noi tren.
- `npm audit` sau khi nang patch; ghi ro moi advisory transitive khong the go
  bo an toan trong cung major.
- Flow storefront khi backend hoat dong: homepage, shop, search, product,
  cart desktop/mobile.
- Flow khi API khong san sang: storefront phai hien retry/error state, khong
  danh dong thanh empty results hoac product `404`.
- Regression auth, checkout, seller va admin da co trong bo Playwright hien tai.

## Ket qua

- Da chuyen cac raw `<img>` con lai trong seller reviews, category menu va
  legacy slider sang `next/image`; production build khong con warning image
  cu.
- Da don `CartModule`: bo `useMemo` khong can thiet cho `getCartGroups`,
  hien dung `sellerId/sellerName` va khoa regression bang checkout E2E
  (`Gadget Pro Store`, khong con `Unknown Shop`).
- Da bo co che trang chu che API outage bang demo products; homepage, shop,
  search va product detail deu co error state retry khi backend loi/mat ket noi.
- Da bo sung `seller.id/shopName` vao product API public theo huong additive:
  `/api/products`, `/api/search`, `/api/slugs/:slug`, `/api/slugs/bulk` va
  `/api/products/:id`.
- Da cap nhat dependency root:
  `next@15.5.18`, `next-auth@4.24.14`, `dompurify@3.4.7`,
  `@prisma/client@6.19.3`, `prisma@6.19.3`, `postcss@8.5.15`,
  `browserslist@4.28.2`, `baseline-browser-mapping@2.10.32`,
  `caniuse-lite@1.0.30001793`.
- Da cap nhat dependency backend rieng:
  `axios@1.16.1`, `express@4.22.2`, `uuid@11.1.1`,
  `@prisma/client@6.19.3`, `prisma@6.19.3`.
- `server/npm audit`: `0 vulnerabilities`.
- Root `npm audit`: con `4 moderate`, khong con `critical/high`. Hai goc con
  lai la transitive upstream (`next -> postcss@8.4.31`,
  `next-auth -> uuid@8.3.2`); `npm audit fix --force` de xuat downgrade
  breaking (`next@9.3.3`, `next-auth@3.29.10`) nen khong ep override trong
  dot on dinh nay.
- Kiem thu fault-state khi backend tat:
  `/`, `/shop`, `/search?search=sony`, `/product/garmin-fenix-7-pro` deu hien
  error state dung, khong danh dong thanh empty/demo/404.
- Kiem thu voi backend hoat dong: homepage/shop/search khong con hien error
  state; product detail tra `sellerName=Gadget Pro Store`.
- Static gates dat:
  `npx tsc --noEmit --pretty false`, targeted `eslint`, backend `node --check`.
- Browser gates dat:
  Chromium full suite `24 passed, 1 skipped`; Mobile Chrome auth/storefront/
  filter/inventory/checkout `8 passed, 1 skipped`.
- Production build dat tren `next@15.5.18` va Prisma Client `6.19.3`; khong
  con warning raw image/hook/browser metadata trong build.
- Frontend dang chay lai tai `http://localhost:3000`, backend health tai
  `http://localhost:5000/health`.
