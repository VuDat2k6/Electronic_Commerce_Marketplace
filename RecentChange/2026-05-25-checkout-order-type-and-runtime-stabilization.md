# Checkout Order Type And Runtime Stabilization

## Loi tai hien duoc

### ORDER-TSC-01 - Build bi chan boi service khong dong bo schema

- Tai hien: `npx tsc --noEmit --pretty false` tra ve loi trong `server/services/order.service.ts` va `app/api/customer-orders/checkout/route.ts`.
- Schema va Prisma client hien tai dung `Customer_order.address`, `Product.sellerId` va `OrderStatus` gom `processing`, `delivered`, `canceled`.
- File TypeScript van dung `adress`, `Product.merchantId`, `PAID`, bien ngoai scope `dbProduct` va thieu fields payment/shipping trong input.
- `server/services/order.service.js` da co nhieu sua doi phu hop schema; file `.ts` bi lech voi runtime va lam production build that bai.

### ORDER-HISTORY-01 - Lich su don hang buyer truy van sai khoa

- `app/api/account/orders/route.ts` truyen `session.user.id` vao `listCustomerOrders`.
- Service runtime dang loc `Customer_order.email = customerId`, trong khi don hang luu nguoi mua tai `buyerId`.
- Anh huong: buyer da dat hang co the khong thay don hang cua minh.

### REVIEW-TYPE-01 - Du lieu review server khong khop props client

- Prisma tra `createdAt` kieu `Date`, con `ProductTabs` nhan `createdAt?: string`.
- Anh huong: TypeScript build that bai tai trang chi tiet san pham.

### CHECKOUT-AUTH-01 - Endpoint checkout cho phep request an danh vao business logic

- Tai hien: POST `/api/customer-orders/checkout` khong co session, dung product gia `missing-product-for-auth-probe`, tra `400 Products not found` thay vi `401`.
- Root cause: route chap nhan `body.customerId` khi khong co session.
- Anh huong: client gia mao co the tao order/decrement stock gan vao buyer khac.

### CHECKOUT-TOTAL-01 - Phi van chuyen va thue do client quyet dinh

- UI hien tai quy dinh phi van chuyen co dinh `50000` VND va thue `Math.round(subtotal * 0.05)`, nhung service dung truc tiep `shippingAmount`/`taxAmount` tu request.
- Anh huong: buyer da dang nhap co the gui request thu cong voi phi bang `0`.

### ORDER-HISTORY-02 - UI account va API khong dong bo cau truc sub-order

- UI `/account/orders` dung `order.subOrders.reduce(...)` va render `subOrder.products`.
- `listCustomerOrders` chi include `items` va `payments`, khong include `subOrders`.
- Anh huong: sau khi co order, trang lich su co the crash o client thay vi hien don.

## Sua doi du kien

- Dong bo `order.service.ts` theo schema va hanh vi runtime dung: payment/shipping fields, address, status, ownership, payment record va seller summary.
- Loc order history theo `buyerId` trong ca source/runtime service.
- Chuyen `createdAt` review sang chuoi ISO truoc khi truyen vao client component.
- Bat buoc session tai Next checkout route; khong tin `customerId` tu payload.
- Tinh phi giao hang va thue tai server theo quy tac UI hien co, validate payment method, luu order notice.
- Tra `subOrders.products` cho trang lich su, hien status chu thuong va tien VND dung dinh dang.

## Rui ro va bao ve

- Khong thay doi schema hay migration.
- Giu cach tach sub-order va snapshot san pham hien co.
- Kiem thu lai typecheck, unauthenticated checkout, checkout, QR display va account order visibility.

## Ket qua

- `npx tsc --noEmit --pretty false`: pass sau khi dong bo service va props review.
- Probe checkout an danh: tra `401 { error: "Authentication required" }`.
- Checkout Chromium va Mobile Chrome: response `201`, `subTotal: 27990000`,
  `shippingTotal: 50000`, `total: 29439500`; QR bank transfer va order history
  deu duoc assert.
- Vong Chromium tong hop va mobile storefront regression deu pass cho checkout.
