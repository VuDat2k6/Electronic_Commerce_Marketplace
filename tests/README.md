# Test Suite - TFDTRONIC eCommerce

## Cấu trúc thư mục

```
tests/
├── README.md                           # Hướng dẫn sử dụng
├── package.json                        # Dependencies cho test
├── jest.config.js                      # Jest configuration
├── setup.js                           # Setup trước khi chạy test
│
├── api/                               # API Tests (Backend)
│   ├── products.test.js
│   ├── orders.test.js
│   ├── users.test.js
│   ├── categories.test.js
│   ├── merchants.test.js
│   ├── vouchers.test.js
│   ├── reviews.test.js
│   ├── wishlist.test.js
│   ├── notifications.test.js
│   └── auth.test.js
│
├── components/                       # Component Tests (Frontend)
│   ├── Header.test.tsx
│   ├── CartModule.test.tsx
│   ├── ProductItem.test.tsx
│   ├── Products.test.tsx
│   └── WishlistModule.test.tsx
│
├── database/                        # Database Tests
│   ├── prisma.test.js
│   └── seed.test.js
│
├── integration/                     # Integration Tests
│   ├── checkout.test.js
│   └── order-flow.test.js
│
├── scripts/
│   ├── run-all-tests.js            # Script chạy tất cả test
│   ├── generate-report.js           # Tạo báo cáo lỗi
│   └── test-api-manual.js          # Test API thủ công
│
└── reports/                         # Báo cáo test
    └── .gitkeep
```

## Cách sử dụng

### 1. Chạy tất cả test
```bash
cd tests
npm install
node scripts/run-all-tests.js
```

### 2. Chạy test theo category
```bash
# API tests
npm test -- api/

# Component tests
npm test -- components/

# Database tests
npm test -- database/
```

### 3. Xem báo cáo lỗi
```bash
node scripts/generate-report.js
```

## Output

Sau khi chạy test, hệ thống sẽ tạo file báo cáo:
- `reports/test-results-[date].json` - Kết quả chi tiết
- `reports/bug-report-[date].md` - Báo cáo lỗi/bug

## Trạng thái test

- ✅ PASS - Test thành công
- ❌ FAIL - Test thất bại (cần fix)
- ⚠️  SKIP - Test được bỏ qua
- 🔄 PENDING - Test đang chờ
