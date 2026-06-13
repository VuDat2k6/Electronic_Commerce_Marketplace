# Remove Admin Bulk Upload Surface

## Yeu cau
- Bo phan bulk upload khoi pham vi admin vi admin chi kiem duyet listing.
- Xac nhan san pham trung bay tren storefront duoc doc tu database.
- Bao toan cong cu seller nhap va quan ly catalog cua chinh shop.

## Phan tich hien trang
- Storefront lay product tu cac API truy van bang Product trong database; bulk upload khong phai nguon hien thi rieng.
- Backend `/api/bulk-upload` da duoc gioi han `requireSeller` va `requireActiveSeller`.
- Admin sidebar va cac route `/admin` hien khong con trang bulk upload.
- Van con `components/BulkUploadHistory.tsx` duoc export toan cuc, khong co consumer, goi thang `http://localhost:3001/api/bulk-upload` khong kem auth va mang mo hinh xem/xoa batch toan cuc cu.
- Script tao CSV va test helper van huong dan vao `/admin/bulk-upload`, trai voi RBAC hien tai.

## Thiet ke sua doi
- Xoa component `BulkUploadHistory` khong con su dung va bo export khoi barrel component.
- Cap nhat huong dan CSV/test helper tu admin sang `/seller/bulk-upload` va endpoint seller hien hanh `/api/bulk-upload`.
- Giu nguyen trang `/seller/bulk-upload` va backend seller-only, vi seller van can them nhieu san pham vao database mot cach hop le.

## Anh huong du lieu
- Khong migration va khong xoa du lieu san pham/batch.
- San pham da co trong database tiep tuc hien thi binh thuong theo status storefront cho phep.
- Seller van co the tao listing thu cong hoac import CSV; admin chi review va gui canh bao.

## Kiem thu du kien
- Tim kiem khong con tham chieu UI hoac huong dan `/admin/bulk-upload`.
- ESLint/type check cho cac file frontend bi anh huong.
- Xac minh admin navigation khong hien bulk upload va seller navigation van giu bulk upload.

## Ket qua
- Khong co route hoac navigation admin bulk upload trong ung dung dang hoat dong; component history toan cuc cu va export cua no da duoc xoa.
- Script tao CSV va helper kiem tra da huong dan dung ve seller dashboard va endpoint `/api/bulk-upload`.
- `/seller/bulk-upload` va seller navigation duoc giu lai de seller nhap catalog vao database.
- Tim kiem source khong con tham chieu runtime den `/admin/bulk-upload` hoac `BulkUploadHistory`; ket qua con lai chi la noi dung change note nay.
- `eslint`, `node --check` va `git diff --check` dat cho cac file lien quan.
- `npx tsc --noEmit` van bi chan boi loi co san ngoai pham vi tai `e2e/test-reg.spec.ts:20`: bien `errors` chua duoc khai bao.
