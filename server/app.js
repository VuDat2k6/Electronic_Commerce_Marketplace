/**
 * TFDTRONIC Electronics E-Commerce Marketplace - Backend Server
 * 
 * This is the main Express.js server that handles:
 * - REST API endpoints for products, orders, users, merchants
 * - Authentication and authorization
 * - File uploads and image management
 * - Rate limiting and request logging
 * - CORS configuration for frontend access
 * 
 * @module app
 * @version 1.0.0
 */

// ============================================================
// DEPENDENCIES
// ============================================================

const express = require("express");
const path = require('path');

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

// ============================================================
// ROUTES IMPORTS
// These route handlers define API endpoints for each resource
// ============================================================

// Product routes - CRUD operations for products
const productsRouter = require("./routes/products");

// Product images routes - Handle image uploads and management
const productImagesRouter = require("./routes/productImages");

// Category routes - Product categorization
const categoryRouter = require("./routes/category");

// Search routes - Full-text search functionality
const searchRouter = require("./routes/search");

// Main images routes - Primary product images
const mainImageRouter = require("./routes/mainImages");

// User routes - User management and authentication
const userRouter = require("./routes/users");

// Customer order routes - Order processing and management
const orderRouter = require("./routes/customer_orders");

// Slug routes - SEO-friendly URL generation
const slugRouter = require("./routes/slugs");

// Order product routes - Individual items within orders
const orderProductRouter = require('./routes/customer_order_product');

// Notification routes - User notification management
const notificationsRouter = require('./routes/notifications');

// Merchant routes - Seller/vendor management (DEPRECATED)
// const merchantRouter = require('./routes/merchant');

// Seller routes - NEW
const sellerRouter = require('./routes/seller');
const adminSellerRouter = require('./routes/adminSellers');
const sellersPublicRouter = require('./routes/sellers');
const sellerAnalyticsRouter = require('./routes/sellerAnalytics');
const sellerVoucherRouter = require('./routes/sellerVoucher');

// Bulk upload routes - Mass product import via CSV
const bulkUploadRouter = require('./routes/bulkUpload');

// Review routes - Product review and rating system
const reviewRouter = require('./routes/review');

// Voucher routes - Discount coupons and promotions
const voucherRouter = require('./routes/voucher');

/**
 * Seller Orders API - DEPRECATED, use /api/seller/orders instead
 * Path: /api/seller/orders
 */
// const sellerOrdersRouter = require('./routes/sellerOrders');

// CORS - Cross-Origin Resource Sharing
// Allows frontend to communicate with backend API
var cors = require("cors");

// ============================================================
// MIDDLEWARE IMPORTS
// Middleware functions that process requests before reaching routes
// ============================================================

// Request logging middleware - Logs all incoming requests
// Captures request details, duration, and response status
const { 
  addRequestId, 
  requestLogger, 
  errorLogger, 
  securityLogger 
} = require('./middleware/requestLogger');

// Rate limiting middleware - Protects against abuse
// Limits number of requests per time window
const {
  generalLimiter,
  authLimiter,
  registerLimiter,
  userManagementLimiter,
  uploadLimiter,
  searchLimiter,
  orderLimiter
} = require('./middleware/rateLimiter');

// Error handling utility - Centralized error processing
const {
  handleServerError
} = require('./utills/errorHandler');

// ============================================================
// EXPRESS APP INITIALIZATION
// ============================================================

const app = express();

// ============================================================
// CORE MIDDLEWARE SETUP
// These middleware run on every request
// ============================================================

/**
 * Trust proxy - Enables accurate client IP detection
 * Required when server is behind a reverse proxy (e.g., Nginx, load balancer)
 */
app.set('trust proxy', 1);

/**
 * Add unique request ID to each request
 * Used for request tracing and debugging
 */
app.use(addRequestId);

/**
 * Security logging - Checks for suspicious request patterns
 * Detects potential attacks like SQL injection, XSS attempts
 */
app.use(securityLogger);

/**
 * Request logging - Records all HTTP requests
 * Captures method, URL, status code, response time
 */
app.use(requestLogger);

/**
 * Error logging - Records 4xx and 5xx responses
 * Helps identify client errors and server issues
 */
app.use(errorLogger);

// ============================================================
// CORS CONFIGURATION
// Controls which origins can access the API
// ============================================================

/**
 * Allowed origins list
 * Frontend runs on port 3000, backend API on port 3001
 * Also reads from environment variables for flexibility
 */
const allowedOrigins = [
  'http://localhost:3000',    // Local development frontend
  'http://localhost:3001',    // Local development backend (if needed)
  process.env.NEXTAUTH_URL,    // NextAuth configured URL
  process.env.FRONTEND_URL,    // Custom frontend URL from env
].filter(Boolean); // Remove undefined values

/**
 * CORS options with origin validation
 * - Validates origin against whitelist
 * - Allows localhost in development mode
 * - Rejects unauthorized origins in production
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any localhost origin in development
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Reject unauthorized origins
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],  // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"],  // Allowed headers
  credentials: true, // Allow cookies and authorization headers
};

// ============================================================
// BODY PARSING AND FILE UPLOADS
// ============================================================

/**
 * General rate limiting applied to all routes
 * Default: 100 requests per 15 minutes
 */
app.use(generalLimiter);

/**
 * JSON body parser - Parses JSON request bodies
 * Necessary for API requests with JSON payload
 */
app.use(express.json());

/**
 * CORS middleware - Enables cross-origin requests
 */
app.use(cors(corsOptions));

/**
 * File upload middleware - Enables multipart/form-data parsing
 * Required for image uploads and bulk CSV imports
 */
app.use(fileUpload());

// ============================================================
// ROUTE-SPECIFIC RATE LIMITING
// Apply stricter limits to sensitive or resource-intensive endpoints
// ============================================================

app.use("/api/users", userManagementLimiter);     // User management operations
app.use("/api/search", searchLimiter);             // Search queries (30/min)
app.use("/api/orders", orderLimiter);              // Order operations
app.use("/api/order-product", orderLimiter);       // Order items
app.use("/api/images", uploadLimiter);             // Image uploads
app.use("/api/main-image", uploadLimiter);         // Main image uploads
app.use("/api/bulk-upload", uploadLimiter);        // CSV bulk imports
app.use("/api/seller", uploadLimiter);             // Seller bulk uploads

/**
 * Auth limiter - Stricter limits for authentication endpoints
 * Prevents brute force attacks on login
 */
app.use("/api/users/email", authLimiter);

// ============================================================
// API ROUTES REGISTRATION
// Mount all route handlers to their respective paths
// ============================================================

/**
 * Products API - Product listing, details, filtering
 * Path: /api/products
 */
app.use("/api/products", productsRouter);

/**
 * Categories API - Product category management
 * Path: /api/categories
 */
app.use("/api/categories", categoryRouter);

/**
 * Product Images API - Additional product images
 * Path: /api/images
 */
app.use("/api/images", productImagesRouter);

/**
 * Main Images API - Primary product images
 * Path: /api/main-image
 */
app.use("/api/main-image", mainImageRouter);

/**
 * Users API - User registration, authentication, profile
 * Path: /api/users
 */
app.use("/api/users", userRouter);

/**
 * Search API - Full-text product search
 * Path: /api/search
 */
app.use("/api/search", searchRouter);

/**
 * Orders API - Customer order management
 * Path: /api/orders
 */
app.use("/api/orders", orderRouter);

/**
 * Order Products API - Individual items in orders
 * Path: /api/order-product
 */
app.use('/api/order-product', orderProductRouter);

/**
 * Slugs API - SEO-friendly URL generation
 * Path: /api/slugs
 */
app.use("/api/slugs", slugRouter);

/**
 * Notifications API - User notifications
 * Path: /api/notifications
 */
app.use("/api/notifications", notificationsRouter);

/**
 * Sellers API (Admin) - Seller management
 * Path: /api/admin/sellers
 */
app.use("/api/admin/sellers", adminSellerRouter);

/**
 * Seller API - Seller dashboard, products, orders
 * Path: /api/seller
 */
app.use("/api/seller", sellerRouter);

/**
 * Seller Analytics API - Analytics and statistics
 * Path: /api/seller/analytics
 */
app.use("/api/seller/analytics", sellerAnalyticsRouter);

/**
 * Seller Vouchers API - Voucher management
 * Path: /api/seller/vouchers
 */
app.use("/api/seller/vouchers", sellerVoucherRouter);

/**
 * Sellers Public API - Public seller shop pages
 * Path: /api/sellers
 */
app.use("/api/sellers", sellersPublicRouter);

/**
 * Bulk Upload API - Mass product import via CSV
 * Path: /api/bulk-upload
 */
app.use("/api/bulk-upload", bulkUploadRouter);

/**
 * Reviews API - Product reviews and ratings
 * Path: /api/reviews
 */
app.use("/api/reviews", reviewRouter);

/**
 * Vouchers API - Discount coupons
 * Path: /api/vouchers
 */
app.use("/api/vouchers", voucherRouter);

/**
 * Seller Orders API - DEPRECATED, use /api/seller/orders instead
 * Path: /api/seller/orders
 */
// app.use("/api/seller/orders", sellerOrdersRouter);

// ============================================================
// HEALTH CHECK AND INFO ENDPOINTS
// ============================================================

/**
 * Health check endpoint
 * Returns server status for monitoring
 * No rate limiting applied
 * 
 * GET /health
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    rateLimiting: 'enabled',
    requestId: req.reqId
  });
});

/**
 * Rate limit information endpoint
 * Returns current rate limit configuration
 * Useful for debugging rate limit issues
 * 
 * GET /rate-limit-info
 */
app.get('/rate-limit-info', (req, res) => {
  res.status(200).json({
    general: '100 requests per 15 minutes',
    auth: '5 login attempts per 15 minutes',
    register: '3 registrations per hour',
    upload: '10 uploads per 15 minutes',
    search: '30 searches per minute',
    orders: '15 order operations per 15 minutes',
    wishlist: '20 operations per 5 minutes',
    products: '60 requests per minute',
    requestId: req.reqId
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * 404 handler - Catches requests to undefined routes
 * Returns JSON error response
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.reqId
  });
});

/**
 * Global error handler - Catches all unhandled errors
 * Logs error details and returns safe error message to client
 */
app.use((err, req, res, next) => {
  handleServerError(err, res, `${req.method} ${req.path}`);
});

// ============================================================
// SERVER STARTUP
// ============================================================

const PORT = process.env.PORT || 3001;

/**
 * Start the Express server
 * Logs startup information to console
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Rate limiting and request logging enabled for all endpoints');
  console.log('Logs are being written to server/logs/ directory');
});
