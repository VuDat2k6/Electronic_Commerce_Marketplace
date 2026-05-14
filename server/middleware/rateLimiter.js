/**
 * Rate Limiter Middleware
 * 
 * Provides rate limiting functionality to protect the API from abuse:
 * - Prevents brute force attacks on authentication endpoints
 * - Limits request volume per IP address
 * - Protects resource-intensive operations (uploads, search)
 * - Different limits for different endpoint types
 * 
 * Uses express-rate-limit library with configurable windows
 * and request limits for each endpoint category.
 * 
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');

// ============================================================
// RATE LIMITING STRATEGY
// 
// Each limiter has:
// - windowMs: Time window for counting requests
// - max: Maximum requests allowed per window
// - Message: Error response when limit exceeded
// - Headers: Rate limit info returned in response headers
// ============================================================

// ============================================================
// GENERAL RATE LIMITER
// Applies to all API routes by default
// Base protection for the entire API
// ============================================================

/**
 * General API rate limiter
 * - Window: 15 minutes
 * - Limit: 300 requests per IP
 * 
 * This is the baseline limiter applied to all routes
 * More specific limiters can override for certain endpoints
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// ============================================================
// AUTHENTICATION RATE LIMITERS
// Strict limits for auth-related endpoints
// ============================================================

/**
 * Authentication limiter
 * - Window: 15 minutes
 * - Limit: 300 login attempts per IP
 * - skipSuccessfulRequests: Don't count successful logins
 * 
 * Prevents brute force attacks on login endpoints
 * Users who successfully log in don't count against limit
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Registration limiter
 * - Window: 1 hour
 * - Limit: 20 registration attempts per IP
 * 
 * Prevents mass account creation and spam registrations
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 registration attempts per hour
  message: {
    error: 'Too many registration attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// ============================================================
// USER MANAGEMENT LIMITER
// Moderate limits for user-related operations
// ============================================================

/**
 * User management limiter
 * - Window: 15 minutes
 * - Limit: 300 requests per IP
 * 
 * Applies to: /api/users endpoints
 */
const userManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: {
    error: 'Too many user management requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many user management requests, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// ============================================================
// FILE UPLOAD LIMITER
// Moderate limits for file upload operations
// ============================================================

/**
 * Upload limiter
 * - Window: 15 minutes
 * - Limit: 300 uploads per IP
 * 
 * Applies to: /api/images, /api/main-image, /api/bulk-upload
 * Protects against upload-based DoS attacks
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 uploads per windowMs
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many file uploads, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// ============================================================
// SEARCH LIMITER
// Shorter window for search operations
// ============================================================

/**
 * Search limiter
 * - Window: 1 minute
 * - Limit: 300 search requests per IP
 * 
 * Applies to: /api/search
 * Shorter window prevents search-based abuse
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Limit each IP to 300 search requests per minute
  message: {
    error: 'Too many search requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many search requests, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

// ============================================================
// ORDER LIMITER
// Moderate limits for order operations
// ============================================================

/**
 * Order limiter
 * - Window: 15 minutes
 * - Limit: 300 order operations per IP
 * 
 * Applies to: /api/orders, /api/order-product
 * Prevents order spam and cart abandonment abuse
 */
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 order operations per windowMs
  message: {
    error: 'Too many order operations, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many order operations, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  generalLimiter,        // General API protection (300/15min)
  authLimiter,           // Login protection (300/15min)
  registerLimiter,       // Registration protection (20/hour)
  userManagementLimiter,  // User API protection (300/15min)
  uploadLimiter,         // Upload protection (300/15min)
  searchLimiter,         // Search protection (300/1min)
  orderLimiter           // Order protection (300/15min)
};

/**
 * RATE LIMIT HEADERS
 * 
 * When standardHeaders: true, these headers are included in responses:
 * 
 * RateLimit-Limit:        Max requests allowed (e.g., 300)
 * RateLimit-Remaining:    Requests remaining in window (e.g., 299)
 * RateLimit-Reset:        Time when window resets (Unix timestamp)
 * 
 * Use these headers client-side to implement:
 * - Retry-After header handling
 * - Request throttling
 * - User-facing rate limit warnings
 */
