# Admin Users And Categories UI Improvement

## Yeu cau
- Cai thien giao dien khu vuc `Users` va `Categories` trong admin dashboard.

## Phat hien
- Man hinh list dang dung bang mac dinh, bo cuc rong va action kho quet trong tac vu quan tri.
- Users page doc sai response moi cua API: backend tra `{ users, pagination }` nhung UI chi xu ly array, co the hien danh sach rong.
- Categories page dung `nanoid()` lam React key, khien moi row bi remount sau moi render.
- Create/edit form chua cung visual system voi dashboard; user form con dung role `user` khong phu hop enum `buyer | seller | admin`.
- Category detail dang noi delete se xoa product, trong khi backend thuc te chan xoa category dang duoc product su dung.
- Sidebar doc chua toi uu cho viewport nho, anh huong cac trang quan tri nay tren mobile/tablet.

## Pham vi sua doi
- Cai thien list, create va detail/edit views cho admin users va categories.
- Them loading, error, empty state, local search/filter va status badges phuc vu viec scan du lieu.
- Sua parsing users response va stable key categories ma khong thay doi API contract.
- Doi form role theo RBAC hien tai; create chi cho `buyer`/`seller`, edit cho phep admin cap nhat role.
- Lam sidebar admin responsive hon nhung giu nguyen cac route va permission.

## Bao toan
- Khong thay doi backend API, database schema, auth middleware hoac RBAC.
- Khong them xoa user/category truc tiep tai list; destructive action van nam trong trang details.

## Kiem thu du kien
- `npx tsc --noEmit --pretty false`.
- ESLint cac file admin vua sua.
- Browser smoke desktop/mobile tren `/admin/users` va `/admin/categories` khi co session admin.

## Ket qua
- `app/(dashboard)/admin/users/page.tsx`: thay bang cu bang account directory co metric, role/status badges, pagination, loading/error/empty state va xu ly dung response `{ users, pagination }`.
- `app/(dashboard)/admin/users/new/page.tsx`: chuan hoa form tao tai khoan; create chi gui role `buyer` hoac `seller` dung validation backend.
- `app/(dashboard)/admin/users/[id]/page.tsx`: them loading/state thao tac ro rang; password moi la tuy chon; warning cap role va destructive action de nhan biet.
- `app/(dashboard)/admin/categories/page.tsx`: them metric, tim kiem cuc bo, loading/error/empty state va thay key dong bang `category.id`.
- `app/(dashboard)/admin/categories/new/page.tsx` va `[id]/page.tsx`: form dong bo visual, slug preview; noi dung delete dung voi quy tac backend chan category co san pham.
- `components/DashboardSidebar.tsx`: navigation admin responsive, cuon ngang tren mobile va giu muc menu khong bi co chu.

## Xac minh
- Dat: `npx tsc --noEmit --pretty false`.
- Dat: ESLint cho 7 file UI/admin vua sua.
- Dat: browser smoke voi session admin tren `/admin/users`, `/admin/users/new`, `/admin/users/[id]`, `/admin/categories`, `/admin/categories/new`, `/admin/categories/[id]` va viewport mobile.
- Browser smoke xac nhan Users nap duoc 46 tai khoan, pagination 3 trang; tim kiem category va cac form detail render dung.
- Trong luc test phat hien `.next` dev artifact cu dang nap `http://127.0.0.1:5000` trong layout trong khi CSP cho `http://localhost:5000`. Day la cache output bi lech voi cau hinh hien tai; da xoa output `.next` (git ignored) va khoi dong lai dev server sach, khong sua API contract.
