# TFDTRONIC Electronics eCommerce Marketplace

A modern, full-stack electronics e-commerce platform built with **Next.js 15**, **Node.js**, **Express**, and **MySQL**. The platform features a clean, responsive storefront for customers, a powerful admin dashboard for store management, and a dedicated seller dashboard for vendors to manage their own stores.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | Next.js 15 (App Router) |
| UI Library | React 18 |
| Styling | Tailwind CSS, Flowbite React |
| Backend Framework | Node.js, Express |
| Database | MySQL with Prisma ORM |
| Authentication | NextAuth.js (Credentials, Google, GitHub OAuth) |
| State Management | Zustand |
| Icons | React Icons |
| Charts | ApexCharts |

---

## Features

### Customer Storefront

- **Home Page** — Hero banners, featured products, category browsing
- **Product Catalog** — Grid view with filtering, sorting, pagination
- **Product Details** — Full product info, images, specifications, reviews
- **Search** — Real-time search with filters
- **Shopping Cart** — Multi-seller grouping, quantity adjustment, price calculation (stored in Zustand + sessionStorage)
- **Wishlist** — Save favorite products for later
- **Checkout** — Multi-step checkout with order summary
- **My Orders** — Order history with status tracking
- **Notifications** — Real-time notifications for order updates
- **Authentication** — Register, login with NextAuth.js (Credentials, Google, GitHub)

### Admin Dashboard (`/admin`)

- **Dashboard Overview** — Sales statistics, revenue charts, recent orders
- **Product Management** — Full CRUD, image upload, inventory tracking
- **Category Management** — Create/edit/delete categories
- **Order Management** — View orders, update status, track shipments
- **User Management** — Customer accounts, order history
- **Bulk Upload** — Import products via CSV
- **Merchant Management** — Approve/manage sellers

### Seller Dashboard (`/seller`)

- **Dashboard Overview** — Store statistics (total products, orders, revenue)
- **Analytics** — Sales trends, 30-day revenue charts, hot products
- **My Products** — CRUD product management
- **Orders** — Manage sub-orders, update order status, add tracking info
- **Vouchers** — Create discount codes (percentage or fixed amount)
- **Bulk Upload** — Import products via CSV
- **Settings** — Shop profile (name, description, phone, address)

### Multi-Vendor Architecture

- Each order is split into **sub-orders** per seller
- Sellers manage only their own products and sub-orders
- Customers can order from multiple sellers in a single checkout
- Automatic shipping fee calculation per seller

---

## Getting Started

### Prerequisites

- **Node.js** v18.0 or higher
- **npm** package manager
- **MySQL Server** v8.0 or higher

### Installation

#### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd marketplace
npm install
```

#### 2. Configure Environment Variables

Create a `.env` file in the **root directory**:

```env
# Frontend / NextAuth
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL="mysql://username:password@localhost:3306/marketplace?sslmode=disabled"

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

Create a `.env` file in the **server directory**:

```env
NODE_ENV=development
DATABASE_URL="mysql://username:password@localhost:3306/marketplace?sslmode=disabled"
PORT=3001
```

#### 3. Setup Database

```sql
CREATE DATABASE marketplace;
```

```bash
# Frontend Prisma
npx prisma migrate dev --name init

# Backend Prisma
cd server
npx prisma migrate dev --name init

# Seed data
node prisma/seed.js
```

#### 4. Start the Application

**Terminal 1 — Backend:**
```bash
cd server
node app.js
# Server running on port 3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# Frontend running on port 3000
```

#### 5. Access

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Customer Storefront |
| http://localhost:3000/admin | Admin Dashboard |
| http://localhost:3000/seller | Seller Dashboard |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | mrzayquazaboy@gmail.com | admin123 |
| Seller | (create via registration) | — |

> **Important:** Change these credentials in production.

---

## Project Structure

```
marketplace/
├── app/                              # Next.js App Router (Frontend)
│   ├── (auth)/                      # Auth pages (login, register)
│   ├── (main)/                      # Main storefront pages
│   │   ├── product/[slug]/          # Product detail page
│   │   ├── shop/                    # Shop / category page
│   │   ├── cart/                    # Shopping cart
│   │   ├── checkout/                # Checkout page
│   │   ├── search/                  # Search page
│   │   └── wishlist/               # Wishlist page
│   ├── (dashboard)/admin/           # Admin dashboard group
│   │   ├── products/               # Admin product management
│   │   ├── categories/             # Admin category management
│   │   ├── orders/                 # Admin order management
│   │   ├── users/                 # Admin user management
│   │   ├── merchants/             # Admin merchant management
│   │   └── bulk-upload/          # Admin bulk upload
│   ├── (seller)/seller/            # Seller dashboard group (role=seller)
│   │   ├── dashboard/            # Dashboard & statistics
│   │   ├── analytics/            # Sales analytics & charts
│   │   ├── products/            # Seller product management
│   │   ├── orders/              # Seller sub-orders
│   │   ├── vouchers/            # Seller vouchers
│   │   ├── bulk-upload/         # Seller bulk upload
│   │   └── settings/           # Shop settings
│   ├── account/orders/           # User order history
│   ├── notifications/           # User notifications
│   ├── api/                     # Next.js API routes
│   │   ├── auth/[...nextauth]/  # NextAuth endpoints
│   │   ├── register/            # User registration
│   │   ├── customer-orders/     # Checkout API
│   │   └── account/orders/      # User orders API
│   └── _zustand/               # Zustand stores
│       ├── store.ts            # Cart store
│       ├── wishlistStore.ts    # Wishlist store
│       └── notificationStore.ts # Notification store
├── components/                   # React components
│   ├── Header.tsx             # Navigation header
│   ├── Footer.tsx              # Footer
│   ├── ProductItem.tsx         # Product card
│   ├── Products.tsx            # Product grid
│   ├── Filters.tsx             # Filter sidebar
│   ├── SortBy.tsx              # Sort dropdown
│   ├── Pagination.tsx          # Pagination
│   ├── DashboardSidebar.tsx   # Dashboard sidebar
│   └── modules/
│       ├── cart/index.tsx     # Cart module
│       └── wishlist/index.tsx # Wishlist module
├── lib/                         # Libraries
│   ├── api.ts                 # API client
│   ├── config.ts              # Config (API base URL)
│   ├── prisma.ts             # Prisma client singleton
│   └── sanitize.ts            # XSS protection
├── prisma/                     # Frontend Prisma schema
│   └── schema.prisma
├── server/                     # Express Backend
│   ├── app.js                # Express entry point
│   ├── prisma/schema.prisma  # Backend Prisma schema
│   ├── routes/              # API route definitions
│   ├── controllers/         # Route controllers
│   ├── services/            # Business logic (order.service.ts)
│   ├── middleware/          # Middlewares (rate limiter, logger)
│   └── utils/              # Utilities (validation, errors, logger)
└── types/                   # TypeScript types
    └── notification.ts     # Notification types
```

---

## Database Schema

The application uses Prisma ORM with the following models:

| Model | Description |
|-------|-------------|
| **User** | Accounts with roles: buyer, seller, admin. Sellers have shop metadata |
| **Product** | Product catalog (title, price, stock, images, seller relation) |
| **Category** | Product categories |
| **Customer_order** | Customer orders with shipping info and totals |
| **Order_item** | Items in orders, links to seller for multi-vendor support |
| **Wishlist** | User wishlist items |
| **Notification** | User notifications (ORDER_UPDATE, PAYMENT_STATUS, PROMOTION, etc.) |
| **Voucher** | Discount codes (PERCENTAGE or FIXED) |
| **VoucherUsage** | Voucher usage history |
| **Image** | Additional product images |
| **Merchant** | Merchant/vendor information |
| **Review** | Product reviews with 1-5 star ratings |
| **SubOrder** | Sub-orders per merchant (multi-vendor) |
| **SubOrderProduct** | Products in sub-orders with price/name snapshots |
| **bulk_upload_batch** | CSV import batches |
| **bulk_upload_item** | Items within upload batches |

---

## API Reference

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (filter/sort/paginate) |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product by ID |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/search` | Search products |
| GET | `/api/slugs/:slug` | Get product by slug |
| POST | `/api/main-image` | Upload main image |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders (admin) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order by ID |
| PUT | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |
| GET | `/api/seller/orders` | Seller sub-orders |
| PATCH | `/api/seller/orders/:id/status` | Update sub-order status |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| GET | `/api/categories/:id` | Get category by ID |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Vouchers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vouchers` | Get all vouchers |
| POST | `/api/vouchers` | Create voucher |
| POST | `/api/vouchers/validate` | Validate voucher code |
| POST | `/api/vouchers/apply` | Apply voucher to order |
| PUT | `/api/vouchers/:id` | Update voucher |
| DELETE | `/api/vouchers/:id` | Delete voucher |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/product/:productId` | Get product reviews |
| GET | `/api/reviews/stats/:productId` | Get rating statistics |
| POST | `/api/reviews` | Create review |
| DELETE | `/api/reviews/:id` | Delete review |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/:userId` | Get user notifications |
| GET | `/api/notifications/:userId/unread-count` | Get unread count |
| POST | `/api/notifications` | Create notification |
| POST | `/api/notifications/mark-read` | Mark as read |
| DELETE | `/api/notifications/bulk` | Bulk delete |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth.js handler |
| POST | `/api/register` | User registration |

---

## State Management

The app uses **Zustand** for client-side state management:

| Store | Location | Description |
|-------|----------|-------------|
| Cart Store | `app/_zustand/store.ts` | Cart items, totals, cart groups per seller. Persisted to sessionStorage |
| Wishlist Store | `app/_zustand/wishlistStore.ts` | Wishlist items. Persisted to sessionStorage |
| Notification Store | `app/_zustand/notificationStore.ts` | Notifications with pagination and multi-select |
| Sort Store | `app/_zustand/sortStore.ts` | Sort mode selection |
| Pagination Store | `app/_zustand/paginationStore.ts` | Page state |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run database migrations |
| `cd server && node app.js` | Start backend server |
| `cd server && npx prisma migrate dev` | Run backend migrations |

---

## Troubleshooting

### Database Connection

```sql
-- Create database
CREATE DATABASE marketplace;

-- Verify connection
mysql -u username -p -e "SHOW DATABASES;"
```

### Port Already in Use

```powershell
# Find process
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process
taskkill /PID <pid> /F
```

### Module Errors

```bash
rm -rf node_modules
rm package-lock.json
npm install
cd server && npm install
```

### Apply New Migrations

```bash
# Frontend
npx prisma migrate dev --name add_performance_indexes

# Backend
cd server
npx prisma migrate dev --name add_performance_indexes
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT License
