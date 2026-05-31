# Login Single Submit Redirect Fix

## Van de
- Trang login van can bam `Sign in` lan thu hai moi dieu huong khoi `/login`.
- Credential dang nhap co the da duoc chap nhan o lan bam dau nhung UI/route van o lai trang login.

## Nguyen nhan can xac minh
- `router.refresh()` va `router.replace()` sau `signIn(..., redirect: false)` co the race voi session cookie/layout refresh.
- App Router navigation noi bo co the tai su dung client tree/session snapshot cu cua trang login.
- Callback destination co the chua duoc chuan hoa hoac redirect dang phu thuoc vao session re-render.

## Pham vi sua du kien
- `app/login/page.tsx`
- Chi kiem tra `utils/SessionProvider.tsx`, `app/layout.tsx`, `lib/authOptions.ts` neu can de xac minh root cause.

## Huong xu ly
- Tai hien login tren app dang chay va quan sat URL/session sau lan submit dau.
- Neu session cookie da tao nhung router navigation bi stale, dung redirect tai lieu moi (`window.location.assign`) sau khi NextAuth bao thanh cong de server render layout voi cookie moi ngay lap tuc.
- Khong mo rong sua homepage/dashboard trong fix nay.

## Kiem thu
- Buyer login bang mot lan click.
- Admin login bang mot lan click.
- Seller login bang mot lan click.
- Sau redirect, header hien account state dung.
- Logout va login lai van chi can mot submit.

## Ket qua
- Nguyen nhan duoc co lap tai `app/login/page.tsx`: submit thanh cong da dung `router.replace()` ket hop `router.refresh()` ngay sau khi NextAuth vua ghi session cookie, de lai kha nang layout/session client tiep tuc render snapshot chua dang nhap.
- Nhanh thanh cong da duoc doi sang `window.location.replace(res.url || redirectTo)` sau khi kiem tra `res.ok`, de tai lai document bang cookie moi trong mot buoc.
- `callbackUrl` duoc gioi han ve internal relative path truoc khi dung de redirect.
- `npx tsc --noEmit`: dat.
- `npm run lint`: dat voi cac warning ton tai san ngoai pham vi sua login.
- Browser test tren frontend tach biet `http://localhost:3010`: buyer `buyer@tfdtronic.com` bam `Sign in` mot lan va dieu huong ve `/`; response credential callback tra `200`; session tra `role: buyer`.
- Browser test menu/header: sau login hien `Become a seller` va `Log out`; reload van hien account; logout tra header ve `Login`.
