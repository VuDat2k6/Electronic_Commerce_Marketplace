# TFDTRONIC Electronics Marketplace

TFDTRONIC is a full-stack electronics marketplace built with Next.js, Express, Prisma, MySQL, NextAuth, and Zustand. It supports a customer storefront, buyer checkout, seller dashboards, admin moderation, notifications, vouchers, reviews, and multi-seller order handling.

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | Next.js 15 App Router, React 18, TypeScript |
| Styling | Tailwind CSS, Flowbite React, Framer Motion |
| Backend | Node.js, Express |
| Database | MySQL, Prisma ORM |
| Auth | NextAuth credentials flow with backend JWT bridge |
| State | Zustand |
| Testing | Playwright, TypeScript checks |

## Current Feature Set

### Buyer storefront

- Electronics-focused homepage with hero slider, featured products, categories, and product sections.
- Product listing with search, sort, pagination, desktop filters, and mobile filters.
- Product detail with product information, stock state, add-to-cart, buy-now, description, and reviews.
- Cart and checkout with multi-seller grouping.
- Voucher entry during checkout.
- Order history under `My orders`.
- Wishlist and notifications.
- Buyer-to-seller application flow through `Become a seller`.

### Seller dashboard

- Seller dashboard with real product, order, pending order, and revenue metrics.
- Product management for seller-owned listings.
- Seller order management.
- Seller analytics with revenue/order summaries.
- Voucher creation and management.
- Bulk upload for seller product CSV imports.
- Seller status page for pending or suspended sellers.

### Admin dashboard

- Platform dashboard and analytics.
- User management.
- Seller application review and seller suspension.
- Category management.
- Product moderation list and compliance warning flow.
- Order oversight.
- Platform settings route.

Admin product moderation is intentionally warning-based. Product removal is handled by sellers so active buyer order flows are not broken by direct admin deletion.

## Requirements

- Node.js 18 or newer
- npm
- MySQL 8 or compatible MySQL server

## Environment

Create a root `.env` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NODE_ENV=development
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/marketplace"
NEXTAUTH_SECRET=replace_with_a_long_random_secret
NEXTAUTH_URL=http://localhost:3000
```

Create `server/.env`:

```env
NODE_ENV=development
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/marketplace"
NEXTAUTH_SECRET=replace_with_the_same_value_as_root_NEXTAUTH_SECRET
PORT=5000
```

Do not commit real `.env` files.

## Installation

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
cd ..
```

## Database Setup

Create the database:

```sql
CREATE DATABASE marketplace;
```

Generate Prisma client and push the schema:

```bash
npm run db:generate
npm run db:push
```

Seed realistic electronics marketplace data:

```bash
npm run db:seed
```

The seed includes:

- 1 admin
- 5 active sellers
- 1 pending seller
- at least 5 buyers
- one buyer account for testing `Become a seller`
- electronics categories
- at least 10 products per active seller
- sample orders, reviews, vouchers, notifications, and dashboard data

## Seed Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tfdtronic.com` | `admin123` |
| Active seller | `seller@tfdtronic.com` | `seller123` |
| Other sellers | `gadget.seller@tfdtronic.com` | `password` |
| Other sellers | `mobile.seller@tfdtronic.com` | `password` |
| Other sellers | `gaming.seller@tfdtronic.com` | `password` |
| Other sellers | `camera.seller@tfdtronic.com` | `password` |
| Pending seller | `pending.seller@tfdtronic.com` | `password` |
| Buyer | `buyer@tfdtronic.com` | `buyer123` |
| Become-seller test buyer | `become.seller.test@tfdtronic.com` | `password` |

Change all seeded credentials before using a public or production database.

## Run Locally

Terminal 1, backend:

```bash
cd server
npm start
```

Backend health check:

```text
http://localhost:5000/health
```

Terminal 2, frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Useful routes:

| Route | Purpose |
| --- | --- |
| `/` | Storefront homepage |
| `/shop` | Product listing |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/account/orders` | Buyer orders |
| `/notifications` | Notifications |
| `/become-seller` | Seller application |
| `/seller/dashboard` | Seller dashboard |
| `/seller/status` | Seller approval/suspension status |
| `/admin` | Admin dashboard |

## Testing and Verification

Type check:

```bash
npx tsc --noEmit --pretty false
```

Production build:

```bash
npm run build
```

Playwright smoke examples:

```bash
npx playwright test e2e/auth.spec.ts --project=chromium --reporter=line
npx playwright test e2e/marketplace.spec.ts --project=chromium --reporter=line
npx playwright test e2e/seller-analytics.spec.ts --project=chromium --reporter=line
```

Run the broader E2E suite:

```bash
npx playwright test --project=chromium
```

Playwright outputs are ignored by Git:

- `playwright-report/`
- `test-results/`
- `test-evidence/`

On Windows, if `npm run build` fails with a Prisma `EPERM rename query_engine-windows.dll.node` error, stop the running Next.js/backend Node processes and run the build again. This is a file lock issue, not a schema issue.

## Project Structure

```text
marketplace/
├── app/                         # Next.js App Router routes
│   ├── (dashboard)/admin/        # Admin dashboard routes
│   ├── (seller)/seller/          # Seller dashboard routes
│   ├── account/orders/           # Buyer order history
│   ├── api/                      # Next.js API routes and auth bridge
│   ├── cart/                     # Cart page
│   ├── checkout/                 # Checkout page
│   ├── login/                    # Login page
│   ├── product/[productSlug]/    # Product detail page
│   ├── shop/                     # Marketplace listing and shop routes
│   └── _zustand/                 # Cart, wishlist, pagination, sort stores
├── components/                   # Shared React components
│   ├── modules/cart/             # Cart module
│   ├── modules/wishlist/         # Wishlist module
│   └── ui/                       # UI primitives
├── e2e/                          # Playwright tests
├── hooks/                        # Client hooks
├── lib/                          # API client, auth options, Prisma helpers
├── prisma/                       # Prisma schema used by the Next.js app
├── public/                       # Static assets and CSV templates
├── RecentChange/                 # Change notes for local development history
├── server/                       # Express backend
│   ├── controllers/              # Request handlers
│   ├── middleware/               # Auth, rate limiting, logging
│   ├── routes/                   # Express route definitions
│   ├── scripts/                  # Seed and utility scripts
│   ├── services/                 # Business logic
│   └── utils/                    # Backend utilities
├── types/                        # Shared TypeScript types
└── utils/                        # Frontend utility wrappers
```

## Important Architecture Notes

- NextAuth owns the browser session.
- `/api/backend-token` generates a short-lived JWT for Express API calls.
- Express middleware validates that token for protected backend routes.
- Seller suspension is enforced in dashboard access, seller status UI, storefront visibility, and checkout validation.
- Checkout creates buyer notifications and seller notifications.
- Multi-seller checkout is represented through seller-specific sub-orders.
- Public product images should live under `public/images/products` when possible to avoid broken remote image URLs.

## Pre-Push Checklist

Before pushing to GitHub:

```bash
git status --short
npx tsc --noEmit --pretty false
npm run build
npx playwright test e2e/auth.spec.ts e2e/marketplace.spec.ts --project=chromium --reporter=line
git diff --check
```

Review untracked files carefully. Source, tests, docs, CSV templates, and `RecentChange` notes may be intentional. Generated screenshots, reports, local logs, `.env`, and temporary scripts should not be committed.

## Common Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start frontend on port 3000 |
| `npm run build` | Generate Prisma client and build Next.js |
| `npm run start` | Start built Next.js app |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed demo marketplace data |
| `npm run db:studio` | Open Prisma Studio |
| `cd server && npm start` | Start Express backend on port 5000 |
| `cd server && npm run logs:error` | Read backend error logs |

## License

MIT License.
