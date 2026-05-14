# Code Review Report - Electronic Commerce Marketplace

**Project:** TFDTRONIC Electronics eCommerce Marketplace
**Review Date:** May 14, 2026
**Reviewer:** Claude AI (CodeRabbit-style Analysis)
**Tech Stack:** Next.js 15 + Node.js/Express + Prisma + MySQL + Tailwind CSS

---

## 1. Executive Summary

Dự án là một **marketplace thương mại điện tử đa người bán (multi-vendor)** với 3 giao diện chính:
- **Storefront** cho khách hàng (Next.js 15 App Router)
- **Admin Dashboard** cho quản trị viên
- **Seller Dashboard** cho người bán

**Điểm mạnh:** Kiến trúc sạch, bảo mật cơ bản tốt, có rate limiting, validation đầu vào, và sử dụng Prisma ORM.

**Điểm cần cải thiện:** Thiếu authentication middleware ở backend, có code duplication, và một số architectural issues.

| Category | Score |
|----------|-------|
| Architecture | 8/10 |
| Security | 7/10 |
| Code Quality | 6/10 |
| Performance | 7/10 |
| Maintainability | 7/10 |
| **Overall** | **7/10** |

---

## 2. Architecture Analysis

### 2.1 Tech Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │
│  │ App Router│  │ Zustand  │  │ NextAuth.js (OAuth)│    │
│  │ (TSX)    │  │ (State)  │  │ Credentials+Google │    │
│  └──────────┘  └──────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │ HTTP
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │
│  │  Routes  │  │Controllers│  │   Middleware       │    │
│  │ (20+)    │  │ (18+)    │  │ Rate Limit, Logger │    │
│  └──────────┘  └──────────┘  └────────────────────┘    │
│  ┌──────────┐  ┌─────────────────────────────────┐    │
│  │  Prisma  │  │  MySQL 8.0                      │    │
│  │  ORM     │  │  (17 Models, 40+ Indexes)       │    │
│  └──────────┘  └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Điểm tích cực về Architecture

1. **Phân tách rõ ràng Frontend/Backend** - Next.js cho frontend, Express cho API
2. **Prisma ORM** - Type-safe queries, migration system, relation handling tốt
3. **Middleware pattern** - Rate limiting, logging, security logging được modular hóa
4. **Multi-vendor architecture** - Thiết kế tốt cho marketplace đa người bán
5. **Database indexing tốt** - 40+ indexes trên các bảng chính
6. **Zustand state management** - Lightweight, no boilerplate

### 2.3 Điểm yếu về Architecture

1. **Backend không có authentication middleware** - Các route như `/api/orders`, `/api/products` có thể truy cập mà không cần đăng nhập
2. **Hai Prisma schemas riêng biệt** - Có thể gây inconsistency giữa frontend và backend
3. **File upload không có validation đầy đủ** - Chỉ có rate limiting, thiếu file type/size validation
4. **Order creation thiếu Order Items** - Khi tạo order, không tự động tạo `Order_item` records

---

## 3. Security Analysis

### 3.1 Điểm mạnh về Security

| Feature | Implementation | Status |
|---------|---------------|--------|
| Password Hashing | bcrypt (salt: 14 rounds) | ✅ Good |
| Input Validation | Whitelist-based validation | ✅ Good |
| Rate Limiting | express-rate-limit (per-endpoint) | ✅ Good |
| CORS Configuration | Origin whitelist + localhost dev | ✅ Good |
| Password Exposure | excludePassword() helper | ✅ Good |
| SQL Injection Prevention | Prisma ORM (parameterized) | ✅ Good |
| XSS Protection | DOMPurify library | ✅ Good |

### 3.2 Điểm yếu về Security

#### CRITICAL: No Authentication on Backend Routes

```javascript
// server/app.js - KHÔNG CÓ auth middleware
app.use("/api/orders", orderLimiter);      // ⚠️ No auth check
app.use("/api/products", productsRouter);  // ⚠️ No auth check
app.use("/api/users", userRouter);         // ⚠️ No auth check
```

**Impact:** Bất kỳ ai cũng có thể:
- Xem tất cả users (GET /api/users)
- Tạo/sửa/xóa products mà không cần đăng nhập
- Tạo orders giả mạo
- Thay đổi order status

#### HIGH: No Authorization on Admin Routes

```javascript
// Backend không kiểm tra role khi truy cập admin routes
// Ví dụ: Update user role thành admin mà không có auth
PUT /api/users/:id → { role: "admin" }  // ⚠️ Không kiểm tra quyền
```

#### MEDIUM: Sensitive Data Logging

```javascript
// server/controllers/customer_orders.js
console.log("Request body:", JSON.stringify(request.body, null, 2));
// ⚠️ Log đầy đủ request body có thể chứa thông tin nhạy cảm
```

#### MEDIUM: Missing File Upload Validation

```javascript
// server/app.js
app.use(fileUpload());  // ⚠️ Không có limits về file size/type
// Khuyến nghị:
fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  abortOnLimit: true,
})
```

#### MEDIUM: Duplicate Order Detection yếu

```javascript
// server/controllers/customer_orders.js
const duplicateOrder = await prisma.customer_order.findFirst({
  where: {
    email: validatedData.email,
    total: validatedData.total,
    dateTime: { gte: oneMinuteAgo }
  }
});
// ⚠️ Cùng email + cùng total + 1 phút = false positive
// Hai người khác nhau order cùng giá sẽ bị block
```

---

## 4. Code Quality Analysis

### 4.1 Positives

1. **JSDoc comments tốt** - Tất cả functions đều có documentation
2. **Consistent error handling** - asyncHandler wrapper cho async routes
3. **Helper functions** - excludePassword(), buildSafeFilterObject() giúp tái sử dụng
4. **Whitelist validation** - ALLOWED_FILTER_TYPES, ALLOWED_OPERATORS prevents injection
5. **Async/await throughout** - Không có callback hell

### 4.2 Issues

#### LOW: Over-commenting (Code bị "narrated")

```javascript
// server/app.js
// Load environment variables from .env files
// First tries server/.env, then falls back to project root .env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// bcryptjs - Library for hashing passwords securely
// Used for user authentication and password storage
const bcrypt = require('bcryptjs');
// express-fileupload - Middleware for handling file uploads
// Supports multipart/form-data for image uploads
const fileUpload = require("express-fileupload");
```

**Issue:** Comment mô tả những gì code làm, không phải TẠI SAO. Điều này làm code dài thêm ~50% nhưng không cung cấp giá trị.

**Recommendation:** Giữ comments chỉ cho logic phức tạp, business rules, hoặc non-obvious decisions.

#### MEDIUM: Code Duplication

```javascript
// server/controllers/products.js - getAllProducts có ~200 lines
// Customer mode và Admin mode xử lý trong cùng 1 function
// Nên tách thành 2 functions riêng biệt

// server/controllers/users.js - excludePassword xuất hiện nhiều lần
// Nên làm thành middleware hoặc serialize response
```

#### MEDIUM: Inconsistent Error Responses

```javascript
// server/controllers/customer_orders.js
// Mixed patterns:
// Pattern 1: throw new AppError(...)
// Pattern 2: return response.status(400).json({...})
// Nên thống nhất 1 pattern duy nhất
```

#### LOW: Missing TypeScript types ở Backend

```javascript
// Backend dùng JavaScript thuần, không có TypeScript
// server/controllers/products.js
const { id } = request.params;  // ⚠️ Không có type checking
const validatedPage = (page && page > 0) ? page : 1;  // ⚠️ Implicit any
```

#### LOW: Magic Numbers

```javascript
// server/controllers/products.js
take: 12,  // ⚠️ 12 products per page - nên đặt constant
take: 100, // ⚠️ 100 max - nên đặt constant

// server/controllers/customer_orders.js
const hashedPassword = await bcrypt.hash(password, 14);  // ⚠️ Magic number
// Nên: const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 14;
```

---

## 5. Performance Analysis

### 5.1 Database Optimization

**Good:**
- 40+ indexes trên các bảng chính (Product, Customer_order, User, etc.)
- Composite indexes: `@@index([categoryId, price])`, `@@index([categoryId, rating])`
- Pagination implemented trên hầu hết endpoints
- `Promise.all()` cho parallel queries

**Issues:**
```javascript
// server/controllers/products.js - Admin mode
// ⚠️ count() không có WHERE clause - sẽ count toàn bộ table
const [adminProducts, total] = await Promise.all([
  prisma.product.findMany({ skip, take, include: {...}, orderBy: {...} }),
  prisma.product.count()  // ⚠️ Nên là prisma.product.count({ where: {...} })
]);
```

### 5.2 Rate Limiting Configuration

| Endpoint | Limit | Window | Assessment |
|----------|-------|--------|------------|
| General | 300 req | 15 min | ✅ Reasonable |
| Auth | 300 attempts | 15 min | ⚠️ Too high (30/min recommended) |
| Register | 20 attempts | 1 hour | ✅ Good |
| Search | 300 req | 1 min | ⚠️ Too high (30/min recommended) |
| Upload | 300 req | 15 min | ✅ Good |

**Recommendations:**
- Auth limiter: Giảm xuống 10-30 attempts/15min
- Search limiter: Giảm xuống 30-60 requests/min

---

## 6. Database Schema Analysis

### 6.1 Design Patterns - GOOD

1. **Soft delete considerations** - Một số models có `status` field thay vì hard delete
2. **Price snapshots** - `priceAtPurchase`, `productNameSnapshot` trong Order_item
3. **Notification system** - Priority levels, metadata JSON field
4. **Multi-vendor support** - SubOrder model cho split orders

### 6.2 Schema Issues

```prisma
// prisma/schema.prisma
model Merchant {
  // ⚠️ Comment: "legacy - sellers now use User.shop fields"
  // NÊN xóa Merchant model hoàn toàn hoặc migrate data
}

model Customer_order {
  buyerId    String?  // ⚠️ Optional - order có thể không link đến user
  // NÊN: buyerId String (required) với customer orders bắt buộc đăng nhập
}

model Review {
  merchantId String  // ⚠️ Nên dùng sellerId để consistent với Product model
}
```

---

## 7. Frontend Analysis

### 7.1 Middleware (Next.js)

```typescript
// middleware.ts - Role-based access control
export default withAuth(
  function middleware(req) {
    if (path.startsWith("/admin")) {
      if (role !== "admin") return NextResponse.redirect(...);
    }
    // ...
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // ✅ Good: Token validation per route
      }
    }
  }
);
```

**Good:** Frontend middleware xử lý RBAC tốt, nhưng **backend không có tương đương**.

### 7.2 State Management (Zustand)

```typescript
// app/_zustand/store.ts
// ✅ Persisted to sessionStorage
// ✅ Multiple stores: cart, wishlist, notifications
// ✅ Type-safe với TypeScript
```

**Good:** Zustand stores được tổ chức tốt, có persistence.

---

## 8. Recommendations Summary

### Priority 1 (Critical - Security)

| # | Issue | Recommendation |
|---|-------|----------------|
| 1 | No auth on backend routes | Thêm JWT/session validation middleware |
| 2 | No authorization checks | Kiểm tra role trước khi xử lý admin operations |
| 3 | Sensitive data in logs | Loại bỏ console.log request bodies |

### Priority 2 (High - Functionality)

| # | Issue | Recommendation |
|---|-------|----------------|
| 4 | Order creation không tạo Order_item | Fix createCustomerOrder để tạo order items |
| 5 | Duplicate order detection yếu | Thêm cart hash hoặc transaction ID |
| 6 | Missing file upload validation | Thêm fileSize limits và type checking |

### Priority 3 (Medium - Code Quality)

| # | Issue | Recommendation |
|---|-------|----------------|
| 7 | Over-commenting | Giữ comments cho logic phức tạp |
| 8 | Code duplication | Extract common functions |
| 9 | Magic numbers | Sử dụng constants/env variables |
| 10 | Inconsistent error handling | Thống nhất 1 pattern |

### Priority 4 (Low - Optimization)

| # | Issue | Recommendation |
|---|-------|----------------|
| 11 | Rate limit too high | Giảm auth/search limits |
| 12 | count() không có WHERE | Thêm where clause |
| 13 | Legacy Merchant model | Migrate và xóa |
| 14 | Backend không có TypeScript | Migrate sang TypeScript |

---

## 9. Testing Recommendations

1. **Unit Tests** - Test validation functions, filter builders
2. **Integration Tests** - Test API endpoints với Supertest
3. **Security Tests** - Test unauthorized access attempts
4. **E2E Tests** - Playwright đã được install (package.json), nên viết tests

---

## 10. Conclusion

Dự án có **nền tảng kiến trúc tốt** với tech stack hiện đại. Tuy nhiên, **điểm yếu bảo mật nghiêm trọng** ở backend (thiếu authentication/authorization) cần được ưu tiên fix trước khi deploy production.

**Estimated effort:**
- Critical fixes: 2-3 days
- High priority fixes: 3-5 days
- Medium priority: 1-2 weeks
- Low priority: Ongoing

**Overall Assessment:** Dự án hoàn thành ~70% features với code quality ở mức 6.5/10. Cần cải thiện bảo mật và code organization trước khi production release.
