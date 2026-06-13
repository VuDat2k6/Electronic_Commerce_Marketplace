# Login Auth State Fix

## Van de
- Sau khi login thanh cong, UI authentication co the khong cap nhat dung ngay lap tuc.
- Header co the van hien state cu hoac khong hien menu tai khoan/logout nhu web thong thuong.
- Can uu tien fix login truoc, chua thay doi hero/homepage.

## Nguyen nhan du kien
- SessionProvider/NextAuth session co the chua dong bo voi `router.refresh()` va `useSession()`.
- Sau `signIn(..., redirect: false)`, client co the redirect qua nhanh truoc khi session refetch xong.
- Header chi render menu account khi `status === authenticated`; neu session update cham thi UI nhin nhu chua login.
- Token backend bridge/cache co the can clear/refetch dung thoi diem login/logout.
- Co the route login redirect hoac middleware dang can thiep vao session refresh.

## Pham vi sua
- `app/login/page.tsx`
- `components/Header.tsx`
- `utils/SessionProvider.tsx`
- `lib/authOptions.ts`
- `middleware.ts`
- Co the kiem tra `app/api/backend-token/route.ts` va `lib/api.ts` neu token backend anh huong UI.

## Huong xu ly
- Kiem tra cau hinh NextAuth callbacks/session token.
- Dam bao login goi `signIn` xong se refetch session mot cach chac chan truoc khi redirect.
- Dam bao Header hien menu account khi session da authenticated va co fallback user email/role.
- Them dong bo cross-route bang `router.refresh()` dung thoi diem.
- Dam bao logout clear cache backend token va session UI ve anonymous.

## Kiem thu
- Login bang buyer/admin/seller.
- Sau login header phai mat Login/Register va hien avatar/menu.
- Click avatar phai hien menu account/logout.
- Logout phai ve anonymous state.
- Refresh browser sau login van giu authenticated state.
- Di chuyen qua route khac session/header van dung.

## Ket qua
- Da sua `app/login/page.tsx`:
  - Sau `signIn(..., redirect: false)`, goi `update()` va xac minh session moi co `user`.
  - Neu `update()` chua tra user, fetch truc tiep `/api/auth/session` voi `cache: "no-store"` de dam bao cookie/session da dong bo.
  - Chi redirect ve `/` sau khi session da duoc xac nhan.
- Da sua `components/Header.tsx`:
  - Account menu sau login hien ro hon bang nut avatar + label `Account` + email + chevron.
  - Menu logout/dashboard/order van giu logic cu.
- Da chay `npx tsc --noEmit`: pass.
- Da chay `npm run lint`: pass, chi con warning cu o cac file khac.
