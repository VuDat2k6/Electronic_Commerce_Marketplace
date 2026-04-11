# Changelog - TFDTRONIC Electronics eCommerce Shop

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Initial project setup with Next.js 15 and Node.js/Express
- Prisma ORM with MySQL database
- NextAuth for authentication
- Zustand for state management
- Zod for validation
- Winston for logging

### Changed
- Project structure following Next.js App Router conventions

## [1.0.0] - 2026-04-10

### Added

#### User Features
- **Homepage** - Hero banner, category menu, featured products section
- **Product Search** - Full-text search with filters
- **Product Details** - Images, specifications, social sharing
- **Shop/Categories** - Filter, sort, pagination
- **Shopping Cart** - Grouped by merchant, quantity management
- **Checkout** - Shipping info, order confirmation
- **User Login** - Email/password + Google/GitHub OAuth
- **User Registration** - Form validation
- **My Orders** - Order history, status tracking
- **Notifications** - Search, filter, bulk operations

#### Admin Dashboard Features
- **Dashboard** - Statistics, visitor charts
- **Product Management** - Full CRUD operations
- **Order Management** - All orders list and details
- **User Management** - User list and details
- **Merchant Management** - Merchant CRUD
- **Category Management** - Category CRUD
- **Bulk Upload** - CSV import for products

#### Seller Dashboard Features
- **Dashboard** - Shop statistics, order overview
- **My Products** - Published/Draft/Archived status management
- **Orders** - Sub-order management, status updates, tracking info
- **Vouchers** - Create/edit/delete coupons (% or fixed amount)
- **Shop Settings** - Logo, Banner, shipping settings
- **Analytics** - Sales trends, charts, hot products, reviews stats

#### Backend API Features
- **Products API** - CRUD, search, filtering, sorting, pagination
- **Orders API** - Customer orders, sub-orders, status management
- **Users API** - CRUD with password hashing (BCrypt)
- **Categories API** - CRUD with product association check
- **Merchants API** - CRUD with shipping settings
- **Vouchers API** - CRUD, validation, application, discount calculation
- **Reviews API** - CRUD, rating stats, product rating updates
- **Wishlist API** - Add/remove/list products
- **Notifications API** - CRUD, bulk operations, unread count
- **Bulk Upload API** - CSV parsing, batch creation, batch management
- **Images API** - Product image management

#### Security Features
- **Rate Limiting** - Multiple tiers: General (300/15min), Auth (300/15min), Register (20/hr), Upload (300/15min), Search (300/min), Orders (300/15min)
- **Advanced Rate Limiting** - Wishlist (40/5min), Products (60/min), Merchants (60/min)
- **Request Logging** - Request logs, security logs, request ID
- **Error Handling** - Comprehensive error handling with Prisma error mapping

#### Database Models
- Product, Image, User, Customer_order, SubOrder, SubOrderProduct
- Category, Wishlist, Notification, Merchant, Review, Voucher
- VoucherUsage, Payment, MerchantPayout
- bulk_upload_batch, bulk_upload_item

#### Special Features
- **Multi-vendor Support** - Orders split by merchant into sub-orders
- **Social Login** - Google and GitHub OAuth
- **Cart Persistence** - Zustand state management
- **Wishlist Management** - User wishlist with state management
- **Bulk CSV Upload** - Batch product import
- **Voucher System** - Percentage or fixed amount discounts
- **Review System** - Product ratings (1-5 stars)
- **Order Status Flow** - PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- **Shipping Tracking** - Carrier and tracking number
- **Real-time Notifications** - Notification state management
- **Payment Validation** - Luhn algorithm for card validation

### Documentation
- Testing documentation with 350+ test cases
- Software engineering documentation (40 pages)
- Comprehensive README with feature descriptions
