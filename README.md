# Electronics eCommerce Marketplace

A modern, full-stack electronics e-commerce platform built with Next.js 15, Node.js, Express, and MySQL. This application provides a complete online shopping experience with a responsive storefront for customers and a powerful admin dashboard for store management.

## Overview

TFDTRONIC Marketplace is designed for selling all types of electronic products including smartphones, laptops, tablets, accessories, and more. The platform features a clean, modern UI with Tailwind CSS and DaisyUI components, making it both visually appealing and fully responsive across all devices.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Next.js 15 (App Router) |
| **UI Library** | React 18 |
| **Styling** | Tailwind CSS, DaisyUI |
| **Backend Framework** | Node.js, Express |
| **Database** | MySQL with Prisma ORM |
| **Authentication** | NextAuth.js |
| **Icons** | React Icons (Font Awesome, Lucide) |

## Features

### Customer Storefront

The storefront provides a complete shopping experience for customers:

- **Home Page** - Featured products, banner promotions, category browsing
- **Product Catalog** - Grid/list view of products with filtering and sorting
- **Product Details** - Full product information, images, specifications, reviews
- **Search** - Real-time search with suggestions and filters
- **Shopping Cart** - Add/remove items, quantity adjustment, price calculation
- **Wishlist** - Save favorite products for later
- **User Account** - Profile management, order history, addresses
- **Checkout** - Multi-step checkout with order summary
- **Authentication** - Register, login, password reset with NextAuth.js

### Admin Dashboard

A comprehensive dashboard for store administrators:

- **Dashboard Overview** - Sales statistics, revenue charts, recent orders
- **Product Management** - Full CRUD operations, image upload, inventory tracking
- **Category Management** - Create/edit/delete product categories
- **Order Management** - View orders, update status, track shipments
- **User Management** - View customer accounts, order history
- **Analytics** - Sales reports, popular products, revenue tracking

## Getting Started

### Prerequisites

Before running this project, ensure you have:

- **Node.js** version 18.0 or higher
- **npm** package manager (or bun/yarn)
- **MySQL Server** version 8.0 or higher
- A code editor (VS Code recommended)

### Installation

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Electronics-eCommerce-Shop-With-Admin-Dashboard-NextJS-NodeJS-main/marketplace
```

#### Step 2: Install Dependencies

Install dependencies for the main project:

```bash
npm install
```

#### Step 3: Configure Environment Variables

Create a `.env` file in the **root directory** of the project:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NODE_ENV=development
DATABASE_URL="mysql://username:password@localhost:3306/marketplace?sslmode=disabled"
NEXTAUTH_SECRET=12D16C923BA17672F89B18C1DB22A
NEXTAUTH_URL=http://localhost:3000
```

Create a `.env` file in the **/server directory**:

```env
NODE_ENV=development
DATABASE_URL="mysql://username:password@localhost:3306/marketplace?sslmode=disabled"
```

**Important:** Replace `username` and `password` with your MySQL credentials.

#### Step 4: Setup MySQL Database

1. Open MySQL and create a new database:

```sql
CREATE DATABASE marketplace;
```

2. Navigate to the server folder and run Prisma migrations:

```bash
cd server
npx prisma migrate dev
```

3. Seed the database with sample data:

```bash
node prisma/seed.js
```

#### Step 5: Start the Backend Server

In the `/server` directory, start the Express backend:

```bash
node app.js
```

You should see:
```
Server running on port 3001
Database connection: mysql://localhost:3306
```

#### Step 6: Start the Frontend

Open a **new terminal** and run:

```bash
npm run dev
```

#### Step 7: Access the Application

- **Storefront:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin

## Default Admin Credentials

For testing purposes, use these credentials:

| Field | Value |
|-------|-------|
| **Email** | mrzayquazaboy@gmail.com |
| **Password** | admin123 |

**Note:** Change these credentials in production environments.

## Project Structure

```
marketplace/
├── app/                          # Next.js App Router
│   ├── admin/                   # Admin dashboard pages
│   │   ├── products/           # Admin product management
│   │   ├── categories/         # Admin category management
│   │   ├── orders/            # Admin order management
│   │   ├── users/             # Admin user management
│   │   └── dashboard/         # Admin home/analytics
│   ├── api/                   # API routes
│   │   ├── products/         # Product API endpoints
│   │   ├── categories/       # Category API endpoints
│   │   ├── auth/            # Authentication endpoints
│   │   └── images/          # Image API endpoints
│   ├── product/             # Product detail pages
│   ├── cart/                # Shopping cart page
│   ├── wishlist/           # Wishlist page
│   ├── checkout/           # Checkout page
│   └── layout.tsx          # Root layout
├── components/                # React components
│   ├── ui/                 # Reusable UI components
│   ├── product/           # Product-related components
│   ├── cart/             # Cart-related components
│   └── admin/            # Admin-specific components
├── lib/                     # Utilities and helpers
│   ├── api.ts            # API client
│   └── sanitize.ts       # Input sanitization
├── prisma/                # Database schema & seed
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Database seeder
├── server/                # Express backend
│   ├── app.js            # Express server entry
│   ├── routes/          # API route handlers
│   └── controllers/     # Business logic
└── public/              # Static assets
    ├── images/         # Product images
    └── icons/          # UI icons
```

## Database Schema

The application uses Prisma ORM with the following main models:

- **User** - Customer and admin accounts
- **Product** - Product catalog with pricing, stock
- **Category** - Product categories
- **Order** - Customer orders
- **OrderItem** - Individual items in orders
- **Cart** - Shopping cart items
- **Wishlist** - Wishlist items
- **Merchant** - Store merchant information
- **ProductImage** - Additional product images

## API Documentation

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/slugs/:slug` | Get product by slug |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get category by ID |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get order by ID |
| POST | `/api/orders` | Create new order |
| PUT | `/api/orders/:id` | Update order status |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth.js authentication |
| GET | `/api/auth/session` | Get current session |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `cd server && npm install` | Install backend dependencies |
| `cd server && node app.js` | Start backend server |
| `cd server && npx prisma studio` | Open Prisma database studio |
| `cd server && npx prisma migrate dev` | Run database migrations |

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Ensure MySQL server is running
2. Verify credentials in `.env` files
3. Check that the database exists (`CREATE DATABASE marketplace;`)

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Find process using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <process-id> /F
```

### Node Modules Issues

If you encounter module errors:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with Next.js and React
- UI components from DaisyUI and Tailwind CSS
- Icons from React Icons
- Database powered by MySQL and Prisma

## Support

For support, email support@example.com or open an issue in the repository.
