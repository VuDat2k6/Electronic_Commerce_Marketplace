# TFDTRONIC Electronics eCommerce Shop — Development Guide

> **Mục đích**: Tài liệu hướng dẫn phát triển toàn diện cho project TFDTRONIC. AI sẽ dựa vào file này để viết code nhất quán và chính xác.

---

## Mục lục

1. [Tổng quan Project](#1-tổng-quan-project)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Quy tắc cơ bản](#3-quy-tắc-cơ-bản)
4. [Frontend (Next.js)](#4-frontend-nextjs)
5. [Authentication (NextAuth)](#5-authentication-nextauth)
6. [Styling (Tailwind CSS)](#6-styling-tailwind-css)
7. [Components](#7-components)
8. [API Client & Config](#8-api-client--config)
9. [State Management (Zustand)](#8-state-management-zustand)
10. [Backend (Node.js/Express)](#9-backend-nodejsexpress)
11. [Database (Prisma + MySQL)](#10-database-prisma--mysql)
12. [Các tính năng chính](#11-các-tính-năng-chính)
13. [Logging & Monitoring](#12-logging--monitoring)
14. [Security](#13-security)
15. [Testing](#14-testing)
16. [Deployment](#15-deployment)

---

## 1. Tổng quan Project

### 1.1 Thông tin cơ bản

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên project** | TFDTRONIC Electronics eCommerce Shop |
| **Mô tả** | Cửa hàng thương mại điện tử bán các sản phẩm điện tử |
| **Kiểu** | Multi-vendor eCommerce Platform |
| **Framework Frontend** | Next.js 15 (App Router) |
| **Framework Backend** | Node.js + Express |
| **Database** | MySQL + Prisma ORM |
| **Ngôn ngữ** | TypeScript (Frontend), JavaScript (Backend) |

### 1.2 Công nghệ sử dụng

#### Frontend Dependencies

```json
{
  "@headlessui/react": "^1.7.18",
  "@prisma/client": "^6.16.1",
  "@tailwindcss/forms": "^0.5.7",
  "@tailwindcss/typography": "^0.5.10",
  "bcryptjs": "^2.4.3",
  "date-fns": "^4.1.0",
  "dompurify": "^3.0.8",
  "express-fileupload": "^1.5.0",
  "express-rate-limit": "^8.1.0",
  "flowbite-react": "^0.7.2",
  "nanoid": "^5.0.6",
  "next": "^15.5.3",
  "next-auth": "^4.24.11",
  "react": "^18.3.1",
  "react-apexcharts": "^1.4.1",
  "react-dom": "^18.3.1",
  "react-hot-toast": "^2.4.1",
  "react-icons": "^5.0.1",
  "react-slick": "^0.30.2",
  "slick-carousel": "^1.8.1",
  "zod": "^3.22.4",
  "zustand": "^4.5.1"
}
```

#### Backend Dependencies

```json
{
  "@prisma/client": "6.16.3",
  "axios": "^1.12.1",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "csv-parse": "^5.6.0",
  "express": "^4.18.3",
  "express-fileupload": "^1.4.0",
  "form-data": "^4.0.4",
  "morgan": "^1.10.1",
  "mysql": "^2.18.1",
  "nanoid": "^5.0.6",
  "prisma": "6.16.3",
  "node-fetch": "^3.3.2",
  "winston": "^3.8.2"
}
```

---

## 2. Cấu trúc thư mục

```
marketplace/
├── app/                          # Next.js App Router (Frontend)
│   ├── (auth)/                   # Authentication pages
│   ├── (main)/                  # Main pages
│   ├── (dashboard)/              # Admin dashboard group
│   │   └── admin/              # Admin dashboard pages (users, categories, products, orders, sellers)
│   ├── (seller)/seller/          # Seller dashboard group (protected, role=seller)
│   │   ├── dashboard/          # Dashboard & thống kê
│   │   ├── analytics/          # Phân tích & biểu đồ
│   │   ├── products/           # Quản lý sản phẩm
│   │   ├── orders/            # Quản lý đơn hàng
│   │   ├── vouchers/          # Quản lý voucher
│   │   ├── bulk-upload/       # Import CSV hàng loạt
│   │   └── settings/          # Cài đặt shop
│   ├── account/orders/           # User orders page
│   ├── api/                      # Next.js API routes
│   │   ├── auth/[...nextauth]/   # NextAuth routes
│   │   ├── customer-orders/      # Order checkout
│   │   └── account/orders/       # Account orders
│   ├── cart/                     # Cart page
│   ├── checkout/                 # Checkout page
│   ├── notifications/            # Notifications page
│   ├── product/[productSlug]/    # Product detail
│   ├── search/                   # Search page
│   ├── seller/[sellerId]/        # Public seller shop page
│   ├── shop/                     # Shop/category page
│   ├── become-seller/            # Trang đăng ký seller
│   └── _zustand/                 # Zustand stores 
│       ├── store.ts             # Cart store
│       ├── wishlistStore.ts     # Wishlist store
│       ├── notificationStore.ts  # Notification store
│       ├── sortStore.ts         # Sort store
│       └── paginationStore.ts   # Pagination store
├── components/                   # React components
│   ├── Header.tsx               # Header navigation
│   ├── Footer.tsx               # Footer
│   ├── Products.tsx             # Products grid
│   ├── ProductItem.tsx          # Product card
│   ├── Filters.tsx              # Filter sidebar
│   ├── SortBy.tsx               # Sort dropdown
│   ├── Pagination.tsx           # Pagination
│   ├── modules/                 # Module components
│   │   ├── cart/index.tsx       # Cart module (nhóm theo merchant)
│   │   └── wishlist/index.tsx   # Wishlist module
│   └── *.tsx                    # Other UI components
├── lib/                          # Libraries
│   ├── api.ts                   # API client (quan trọng)
│   ├── config.ts                # Config (API base URL)
│   ├── prisma.ts                # Prisma client singleton
│   └── sanitize.ts              # XSS protection
├── server/                       # Express Backend
│   ├── app.js                   # Express entry point
│   ├── routes/                  # API routes
│   ├── services/               # Business logic
│   │   └── order.service.ts    # Order service (quan trọng)
│   ├── middlewares/             # Middlewares
│   └── utils/                  # Utilities
├── types/                        # TypeScript types
│   └── notification.ts          # Notification types
├── prisma/                       # Database
│   └── schema.prisma            # Prisma schema
└── public/                       # Static assets
```

---

## 3. Quy tắc cơ bản

### 3.1 Quy tắc đặt tên

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Components | PascalCase | `ProductCard.tsx`, `Header.tsx` |
| Pages | camelCase hoặc kebab-case | `productDetails.tsx`, `my-orders.tsx` |
| Utilities/Helpers | camelCase | `formatCurrency.ts`, `validation.ts` |
| Database tables | snake_case | `customer_order`, `sub_order` |
| API Routes | kebab-case | `/api/products`, `/api/user-orders` |
| CSS Classes | Tailwind utilities | `className="flex items-center gap-4"` |
| Variables | camelCase | `productList`, `totalPrice` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `ProductProps`, `OrderStatus` |

### 3.2 Import Paths

Luôn sử dụng path alias `@/` thay vì relative paths:

```typescript
// ✅ Đúng
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import apiClient from "@/lib/api";

// ❌ Sai
import { Button } from "../../../components/ui/Button";
```

### 3.3 TypeScript Rules

```typescript
// ✅ Sử dụng interface cho object shapes
interface Product {
  id: string;
  title: string;
  price: number;
  mainImage: string;
  slug: string;
}

// ✅ Sử dụng type cho unions/aliases
type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

// ✅ Luôn định nghĩa kiểu cho props
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

// ✅ Sử dụng optional chaining
const productName = product?.name ?? "Unknown";

// ✅ Sử dụng nullish coalescing
const displayPrice = price ?? 0;
```

### 3.4 Error Handling

```typescript
// ✅ Luôn handle loading và error states
async function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage message={error} />;
  return <ProductGrid products={products} />;
}
```

---

## 4. Frontend (Next.js)

### 4.1 Server vs Client Components

```typescript
// ✅ Server Component - mặc định cho data fetching
// app/product/[productSlug]/page.tsx
async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await apiClient.get(`/api/slugs/${params.slug}`);
  const product = await data.json();

  if (!product || product.error) {
    notFound();
  }

  return <ProductDetails product={product} />;
}

// ✅ Client Component - khi cần interactivity
"use client";
import { useState } from "react";
import { useProductStore } from "@/app/flash/store";

export function AddToCartButton({ product }: { product: any }) {
  const [loading, setLoading] = useState(false);
  const addToCart = useProductStore((state) => state.addToCart);

  async function handleAdd() {
    setLoading(true);
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.mainImage,
      amount: 1,
      merchantId: product.merchantId,
      merchantName: product.merchant?.name,
      slug: product.slug,
    });
    setLoading(false);
  }

  return (
    <button onClick={handleAdd} disabled={loading}>
      {loading ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

### 4.2 API Routes (Next.js)

```typescript
// app/api/customer-orders/checkout/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId } = body;

    const response = await fetch(`${config.apiBaseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    return Response.json(result, { status: response.status });
  } catch (error) {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
```

### 4.3 Checkout Page Pattern

```typescript
// app/checkout/page.tsx
"use client";
import { useState } from "react";
import { useProductStore } from "@/app/flash/store";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { products, getCartGroups, clearCart, total } = useProductStore();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", ... });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push("Invalid email address");
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
      return;
    }

    setLoading(true);
    try {
      const cartGroups = getCartGroups();
      const items = cartGroups.flatMap(g => g.items.map(i => ({
        productId: i.id,
        quantity: i.amount,
        unitPrice: i.price,
        merchantId: i.merchantId,
      })));

      const response = await fetch("/api/customer-orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, items }),
      });

      const result = await response.json();
      if (result.success) {
        clearCart();
        toast.success("Order placed successfully!");
      } else {
        toast.error(result.message || "Order failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1>Checkout</h1>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "Place Order"}
      </button>
    </div>
  );
}
```

---

## 5. Authentication (NextAuth)

### 5.1 NextAuth Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 5.2 Protected Route Hook

```typescript
// Sử dụng trong Client Component
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(requireAdmin = false) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (requireAdmin && session.user.role !== "admin") {
      router.push("/");
      return;
    }
  }, [session, status, router, requireAdmin]);

  return { session, status, isLoading: status === "loading" };
}
```

---

## 6. Styling (Tailwind CSS)

### 6.1 Component Styling Pattern

```tsx
// ✅ Group related classes
<button
  className="
    flex items-center justify-center
    px-4 py-2 gap-2
    text-sm font-medium
    bg-primary text-white
    hover:bg-primary-dark
    rounded-lg shadow-sm
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  Button Text
</button>

// ✅ Responsive
<div className="
  grid grid-cols-1 gap-4 p-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
">
  {/* Content */}
</div>
```

### 6.2 Common Patterns

```tsx
// Card component
<div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">

// Form input
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-lg
             focus:ring-2 focus:ring-primary focus:border-transparent
             disabled:bg-gray-100 disabled:cursor-not-allowed"
/>

// Loading state
<button disabled={loading} className="opacity-50 cursor-not-allowed">
  {loading && <Spinner />}
  Submit
</button>
```

---

## 7. Components

### 7.1 Cart Module (`components/modules/cart/index.tsx`)

```tsx
// components/modules/cart/index.tsx
"use client";
import { useProductStore } from "@/app/flash/store";
import { FaStore } from "react-icons/fa";

export function CartModule() {
  const { getCartGroups, removeFromCart, updateCartAmount, total } = useProductStore();
  const cartGroups = getCartGroups();

  const estimatedShipping = cartGroups.length * 500; // cents
  const subtotal = total;
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + estimatedShipping + tax;

  return (
    <div className="space-y-6">
      {cartGroups.map((group: CartGroup) => (
        <div key={group.merchantId} className="mb-6">
          {/* Merchant Header */}
          <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
            <FaStore className="text-blue-500" />
            <span className="font-medium">{group.merchantName}</span>
          </div>

          {/* Product List */}
          <ul className="divide-y divide-gray-200">
            {group.items.map((product) => (
              <li key={product.id} className="p-4 flex gap-4">
                <img src={product.image} alt={product.title} className="w-20 h-20 object-cover" />
                <div className="flex-1">
                  <h4 className="font-medium">{product.title}</h4>
                  <p className="text-gray-500">${product.price / 100}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateCartAmount(product.id, product.amount - 1)}>-</button>
                    <span>{product.amount}</span>
                    <button onClick={() => updateCartAmount(product.id, product.amount + 1)}>+</button>
                    <button onClick={() => removeFromCart(product.id)} className="text-red-500">Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Subtotal */}
          <div className="p-4 bg-gray-50">
            <span>Subtotal: ${group.subtotal / 100}</span>
          </div>
        </div>
      ))}

      {/* Grand Total */}
      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>${subtotal / 100}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Shipping</span>
          <span>${estimatedShipping / 100}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Tax</span>
          <span>${tax / 100}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${grandTotal / 100}</span>
        </div>
      </div>
    </div>
  );
}
```

### 7.2 Header Component Pattern (`components/Header.tsx`)

```tsx
// components/Header.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useProductStore } from "@/app/flash/store";

const Header = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { allQuantity } = useProductStore();

  const isAdmin = pathname.startsWith("/admin");
  const isSeller = pathname.startsWith("/seller");

  return (
    <header>
      {isAdmin ? (
        // Admin Navigation
        <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
          <Link href="/admin">Admin Dashboard</Link>
          <div className="flex gap-4">
            <Link href="/admin/products">Products</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/users">Users</Link>
          </div>
        </div>
      ) : (
        // Main Navigation
        <div className="flex items-center justify-between p-4 bg-white shadow">
          <Link href="/">TFDTRONIC</Link>
          <nav className="flex gap-4">
            <Link href="/shop">Shop</Link>
            <Link href="/cart">Cart ({allQuantity})</Link>
            {status === "authenticated" ? (
              <>
                <Link href="/account">Account</Link>
                <Link href="/notifications">Notifications</Link>
              </>
            ) : (
              <Link href="/login">Login</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
```

---



### 8.1 Config (`lib/config.ts`)

```typescript
// lib/config.ts
const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
};
export default config;
```

### 8.2 API Client (`lib/api.ts`)

Pattern đơn giản và hiệu quả:

```typescript
// lib/api.ts
import config from './config';

export const apiClient = {
  baseUrl: config.apiBaseUrl,

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions: RequestInit = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
    };
    return fetch(url, { ...defaultOptions, ...options });
  },

  get: (endpoint: string, options?: RequestInit) =>
    this.request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, data?: any, options?: RequestInit) =>
    this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (endpoint: string, data?: any, options?: RequestInit) =>
    this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    this.request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
```

### 8.3 Sử dụng API Client

```typescript
// Trong Server Component hoặc API Route
import apiClient from "@/lib/api";

// GET request
const response = await apiClient.get('/api/products');
const data = await response.json();

// POST request
const result = await apiClient.post('/api/orders', { items: [...] });
const order = await result.json();

// Với async/await trong components
async function fetchProducts() {
  try {
    const res = await apiClient.get('/api/products?page=1&limit=10');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
```

### 8.4 Prisma Client Singleton (`lib/prisma.ts`)

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### 8.5 Sanitize (`lib/sanitize.ts`)

XSS protection cho client và server:

```typescript
// lib/sanitize.ts
import DOMPurify from "dompurify";

export function sanitize(text: string | null | undefined): string {
  if (!text) return '';

  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      FORBID_TAGS: ['script', 'img', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
    });
  }

  // Server-side: HTML entity escaping
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

---

## 9. Backend (Node.js/Express)

### 9.1 Server Entry Point (`server/app.js`)

```javascript
// server/app.js
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const requestLogger = require("./middleware/requestLogger");
const rateLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./utills/errorHandler");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/customer_orders");
const usersRouter = require("./routes/users");
const categoriesRouter = require("./routes/category");
const merchantsRouter = require("./routes/merchant");
const vouchersRouter = require("./routes/voucher");
const reviewsRouter = require("./routes/review");
const wishlistRouter = require("./routes/wishlist");
const notificationsRouter = require("./routes/notifications");
const bulkUploadRouter = require("./routes/bulkUpload");
const searchRouter = require("./routes/search");
const slugsRouter = require("./routes/slugs");
const sellerOrdersRouter = require("./routes/sellerOrders");

const app = express();

// Middlewares
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(requestLogger);
app.use(rateLimiter);

// Routes
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/vouchers", vouchersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/bulk-upload", bulkUploadRouter);
app.use("/api/search", searchRouter);
app.use("/api/slugs", slugsRouter);
app.use("/api/seller/orders", sellerOrdersRouter);

// Error Handler
app.use(errorHandler);

module.exports = app;
```

### 9.2 Order Service (`server/services/order.service.ts`)

Đây là service quan trọng nhất, xử lý logic tạo đơn hàng với multi-vendor:

```typescript
// server/services/order.service.ts
import { prisma } from "../../lib/prisma";

// Interfaces
export interface CheckoutPayloadItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  merchantId?: string;
}

export interface CreateCustomerOrderInput {
  name?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  company?: string;
  adress?: string;
  apartment?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  orderNotice?: string;
  customerId?: string;
  items: CheckoutPayloadItem[];
  voucherCodes?: string[];
}

// Derive parent order status từ sub-order statuses
function deriveParentOrderStatus(subOrderStatuses: string[]): string {
  if (subOrderStatuses.length === 0) return "PENDING";
  const allDelivered = subOrderStatuses.every(s => s === "DELIVERED");
  if (allDelivered) return "COMPLETED";
  const allCancelled = subOrderStatuses.every(s => s === "CANCELLED");
  if (allCancelled) return "CANCELLED";
  // ... thêm logic khác
  return "PENDING";
}

// Tạo đơn hàng với Prisma Transaction
async function createCustomerOrder(input: CreateCustomerOrderInput) {
  // 1. Lấy thông tin sản phẩm
  const productIds = input.items.map(item => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map(p => [p.id, p]));

  // 2. Nhóm sản phẩm theo merchant
  const merchantGroups = new Map<string, any[]>();
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    const merchantId = item.merchantId || product?.merchantId || "default";
    if (!merchantGroups.has(merchantId)) {
      merchantGroups.set(merchantId, []);
    }
    merchantGroups.get(merchantId)!.push({ ...item, product });
  }

  // 3. Tạo đơn hàng trong transaction
  const createdOrder = await prisma.$transaction(async (tx) => {
    // Tạo parent order
    const order = await tx.customer_order.create({
      data: { ... }
    });

    // Tạo sub-orders cho mỗi merchant
    for (const [merchantId, items] of merchantGroups.entries()) {
      const subOrder = await tx.subOrder.create({
        data: {
          parentOrderId: order.id,
          merchantId,
          status: "PENDING",
          subTotal: items.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0),
        }
      });

      // Tạo SubOrderProduct với snapshot
      for (const item of items) {
        await tx.subOrderProduct.create({
          data: {
            subOrderId: subOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            productNameSnapshot: item.product.title,
            productImageSnapshot: item.product.mainImage,
            unitPriceSnapshot: item.unitPrice || item.product.price,
          }
        });

        // Trừ stock
        await tx.product.update({
          where: { id: item.productId },
          data: { inStock: { decrement: item.quantity } },
        });
      }
    }

    return order;
  });

  return createdOrder;
}
```

### 9.3 Middlewares

```javascript
// server/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many requests" }
});

module.exports = limiter;
```

### 9.4 Routes Structure

```
server/routes/
├── products.js          # CRUD sản phẩm
├── customer_orders.js   # Đơn hàng khách hàng
├── users.js            # Quản lý users
├── category.js         # Danh mục
├── merchant.js         # Merchant
├── voucher.js          # Mã giảm giá
├── review.js           # Đánh giá
├── wishlist.js         # Wishlist
├── notifications.js    # Thông báo
├── bulkUpload.js       # Import hàng loạt
├── search.js           # Tìm kiếm
├── slugs.js            # Slug lookup
└── sellerOrders.js     # Đơn hàng seller
```

---

## 6. Database (Prisma + MySQL)

### 6.1 Schema Overview

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================
// PRODUCT MODEL - Sản phẩm
// ============================================
model Product {
  id           String   @id @default(uuid())
  slug         String   @unique
  title        String
  mainImage    String
  price        Int      @default(0)         // Lưu theo đơn vị nhỏ nhất (VD: cents)
  rating       Int      @default(0)          // 0-5 sao
  description  String
  manufacturer String
  inStock      Int      @default(1)
  status       String   @default("DRAFT")    // DRAFT, PUBLISHED, ARCHIVED
  categoryId   String
  category     Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  merchantId   String
  merchant     Merchant @relation(fields: [merchantId], references: [id])
  
  // Relations
  Wishlist        Wishlist[]
  reviews         Review[]
  subOrderProducts SubOrderProduct[]
  bulkUploadItems bulk_upload_item[] @relation("ProductBulkItems")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([categoryId])
  @@index([merchantId])
  @@index([status])
  @@index([price])
  @@map("products")
}

// ============================================
// IMAGE MODEL - Hình ảnh sản phẩm
// ============================================
model Image {
  imageID   String @id @default(uuid())
  productID String
  image     String
}

// ============================================
// USER MODEL - Người dùng
// ============================================
model User {
  id            String   @id @default(uuid())
  email        String   @unique
  password     String?   // Nullable cho social login
  role         String   @default("user")  // user, admin

  // Relations
  Wishlist      Wishlist[]
  notifications Notification[]
  reviews       Review[]
  voucherUsages VoucherUsage[]
  bulkUploadBatches bulk_upload_batch[] @relation("UserBatches")
}

// ============================================
// CUSTOMER_ORDER MODEL - Đơn hàng chính
// ============================================
model Customer_order {
  id          String    @id @default(uuid())
  name        String
  lastname    String
  phone       String
  email       String
  company     String
  adress      String
  apartment   String
  postalCode  String
  city        String
  country     String
  orderNotice String?
  status      String    @default("PENDING")  // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  total       Int       // Tổng tiền (cents)
  dateTime    DateTime  @default(now())

  // Relations
  subOrders SubOrder[]
  payments  Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ============================================
// SUB_ORDER MODEL - Đơn hàng con (theo merchant)
// ============================================
model SubOrder {
  id               String   @id @default(uuid())
  parentOrderId    String
  parentOrder      Customer_order @relation(fields: [parentOrderId], references: [id], onDelete: Cascade)
  merchantId       String
  merchant         Merchant @relation(fields: [merchantId], references: [id])
  status           String   @default("PENDING")  // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  subTotal         Int      @default(0)
  shippingTotal    Int      @default(0)
  trackingNumber   String?
  shippingProvider String?
  shippedAt        DateTime?
  deliveredAt      DateTime?
  confirmedAt      DateTime?
  cancelledAt      DateTime?
  cancelReason     String?

  // Relations
  products SubOrderProduct[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([parentOrderId])
  @@index([merchantId])
  @@index([status])
}

// ============================================
// SUB_ORDER_PRODUCT MODEL - Sản phẩm trong sub-order
// ============================================
model SubOrderProduct {
  id                  String  @id @default(uuid())
  subOrderId          String
  subOrder            SubOrder @relation(fields: [subOrderId], references: [id], onDelete: Cascade)
  productId           String
  product             Product  @relation(fields: [productId], references: [id])
  quantity            Int

  // Snapshot fields - Lưu thông tin tại thời điểm đặt hàng
  productNameSnapshot  String
  productImageSnapshot String?
  unitPriceSnapshot    Int
  merchantIdSnapshot   String
  merchantNameSnapshot String

  @@index([subOrderId])
  @@index([productId])
}

// ============================================
// CATEGORY MODEL - Danh mục
// ============================================
model Category {
  id       String    @id @default(uuid())
  name     String    @unique
  products Product[]

  @@map("categories")
}

// ============================================
// WISHLIST MODEL - Danh sách yêu thích
// ============================================
model Wishlist {
  id        String  @id @default(uuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([productId, userId])
}

// ============================================
// MERCHANT MODEL - Người bán/Cửa hàng
// ============================================
model Merchant {
  id          String   @id @default(uuid())
  name        String
  description String?
  email       String?
  phone       String?
  address     String?
  status      String   @default("ACTIVE")  // ACTIVE, INACTIVE, SUSPENDED
  shippingFee Int      @default(0)
  avatar      String?
  banner      String?

  // Relations
  products    Product[]
  subOrders   SubOrder[]
  vouchers    Voucher[]
  reviews     Review[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ============================================
// REVIEW MODEL - Đánh giá sản phẩm
// ============================================
model Review {
  id         String   @id @default(uuid())
  rating     Int      // 1-5 sao
  comment    String?  @db.Text
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  merchantId String
  merchant   Merchant @relation(fields: [merchantId], references: [id])
  orderId    String?
  status     String   @default("PUBLISHED")  // PUBLISHED, HIDDEN, FLAGGED

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@index([merchantId])
  @@index([rating])
}

// ============================================
// VOUCHER MODEL - Mã giảm giá
// ============================================
model Voucher {
  id            String    @id @default(uuid())
  code          String    @unique
  title         String
  description   String?   @db.Text
  discountType  String    // PERCENTAGE, FIXED
  discountValue Int       // % (1-100) hoặc số tiền (cents)
  merchantId    String?
  merchant      Merchant? @relation(fields: [merchantId], references: [id], onDelete: SetNull)
  minOrderValue Int?      // Số tiền tối thiểu (cents)
  maxDiscount   Int?      // Giảm tối đa (cents)
  usageLimit    Int?
  usedCount     Int       @default(0)
  perUserLimit  Int       @default(1)
  startsAt      DateTime  @default(now())
  expiresAt     DateTime
  isActive      Boolean   @default(true)

  usages VoucherUsage[]

  @@index([code])
  @@index([merchantId])
  @@index([isActive])
}

// ============================================
// NOTIFICATION MODEL - Thông báo
// ============================================
model Notification {
  id        String               @id @default(uuid())
  userId    String
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String               @db.Text
  type      NotificationType
  isRead    Boolean              @default(false)
  priority  NotificationPriority @default(NORMAL)
  metadata  Json?
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt

  @@index([userId])
  @@index([userId, isRead])
  @@index([userId, type])
}

enum NotificationType {
  ORDER_UPDATE
  PAYMENT_STATUS
  PROMOTION
  SYSTEM_ALERT
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// ============================================
// BULK_UPLOAD MODELS - Import hàng loạt
// ============================================
model bulk_upload_batch {
  id        String          @id @default(uuid())
  fileName  String?
  status    BulkUploadStatus @default(PENDING)
  itemCount Int             @default(0)
  errorCount Int            @default(0)
  userId    String?
  user      User?           @relation(name: "UserBatches", fields: [userId], references: [id])

  items bulk_upload_item[]

  createdAt DateTime @default(now())
}

model bulk_upload_item {
  id        String              @id @default(uuid())
  batchId   String
  batch     bulk_upload_batch   @relation(fields: [batchId], references: [id], onDelete: Cascade)
  productId String?
  product   Product?           @relation(name: "ProductBulkItems", fields: [productId], references: [id], onDelete: SetNull)

  // Snapshot fields
  title         String
  slug          String
  price         Int
  manufacturer  String?
  description   String?
  mainImage     String?
  categoryId    String
  inStock       Int

  status BulkUploadItemStatus @default(CREATED)
  error  String?
}

enum BulkUploadStatus {
  PENDING
  COMPLETED
  PARTIAL
  FAILED
}

enum BulkUploadItemStatus {
  CREATED
  UPDATED
  ERROR
}
```

### 6.2 Prisma Client

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### 6.3 Migration Commands

```bash
# Tạo migration mới
npx prisma migrate dev --name add_new_field

# Apply migration
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Studio (GUI)
npx prisma studio
```

---

## 7. API Development

### 7.1 RESTful Conventions

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/products` | Lấy danh sách |
| GET | `/api/products/:id` | Lấy chi tiết |
| POST | `/api/products` | Tạo mới |
| PUT | `/api/products/:id` | Cập nhật toàn phần |
| PATCH | `/api/products/:id` | Cập nhật từng phần |
| DELETE | `/api/products/:id` | Xóa |

### 7.2 Response Format

```typescript
// Success Response
{
  success: true,
  data: { ... },
  message?: "Operation successful"
}

// With pagination
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}

// Error Response
{
  success: false,
  message: "Error description",
  errors?: [
    { field: "email", message: "Email is required" }
  ]
}
```

### 7.3 API Routes Table

#### Products

| Route | Method | Mô tả |
|-------|--------|--------|
| `/api/products` | GET | Lấy tất cả sản phẩm |
| `/api/products` | POST | Tạo sản phẩm |
| `/api/products/:id` | GET | Chi tiết sản phẩm |
| `/api/products/:id` | PUT | Cập nhật sản phẩm |
| `/api/products/:id` | DELETE | Xóa sản phẩm |
| `/api/search` | GET | Tìm kiếm sản phẩm |
| `/api/slugs/:slug` | GET | Lấy sản phẩm qua slug |
| `/api/images/:id` | GET/POST/PUT/DELETE | Quản lý hình ảnh |

#### Orders

| Route | Method | Mô tả |
|-------|--------|--------|
| `/api/orders` | GET | Lấy danh sách đơn hàng |
| `/api/orders` | POST | Tạo đơn hàng |
| `/api/orders/:id` | GET | Chi tiết đơn hàng |
| `/api/orders/:id` | PUT | Cập nhật đơn hàng |
| `/api/orders/:id` | DELETE | Xóa đơn hàng |
| `/api/seller/orders` | GET | Sub-orders của seller |
| `/api/seller/orders/:id/status` | PUT | Cập nhật trạng thái |

#### Users

| Route | Method | Mô tả |
|-------|--------|--------|
| `/api/users` | GET | Lấy danh sách users |
| `/api/users` | POST | Tạo user |
| `/api/users/:id` | GET | Chi tiết user |
| `/api/users/:id` | PUT | Cập nhật user |
| `/api/users/:id` | DELETE | Xóa user |
| `/api/users/email/:email` | GET | Tìm user qua email |

#### Vouchers

| Route | Method | Mô tả |
|-------|--------|--------|
| `/api/vouchers` | GET/POST | Lấy/tạo vouchers |
| `/api/vouchers/validate` | POST | Kiểm tra voucher |
| `/api/vouchers/apply` | POST | Áp dụng voucher |
| `/api/vouchers/:id` | PUT/DELETE | Cập nhật/xóa |

#### Reviews

| Route | Method | Mô tả |
|-------|--------|--------|
| `/api/reviews/product/:productId` | GET | Reviews sản phẩm |
| `/api/reviews/stats/:productId` | GET | Thống kê rating |
| `/api/reviews` | POST | Tạo review |
| `/api/reviews/:id` | DELETE | Xóa review |

#### Notifications

| Route | Method | Mô tả |
|-------|--------|--------|
| `/api/notifications/:userId` | GET | Thông báo user |
| `/api/notifications/:userId/unread-count` | GET | Số chưa đọc |
| `/api/notifications` | POST | Tạo thông báo |
| `/api/notifications/mark-read` | POST | Đánh dấu đã đọc |
| `/api/notifications/:id` | PUT/DELETE | Cập nhật/xóa |

---

## 8. State Management (Zustand)

> **Vị trí**: Tất cả stores nằm trong `app/flash/`

### 8.1 Cart Store (`app/flash/store.ts`)

Đây là store quan trọng nhất, quản lý giỏ hàng với các tính năng:

| Tính năng | Chi tiết |
|-----------|----------|
| Persistence | Sử dụng `sessionStorage` qua `createJSONStorage` |
| Nhóm theo Merchant | `getCartGroups()` trả về `CartGroup[]` |
| Tự động tính tổng | `allQuantity`, `total` được cập nhật tự động |
| TypeScript | Đầy đủ types cho State và Actions |

```typescript
// app/flash/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Types
export type ProductInCart = {
  id: string;
  title: string;
  price: number;
  image: string;
  amount: number;
  merchantId?: string;
  merchantName?: string;
  slug?: string;
};

export type CartGroup = {
  merchantId: string;
  merchantName: string;
  items: ProductInCart[];
  subtotal: number;
};

export type State = {
  products: ProductInCart[];
  allQuantity: number;
  total: number;
};

export type Actions = {
  addToCart: (newProduct: ProductInCart) => void;
  removeFromCart: (id: string) => void;
  updateCartAmount: (id: string, quantity: number) => void;
  calculateTotals: () => void;
  clearCart: () => void;
  getCartGroups: () => CartGroup[];
};

// Implementation pattern
export const useProductStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      products: [],
      allQuantity: 0,
      total: 0,

      addToCart: (newProduct) => {
        set((state) => {
          const existing = state.products.find(item => item.id === newProduct.id);
          if (!existing) {
            return { products: [...state.products, newProduct] };
          }
          // Cập nhật số lượng nếu đã tồn tại
          const updated = state.products.map(p =>
            p.id === newProduct.id ? { ...p, amount: p.amount + newProduct.amount } : p
          );
          return { products: updated };
        });
        get().calculateTotals();
      },

      calculateTotals: () => {
        set((state) => {
          const amount = state.products.reduce((sum, p) => sum + p.amount, 0);
          const total = state.products.reduce((sum, p) => sum + p.amount * p.price, 0);
          return { allQuantity: amount, total };
        });
      },

      getCartGroups: () => {
        const state = get();
        const groupsMap = new Map<string, CartGroup>();

        for (const item of state.products) {
          const merchantId = item.merchantId || "default";
          if (!groupsMap.has(merchantId)) {
            groupsMap.set(merchantId, {
              merchantId,
              merchantName: item.merchantName || "Unknown Shop",
              items: [],
              subtotal: 0,
            });
          }
          const group = groupsMap.get(merchantId)!;
          group.items.push(item);
          group.subtotal += item.amount * item.price;
        }
        return Array.from(groupsMap.values());
      },
      // ... các actions khác
    }),
    { name: "products-storage", storage: createJSONStorage(() => sessionStorage) }
  )
);

// Sử dụng trong component
const { products, addToCart, getCartGroups } = useProductStore();
const groups = getCartGroups();
```

### 8.2 Wishlist Store (`app/flash/wishlistStore.ts`)

```typescript
// app/flash/wishlistStore.ts
export type ProductInWishlist = {
  id: string;
  title: string;
  price: number;
  image: string;
};

export type State = {
  wishlist: ProductInWishlist[];
  wishQuantity: number;
};

export type Actions = {
  addToWishlist: (product: ProductInWishlist) => void;
  removeFromWishlist: (id: string) => void;
  setWishlist: (wishlist: ProductInWishlist[]) => void;
};

export const useWishlistStore = create<State & Actions>((set) => ({
  wishlist: [],
  wishQuantity: 0,

  addToWishlist: (product) => {
    set((state) => {
      const exists = state.wishlist.find(item => product.id === item.id);
      if (!exists) {
        return {
          wishlist: [...state.wishlist, product],
          wishQuantity: state.wishlist.length + 1,
        };
      }
      return { wishlist: state.wishlist };
    });
  },

  removeFromWishlist: (id) => {
    set((state) => {
      const newList = state.wishlist.filter(item => item.id !== id);
      return { wishlist: newList, wishQuantity: newList.length };
    });
  },
}));
```

### 8.3 Notification Store (`app/flash/notificationStore.ts`)

Store phức tạp nhất với pagination và multi-select:

```typescript
// app/flash/notificationStore.ts
import { Notification, NotificationFilters, NotificationResponse } from '@/types/notification';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: NotificationFilters;
  selectedIds: string[];

  // Actions
  setNotifications: (response: NotificationResponse) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearNotifications: () => void;
}

// Pattern: Tự động cập nhật unreadCount khi thay đổi
deleteNotification: (id: string) =>
  set(state => {
    const notification = state.notifications.find(n => n.id === id);
    const wasUnread = notification && !notification.isRead;
    return {
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      total: Math.max(0, state.total - 1),
      selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
    };
  }),
```

### 8.4 Sort Store & Pagination Store

```typescript
// app/flash/sortStore.ts
export const useSortStore = create<{ sortBy: string; changeSortBy: (mode: string) => void }>(
  (set) => ({
    sortBy: "defaultSort",
    changeSortBy: (mode) => set({ sortBy: mode }),
  })
);

// app/flash/paginationStore.ts
export const usePaginationStore = create<{ page: number; incrementPage: () => void; decrementPage: () => void }>(
  (set) => ({
    page: 1,
    incrementPage: () => set(state => ({ page: state.page + 1 })),
    decrementPage: () => set(state => ({ page: Math.max(1, state.page - 1) })),
  })
);
```

### 8.5 Notification Types (`types/notification.ts`)

```typescript
// types/notification.ts
export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_STATUS = 'PAYMENT_STATUS',
  PROMOTION = 'PROMOTION',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  priority: NotificationPriority;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}
```

### 8.6 Sử dụng Stores trong Components

```typescript
// Component sử dụng cart store
"use client";
import { useProductStore } from "@/app/flash/store";
import { useWishlistStore } from "@/app/flash/wishlistStore";

export function CartModule() {
  const { products, getCartGroups, removeFromCart, updateCartAmount, total } = useProductStore();
  const { wishlist, removeFromWishlist } = useWishlistStore();

  const cartGroups = getCartGroups();

  return (
    <div>
      {cartGroups.map((group) => (
        <div key={group.merchantId}>
          <h3>{group.merchantName}</h3>
          {group.items.map((item) => (
            <div key={item.id}>
              <span>{item.title}</span>
              <button onClick={() => updateCartAmount(item.id, item.amount - 1)}>-</button>
              <span>{item.amount}</span>
              <button onClick={() => updateCartAmount(item.id, item.amount + 1)}>+</button>
              <button onClick={() => removeFromCart(item.id)}>Remove</button>
            </div>
          ))}
          <div>Subtotal: ${group.subtotal / 100}</div>
        </div>
      ))}
      <div>Total: ${total / 100}</div>
    </div>
  );
}
```

---

## 9. Authentication (NextAuth)

### 9.1 NextAuth Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
        };
      },
    }),
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 9.2 Protected Route Hook

```typescript
// hooks/useAuth.ts
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(requireAdmin = false) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (requireAdmin && session.user.role !== "admin") {
      router.push("/");
      return;
    }
  }, [session, status, router, requireAdmin]);

  return { session, status, isLoading: status === "loading" };
}

// Usage
// "use client";
// const { session, isLoading } = useAuth(true); // require admin
```

---

## 10. Styling (Tailwind CSS)

### 10.1 Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          light: "var(--primary-light)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};

export default config;
```

### 10.2 Component Styling Pattern

```tsx
// ✅ Group related classes
<button
  className="
    /* Layout */
    flex items-center justify-center
    /* Spacing */
    px-4 py-2 gap-2
    /* Typography */
    text-sm font-medium
    /* Colors */
    bg-primary text-white
    hover:bg-primary-dark
    /* Effects */
    rounded-lg shadow-sm
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  Button Text
</button>

// ✅ Responsive
<div className="
  /* Mobile */
  grid grid-cols-1 gap-4 p-4
  /* Tablet */
  md:grid-cols-2 md:gap-6
  /* Desktop */
  lg:grid-cols-3 lg:gap-8
">
  {/* Content */}
</div>
```

---

## 11. Components

### 11.1 Component Structure Pattern

```
components/
└── ProductCard/
    ├── ProductCard.tsx      # Component chính
    ├── ProductCard.module.css # Styles (nếu cần)
    └── index.ts             # Export
```

### 11.2 Component Template

```tsx
// components/ProductCard/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    mainImage: string;
    rating?: number;
    inStock?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, isInWishlist } = useWishlistStore();

  const isWishlisted = isInWishlist(product.id);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      mainImage: product.mainImage,
      merchantId: "",
      merchantName: "",
    });
    toast.success("Added to cart!");
  }

  function handleToggleWishlist() {
    if (isWishlisted) {
      // remove from wishlist
    } else {
      addToWishlist({
        productId: product.id,
        title: product.title,
        price: product.price,
        mainImage: product.mainImage,
        slug: product.slug,
      });
      toast.success("Added to wishlist!");
    }
  }

  return (
    <div className="group relative bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Image */}
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-square relative">
          <Image
            src={product.mainImage || "/placeholder.jpg"}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {product.title}
          </h3>
        </Link>
        
        <p className="mt-1 text-lg font-semibold text-primary">
          ${(product.price / 100).toFixed(2)}
        </p>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-primary text-white py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Add to Cart
          </button>
          
          <button
            onClick={handleToggleWishlist}
            className={`p-2 rounded border ${
              isWishlisted
                ? "bg-red-50 border-red-200 text-red-500"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {isWishlisted ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 12. Các tính năng chính

### 12.1 Trang người dùng (User-facing Pages)

| Tính năng | Vị trí file | Mô tả |
|-----------|------------|--------|
| Trang chủ | `app/page.tsx` | Banner Hero, danh mục sản phẩm, sản phẩm nổi bật |
| Tìm kiếm sản phẩm | `app/search/page.tsx` | Tìm kiếm sản phẩm theo từ khóa |
| Chi tiết sản phẩm | `app/product/[productSlug]/page.tsx` | Thông tin chi tiết, hình ảnh, chia sẻ mạng xã hội |
| Cửa hàng/Danh mục | `app/shop/[[...slug]]/page.tsx` | Lọc, sắp xếp, phân trang sản phẩm |
| Giỏ hàng | `app/cart/page.tsx` | Quản lý giỏ hàng theo cửa hàng, thay đổi số lượng |
| Thanh toán | `app/checkout/page.tsx` | Thông tin giao hàng, xác nhận đơn hàng |
| Đăng nhập | `app/login/page.tsx` | Email/password, Google/GitHub OAuth |
| Đăng ký | `app/register/page.tsx` | Tạo tài khoản mới (validation) |
| Đơn hàng của tôi | `app/account/orders/page.tsx` | Xem đơn hàng, theo dõi trạng thái |
| Thông báo | `app/notifications/page.tsx` | Danh sách thông báo, tìm kiếm, thao tác hàng loạt |

### 12.2 Trang quản trị (Admin Dashboard)

| Tính năng | Vị trí file | Mô tả |
|-----------|------------|--------|
| Dashboard | `app/(dashboard)/admin/page.tsx` | Thống kê, biểu đồ khách truy cập |
| Quản lý sản phẩm | `app/(dashboard)/admin/products/page.tsx` | CRUD sản phẩm |
| Quản lý đơn hàng | `app/(dashboard)/admin/orders/page.tsx` | Danh sách đơn hàng, chi tiết |
| Quản lý người dùng | `app/(dashboard)/admin/users/page.tsx` | Danh sách người dùng |
| Quản lý cửa hàng | `app/(dashboard)/admin/merchant/page.tsx` | Quản lý merchant |
| Quản lý danh mục | `app/(dashboard)/admin/categories/page.tsx` | CRUD danh mục |
| Bulk Upload | `app/(dashboard)/admin/bulk-upload/page.tsx` | Import CSV hàng loạt |

### 12.3 Trang người bán (Seller Dashboard)

| Tính năng | Vị trí file | Mô tả |
|-----------|------------|--------|
| Dashboard | `app/(seller)/seller/dashboard/page.tsx` | Thống kê cửa hàng (tổng sản phẩm, đơn hàng, doanh thu) |
| Phân tích | `app/(seller)/seller/analytics/page.tsx` | Xu hướng bán, biểu đồ doanh thu 30 ngày, sản phẩm hot |
| Sản phẩm của tôi | `app/(seller)/seller/products/page.tsx` | Quản lý sản phẩm (CRUD) |
| Đơn hàng | `app/(seller)/seller/orders/page.tsx` | Quản lý sub-orders, cập nhật trạng thái |
| Voucher | `app/(seller)/seller/vouchers/page.tsx` | Tạo/sửa/xóa mã giảm giá (PERCENTAGE/FIXED) |
| Bulk Upload | `app/(seller)/seller/bulk-upload/page.tsx` | Import sản phẩm hàng loạt qua CSV |
| Cài đặt shop | `app/(seller)/seller/settings/page.tsx` | Thông tin shop (tên, mô tả, số điện thoại, địa chỉ) |

### 12.4 API Routes (Next.js)

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/register` | POST | Tạo tài khoản mới |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth authentication |
| `/api/customer-orders/checkout` | POST | Xử lý thanh toán |
| `/api/seller/orders` | GET | Thống kê và danh sách orders |
| `/api/account/orders` | GET | Lấy đơn hàng của user |

### 12.5 API Routes (Express Backend)

#### Products

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/products` | GET | Lấy tất cả sản phẩm (filter/sort/pagination) |
| `/api/products` | POST | Tạo sản phẩm mới |
| `/api/products/:id` | GET | Chi tiết sản phẩm |
| `/api/products/:id` | PUT | Cập nhật sản phẩm |
| `/api/products/:id` | DELETE | Xóa sản phẩm |
| `/api/search` | GET | Tìm kiếm sản phẩm |
| `/api/slugs/:slug` | GET | Lấy sản phẩm qua slug |
| `/api/images/:id` | GET/POST/PUT/DELETE | Quản lý hình ảnh sản phẩm |
| `/api/main-image` | POST | Upload ảnh chính |

#### Orders

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/orders` | GET/POST | Lấy/tạo đơn hàng |
| `/api/orders/:id` | GET/PUT/DELETE | Chi tiết/cập nhật/xóa đơn hàng |
| `/api/order-product` | GET/POST | Sub-order products |
| `/api/order-product/:id` | GET/PUT/DELETE | Quản lý sub-order product |
| `/api/seller/orders` | GET | Sub-orders của seller |
| `/api/seller/orders/:itemId/status` | PATCH | Cập nhật trạng thái sub-order |
| `/api/seller/settings` | GET/PUT | Lấy/cập nhật thông tin shop |
| `/api/seller/vouchers` | GET/POST | Lấy/tạo voucher |
| `/api/seller/vouchers/:id` | PUT/DELETE | Cập nhật/xóa voucher |
| `/api/seller/analytics/overview` | GET | Phân tích chi tiết: doanh thu 30 ngày, top sản phẩm |
| `/api/sellers/:sellerId` | GET | Trang công khai của shop |

#### Users & Authentication

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/users` | GET/POST | Lấy/tạo users |
| `/api/users/:id` | GET/PUT/DELETE | Chi tiết/cập nhật/xóa user |
| `/api/users/email/:email` | GET | Tìm user qua email |

#### Categories

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/categories` | GET/POST | Lấy/tạo categories |
| `/api/categories/:id` | GET/PUT/DELETE | Chi tiết/cập nhật/xóa |

#### Merchants

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/merchants` | GET/POST | Lấy/tạo merchants |
| `/api/merchants/:id` | GET/PUT/DELETE | Chi tiết/cập nhật/xóa |

#### Vouchers

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/vouchers` | GET/POST | Lấy/tạo vouchers |
| `/api/vouchers/validate` | POST | Kiểm tra voucher hợp lệ |
| `/api/vouchers/apply` | POST | Áp dụng voucher vào đơn |
| `/api/vouchers/:id` | PUT/DELETE | Cập nhật/xóa voucher |

#### Reviews

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/reviews/product/:productId` | GET | Reviews của sản phẩm |
| `/api/reviews/merchant/:merchantId` | GET | Reviews của merchant |
| `/api/reviews/user/:userId` | GET | Reviews của user |
| `/api/reviews/stats/:productId` | GET | Thống kê đánh giá |
| `/api/reviews` | POST | Tạo review |
| `/api/reviews/:id` | DELETE | Xóa review |

#### Wishlist

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/wishlist` | GET/POST | Lấy/thêm wishlist |
| `/api/wishlist/:userId` | GET | Wishlist của user |
| `/api/wishlist/:userId/:productId` | GET/DELETE | Kiểm tra/xóa sản phẩm trong wishlist |

#### Notifications

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/notifications/:userId` | GET | Thông báo của user |
| `/api/notifications/:userId/unread-count` | GET | Số thông báo chưa đọc |
| `/api/notifications` | POST | Tạo thông báo |
| `/api/notifications/mark-read` | POST | Đánh dấu đã đọc |
| `/api/notifications/:id` | PUT/DELETE | Cập nhật/xóa thông báo |
| `/api/notifications/bulk` | DELETE | Xóa nhiều thông báo |

#### Bulk Upload

| Route | Phương thức | Mô tả |
|-------|-------------|--------|
| `/api/bulk-upload` | GET/POST | Lấy/danh sách/tạo batch upload |
| `/api/bulk-upload/:batchId` | GET/PUT/DELETE | Chi tiết/cập nhật/xóa batch |

### 12.6 Components chính

| Component | Vị trí | Mô tả |
|-----------|--------|--------|
| Header | `components/Header.tsx` | Navigation, search, cart, wishlist, notifications |
| Cart Module | `components/modules/cart/index.tsx` | Logic giỏ hàng, nhóm theo cửa hàng |
| Wishlist Module | `components/modules/wishlist/index.tsx` | Quản lý wishlist |
| Products Grid | `components/Products.tsx` | Danh sách sản phẩm với filter/sort/pagination |
| Product Item | `components/ProductItem.tsx` | Card sản phẩm |
| Filters | `components/Filters.tsx` | Bộ lọc (giá, rating, stock) |
| SortBy | `components/SortBy.tsx` | Sắp xếp sản phẩm |
| Pagination | `components/Pagination.tsx` | Phân trang |
| DashboardSidebar | `components/DashboardSidebar.tsx` | Sidebar admin/seller |
| ProductTable | `components/DashboardProductTable.tsx` | Bảng quản lý sản phẩm |
| AdminOrders | `components/AdminOrders.tsx` | Danh sách orders |
| BulkUploadHistory | `components/BulkUploadHistory.tsx` | Lịch sử bulk upload |

### 12.7 Database Models (Prisma)

| Model | Mô tả |
|-------|--------|
| `Product` | Sản phẩm (quan hệ merchant, category, images, wishlist, reviews) |
| `Image` | Thư viện hình ảnh sản phẩm |
| `User` | Người dùng (roles: user/admin) |
| `Customer_order` | Đơn hàng (shipping info, status, sub-orders) |
| `SubOrder` | Sub-order (theo merchant, tracking, timestamps) |
| `SubOrderProduct` | Sản phẩm trong sub-order (snapshot giá/tên/ảnh) |
| `Category` | Danh mục sản phẩm |
| `Wishlist` | Wishlist của user |
| `Notification` | Thông báo (types: ORDER_UPDATE, PAYMENT_STATUS...) |
| `Merchant` | Merchant (shipping, avatar, banner) |
| `Review` | Đánh giá sản phẩm (1-5 sao) |
| `Voucher` | Mã giảm giá (FIXED/PERCENTAGE) |
| `VoucherUsage` | Lịch sử sử dụng voucher |
| `Payment` | Thông tin thanh toán |
| `MerchantPayout` | Payout của merchant |
| `bulk_upload_batch` | Batch upload |
| `bulk_upload_item` | Items trong batch upload |

### 12.8 Các tính năng đặc biệt

| Tính năng | Mô tả |
|-----------|--------|
| **Multi-vendor** | Mỗi đơn hàng được chia theo merchant thành sub-orders |
| **Social Login** | Google & GitHub OAuth |
| **Cart Persistence** | Zustand state management |
| **Wishlist** | Quản lý wishlist |
| **Bulk Upload** | Import sản phẩm qua CSV |
| **Voucher System** | Giảm giá theo % hoặc số tiền cố định |
| **Review System** | Đánh giá sản phẩm với rating |
| **Order Status Flow** | PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED |
| **Tracking** | Thêm thông tin vận chuyển |
| **Notifications** | Hệ thống thông báo real-time |
| **Rate Limiting** | Bảo vệ API khỏi abuse |

### 12.9 Middleware & Utilities

| File | Chức năng |
|------|-----------|
| `rateLimiter.js` | Rate limiting: General (300/15min), Auth (300/15min), Register (20/hr), Upload (300/15min), Search (300/min), Orders (300/15min) |
| `advancedRateLimiter.js` | Advanced: Wishlist (40/5min), Products (60/min), Merchants (60/min) |
| `requestLogger.js` | Request logging, security logs, request ID |
| `errorHandler.js` | Error handling, Prisma errors |
| `validation.js` | Order validation, payment validation (Luhn algorithm) |
| `notificationHelpers.js` | Tạo thông báo cho orders, payments, promotions |
| `db.js` | Prisma client (SSL config) |

### 12.10 Order Status Flow

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓
CANCELLED
```

### 12.11 Voucher System

```typescript
// Voucher types
type VoucherType = "PERCENTAGE" | "FIXED";

// Validation
interface VoucherValidation {
  isValid: boolean;
  discountAmount: number;
  errorMessage?: string;
}

// Calculate discount
function calculateDiscount(
  voucher: Voucher,
  subtotal: number
): VoucherValidation {
  let discountAmount = 0;

  if (voucher.discountType === "PERCENTAGE") {
    discountAmount = (subtotal * voucher.discountValue) / 100;
    if (voucher.maxDiscount) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else {
    discountAmount = voucher.discountValue;
  }

  return {
    isValid: true,
    discountAmount,
  };
}
```

---

## 13. Logging & Monitoring

### 13.1 Winston Logger

```javascript
// server/utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "tfdtronic-api" },
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/security.log",
      level: "warn",
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;
```

### 13.2 Usage

```javascript
const logger = require("../utils/logger");

// Info
logger.info("User logged in", { userId: user.id, ip: req.ip });

// Warning
logger.warn("Rate limit exceeded", { userId: user.id, ip: req.ip });

// Error
logger.error("Database error", { error: err.message, query: req.query });
```

---

## 14. Security

### 14.1 Rate Limiting

```javascript
// server/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 attempts per hour
  message: {
    success: false,
    message: "Too many authentication attempts.",
  },
});

module.exports = {
  limiter,
  authLimiter,
};
```

### 14.2 Security Headers

```javascript
// Thêm vào Express app
const helmet = require("helmet");
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  })
);
```

---

## 15. Testing

### 15.1 Testing Guidelines

```typescript
// components/__tests__/ProductCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "../ProductCard";

describe("ProductCard", () => {
  const mockProduct = {
    id: "1",
    slug: "test-product",
    title: "Test Product",
    price: 9999,
    mainImage: "/test.jpg",
    rating: 4,
    inStock: 10,
  };

  it("renders product information", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("calls addItem when Add to Cart is clicked", async () => {
    const addItem = jest.fn();
    // Mock the store
    render(<ProductCard product={mockProduct} />);

    const button = screen.getByText("Add to Cart");
    fireEvent.click(button);

    // Assert
    expect(addItem).toHaveBeenCalled();
  });
});
```

---

## 16. Deployment

### 16.1 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="mysql://user:password@localhost:3306/tfdtronic"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth (Google)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# OAuth (GitHub)
GITHUB_ID=""
GITHUB_SECRET=""

# API
NEXT_PUBLIC_API_URL="http://localhost:5000/api"

# Server
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

### 16.2 Build & Run Commands

```bash
# Frontend
npm install
npm run dev          # Development
npm run build        # Production build
npm run start        # Start production server

# Backend
cd server
npm install
npm start            # Start server
npm run logs         # View logs
npm run db:backup    # Backup database
```

---

## Lưu ý quan trọng

1. **Không commit `.env`** - Luôn sử dụng `.env.example` làm template
2. **TypeScript** - Luôn sử dụng TypeScript cho frontend, define types cho tất cả props và returns
3. **Error Handling** - Luôn handle loading và error states
4. **Security** - Không hardcode secrets, sử dụng environment variables
5. **Performance** - Tối ưu images với Next.js Image, lazy loading
6. **Accessibility** - Thêm alt text, keyboard navigation
7. **Responsive** - Mobile-first approach với Tailwind breakpoints
8. **Validation** - Validate tất cả user inputs với Zod
9. **API Responses** - Luôn return consistent response format
10. **Code Comments** - Comment code khi cần thiết, không comment những thứ obvious
