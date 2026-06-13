# Admin Product Moderation Warning And Order Safety

## Yeu cau
- Admin khong tao, sua, upload hinh hoac xoa san pham thay seller.
- Admin chi xem danh sach, tim kiem, xem chi tiet va gui canh bao vi pham den seller.
- Seller tu xu ly viec cap nhat hoac go san pham sau canh bao.
- Bao toan don hang cua buyer neu san pham bi go trong qua trinh mua hang.

## Hien trang va nguyen nhan
- `/admin/products/[id]` hien van la form CRUD/upload day du, khong dung vai tro moderation.
- `/api/products` va cac API upload van cho phep `admin` thuc hien tac vu so huu cua seller.
- Danh sach admin dang goi API public, chua dung `mode=admin`, chua co pagination/search moderation dung nghia.
- San pham co `ProductStatus.ARCHIVED` va storefront chi lay `PUBLISHED`, phu hop voi co che go ban mem.
- Luong delete seller va product controller chi kiem tra `Order_item`, trong khi checkout hien tai ghi `SubOrderProduct`; hard delete co the gap foreign-key error hoac khong bao toan du lieu theo dung y dinh.
- Checkout service chua chan san pham da `ARCHIVED` neu buyer da giu san pham trong cart.
- He thong notification da co `SYSTEM_ALERT`, co the tai su dung de thong bao vi pham cho seller ma khong doi schema.
- Notification API hien tin vao `userId` do client gui de doc/sua/xoa, lam thong bao vi pham co nguy co bi tai khoan khac truy cap.
- Trong buoc verification, gallery image endpoint chi kiem tra role seller nhung khong kiem tra `productID` thuoc seller, tao nguy co IDOR giua cac shop.
- Bulk upload schema da co `batch.userId` va `product.sellerId`, nhung controller/service chua gan hai truong nay hoac loc batch theo JWT; upload seller hien co the hong hoac truy cap batch khac shop.

## Thiet ke sua doi
- Admin product UI tro thanh moderation queue: xem, tim kiem, pagination, loc status va truy cap trang review.
- Trang detail admin chi doc thong tin listing va co form gui canh bao co ly do; khong con input sua, upload hoac nut xoa.
- Them endpoint admin-only gui canh bao vi pham; server tao `SYSTEM_ALERT` cho seller kem metadata san pham.
- Khoa mailbox notification theo user ID tu JWT; chi admin duoc tao notification qua endpoint tong quat.
- Gioi han product CRUD va product image/upload endpoint ve seller; admin dung endpoint moderation rieng.
- Gallery image mutation xac minh san pham thuoc seller dang dang nhap; xoa main image bi chan neu file dang duoc listing cua shop khac su dung.
- Gioi han bulk upload product ve seller, gan `batch.userId`/`product.sellerId` tu JWT va chi cho doc/sua/xoa batch cua chinh shop.
- Bulk delete ap dung cung nguyen tac archive khi product da co order thay vi hard delete du lieu tham chieu.
- Seller delete: neu san pham da xuat hien trong bat ky kieu order nao thi archive thay vi hard delete.
- Checkout: chi chap nhan listing `PUBLISHED`, kiem tra lai status trong atomic stock update de ngan race condition.

## Xu ly buyer khi seller go san pham
- Neu buyer moi de san pham trong cart, chua tao don: checkout bi tu choi ro rang vi listing khong con mo ban; khong tao payment/don hang.
- Neu buyer da tao don thanh cong: san pham chi bi archive, snapshot va lien ket order van duoc giu de giao hang, hoan tien va doi soat.
- Canh bao cua admin tu no khong dung don mua; seller hoac quy trinh moderation moi quyet dinh go listing.

## Kiem thu du kien
- TypeScript va ESLint cho cac file frontend thay doi.
- Node syntax check cho controllers/routes backend thay doi.
- API smoke: admin load moderation/search, gui warning va seller nhan notification.
- API smoke: admin bi cam product CRUD; seller co the go listing.
- Checkout smoke: san pham archived trong cart bi tu choi; listing da co order duoc archive thay vi xoa.
- Ownership smoke: seller khong the sua gallery hoac batch import cua shop khac; san pham import thuoc seller trong token.

## Ket qua
- Admin product UI va component bang san pham cu da duoc chuyen ve read-only moderation; khong con affordance tao, sua, upload hoac xoa cho admin.
- API moderation ho tro danh sach/search/pagination, chi tiet listing va gui `SYSTEM_ALERT` den dung seller.
- Product mutation va image/bulk upload chi con cho seller dang active; admin bi backend tu choi.
- Mailbox notification lay danh tinh tu JWT, ngan account doc/sua/xoa thong bao cua seller khac.
- Seller go listing da co order bang cach archive; checkout moi chi chap nhan `PUBLISHED` va kiem tra lai trang thai trong cap nhat stock atomic.
- `eslint` cho cac frontend file thay doi va `node --check` cho backend controllers/routes/service deu dat.
- Browser/API smoke da dat vong dau: moderation list, warning notification, mailbox isolation, admin mutation denial, order preservation va archived checkout rejection.
- Ownership smoke dat voi hai seller active: seller khac bi chan gallery/main-image mutation, batch khong bi lo giua cac shop, san pham CSV duoc gan dung `sellerId` va trang thai `PUBLISHED`.
- `npx tsc --noEmit` chua xanh do loi co san ngoai pham vi sua doi tai `e2e/test-reg.spec.ts:20`: bien `errors` chua duoc khai bao.
