# Google Auth, VNPay, Firebase Socket Chat

## Van de
- Marketplace chi ho tro dang nhap bang email/password.
- Checkout chua co cong thanh toan VNPay va IPN xac nhan giao dich.
- Ung dung chua co kenh nhan tin realtime giua buyer va seller.

## Nguyen nhan du kien
- NextAuth hien chi cau hinh Credentials provider.
- Payment model chua luu thong tin giao dich cong thanh toan.
- Express server chua khoi tao HTTP server cho Socket.IO va chua ket noi Firebase Admin.

## Pham vi sua
- Prisma schema va bien moi truong mau.
- NextAuth, trang login va callback Google.
- Checkout, VNPay service, IPN va trang ket qua thanh toan.
- Express server, chat routes/services/socket va giao dien messages.
- Header va trang chi tiet san pham de truy cap chat.
- Package dependencies va test lien quan.

## Huong xu ly
- Them Google provider, lien ket tai khoan OAuth voi user hien co theo email da xac minh, giu nguyen role/shop status.
- Mo rong Payment de luu provider, transaction reference va ket qua VNPay.
- Tao URL VNPay co checksum; IPN la nguon cap nhat payment chinh va phai idempotent.
- Luu conversation/message trong Firestore bang Firebase Admin; Socket.IO chi truyen realtime sau khi server kiem tra JWT va quyen tham gia.
- Tat ca truy cap chat tu browser phai qua Express API/Socket.IO, khong truy cap Firestore truc tiep.

## Kiem thu
- Prisma validate/generate va Next.js production build.
- Credentials login va Google provider configuration fallback.
- VNPay URL/signature/IPN success, invalid signature, wrong amount va duplicate IPN.
- Chat API unauthorized/authorized, tao conversation, gui/nhan message va reload history.
- Kiem tra Express health va Socket.IO startup khi Firebase chua/da cau hinh.
- Bo sung E2E smoke UI cho login, product detail chat, messages va checkout payment surface.
- E2E phat hien checkout bi redirect ve cart khi cart DB da co item nhung Zustand chua hydrate kip.

## Ket qua
- Da them Google provider va lien ket AuthAccount voi user noi bo.
- Da them VNPay checkout, return, IPN, expire job va rollback ton kho khi thanh toan that bai/het han.
- Da chan seller xu ly don VNPay chua thanh toan.
- Da them chat Firestore qua Firebase Admin, REST API, Socket.IO va giao dien messages.
- Da them `e2e/integrations.spec.ts`.
- Da sua race condition checkout: trang `/checkout` xac minh `/api/account/cart` truoc khi redirect ve `/cart`.
- `npx prisma validate` pass cho `prisma/schema.prisma` va `server/prisma/schema.prisma`.
- `npm run build` pass. Ghi chu: build co log `Error fetching featured products: ECONNREFUSED` khi backend dang tat trong luc build, nhung build exit 0.
- `node --check` pass cho cac file server chat/socket moi.
- `git diff --check` pass, chi co warning CRLF cua Windows.
- `npx playwright test e2e/integrations.spec.ts --project=chromium --reporter=line` pass: 3 passed.
- Du lieu test da duoc cleanup: 0 VNPay E2E orders, 0 pending VNPay E2E payments, 0 payment events test, cart test cua Anna buyer = 0 item.
- Live Google OAuth, Firebase Firestore va VNPay sandbox can credential moi truong that truoc khi test end-to-end voi nha cung cap.
