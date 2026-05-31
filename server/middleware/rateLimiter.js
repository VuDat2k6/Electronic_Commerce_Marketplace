/**
 * Rate Limiter Middleware
 * 
 * Provides rate limiting to protect the API from abuse:
 * - Prevents brute force attacks on authentication endpoints
 * - Limits request volume per IP address
 * - Protects resource-intensive operations
 * 
 * All limiters are ALWAYS active (no development skip)
 * to ensure production-grade protection.
 * 
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');

const skipPreflightRequests = (request) => request.method === 'OPTIONS';

function readPositiveInteger(name, fallback) {
  const configuredValue = Number.parseInt(process.env[name] || '', 10);
  return Number.isInteger(configuredValue) && configuredValue > 0 ? configuredValue : fallback;
}

const generalRateLimitMax = readPositiveInteger('GENERAL_RATE_LIMIT_MAX', 1000);

// ============================================================
// RATE LIMITING CONFIGURATION
// 
// Each limiter has:
// - windowMs: Time window for counting requests
// - max: Maximum requests allowed per window
// - message: Error response when limit exceeded
// - Headers: Rate limit info returned in response headers
// ============================================================

// ============================================================
// GENERAL RATE LIMITER
// Applies to all API routes by default
// ============================================================

/**
 * General API rate limiter
 * - Window: 15 minutes
 * - Limit: configurable baseline, default 1000 requests per IP
 * 
 * This is the baseline limiter applied to all routes.
 * More specific limiters override for certain endpoints.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: generalRateLimitMax,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // CORS negotiation is not application traffic and must not exhaust quotas.
  skip: skipPreflightRequests,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

// ============================================================
// AUTHENTICATION RATE LIMITERS
// Strict limits for auth-related endpoints
// ============================================================

/**
 * Authentication limiter (login attempts)
 * - Window: 15 minutes
 * - Limit: 5 login attempts per IP
 * 
 * Prevents brute force attacks on login endpoints.
 * After 5 failed attempts, user must wait 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts (success and failure)
  skip: skipPreflightRequests,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Registration limiter
 * - Window: 1 hour
 * - Limit: 10 registration attempts per IP
 * 
 * Prevents mass account creation and spam registrations.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 registration attempts per hour
  message: {
    error: 'Too many registration attempts, please try again in 1 hour.',
    code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflightRequests,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts, please try again in 1 hour.',
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
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
 * - Limit: 50 requests per IP
 * 
 * Applies to: /api/users endpoints
 */
const userManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many user management requests, please try again later.',
    code: 'USER_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflightRequests,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many user management requests, please try again later.',
      code: 'USER_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

// ============================================================
// FILE UPLOAD LIMITER
// Strict limits for file upload operations
// ============================================================

/**
 * Upload limiter
 * - Window: 15 minutes
 * - Limit: 20 uploads per IP
 * 
 * Applies to: /api/images, /api/main-image, /api/bulk-upload
 * Protects against upload-based DoS attacks.
 * Files are also limited by size in the controller.
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per windowMs
  message: {
    error: 'Too many file uploads, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflightRequests,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many file uploads, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
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
 * - Limit: 30 searches per IP
 * 
 * Applies to: /api/search
 * Shorter window prevents search-based abuse.
 */
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    error: 'Too many search requests, please try again in 1 minute.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflightRequests,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many search requests, please try again in 1 minute.',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
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
 * - Limit: 30 order operations per IP
 * 
 * Applies to: /api/orders, /api/order-product
 * Prevents order spam and cart abandonment abuse.
 */
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 order operations per windowMs
  message: {
    error: 'Too many order operations, please try again later.',
    code: 'ORDER_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflightRequests,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many order operations, please try again later.',
      code: 'ORDER_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    });
  }
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  generalLimiter,        // General API protection (configurable baseline/15min)
  authLimiter,           // Login protection (5/15min) - STRICT
  registerLimiter,       // Registration protection (10/hour)
  userManagementLimiter,  // User API protection (50/15min)
  uploadLimiter,         // Upload protection (20/15min)
  searchLimiter,         // Search protection (30/1min)
  orderLimiter           // Order protection (30/15min)
};

/**
 * RATE LIMIT SUMMARY
 * 
 * Endpoint              | Window    | Limit
 * --------------------- | --------- | -----
 * General API           | 15 min    | GENERAL_RATE_LIMIT_MAX (default 1000)
 * Login (authLimiter)   | 15 min    | 5 (STRICT)
 * Registration          | 1 hour    | 10
 * User Management       | 15 min    | 50
 * File Uploads          | 15 min    | 20
 * Search                | 1 min     | 30
 * Orders                | 15 min    | 30
 * 
 * All limiters are ALWAYS active (no dev skip)
 */
