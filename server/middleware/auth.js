/**
 * JWT Authentication Middleware
 * 
 * Provides authentication and authorization for Express API routes.
 * Verifies JWT tokens from the Authorization header and attaches
 * user information to the request object.
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');

// JWT Secret from environment - should be same as NEXTAUTH_SECRET for consistency
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Roles enum for type safety
const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin'
};

// Error class for authentication errors
class AuthenticationError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

class AuthorizationError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Extract and decode JWT token from Authorization header
 * Supports both "Bearer <token>" and raw token formats
 * 
 * @param {string} authHeader - Authorization header value
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function decodeToken(authHeader) {
  if (!authHeader) return null;
  
  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) return null;

  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return null;
    }
    
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('JWT token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.warn('Invalid JWT token:', error.message);
    }
    return null;
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to req.user
 * 
 * Usage:
 *   router.get('/protected', authenticate, controller);
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const payload = decodeToken(authHeader);

    if (!payload) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        message: 'Valid authentication token is required to access this resource'
      });
    }

    // Attach user info to request
    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role || ROLES.BUYER,
      shopStatus: payload.shopStatus
    };

    // For backwards compatibility with existing code that uses req.user.id
    req.userId = req.user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      message: 'Unable to authenticate request'
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 * Useful for routes that behave differently for authenticated users
 * 
 * Usage:
 *   router.get('/resource', authenticateOptional, controller);
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  const payload = decodeToken(authHeader);

  if (payload) {
    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role || ROLES.BUYER,
      shopStatus: payload.shopStatus
    };
    req.userId = req.user.id;
  }

  next();
}

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 * 
 * Usage:
 *   router.delete('/admin-only', authenticate, requireRole('admin'), controller);
 *   router.patch('/seller-only', authenticate, requireRole('seller', 'admin'), controller);
 * 
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Admin-only middleware shortcut
 * Shorthand for requireRole('admin')
 */
const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * Seller-only middleware shortcut
 * Shorthand for requireRole('seller')
 */
const requireSeller = requireRole(ROLES.SELLER);

/**
 * Seller or Admin middleware
 * Shorthand for requireRole('seller', 'admin')
 */
const requireSellerOrAdmin = requireRole(ROLES.SELLER, ROLES.ADMIN);

async function requireActiveSeller(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  if (req.user.role !== ROLES.SELLER) {
    return res.status(403).json({
      error: 'Seller approval required',
      code: 'SELLER_NOT_ACTIVE',
      message: 'Your seller account must be approved before accessing seller tools'
    });
  }

  try {
    const seller = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, shopStatus: true },
    });

    if (!seller || seller.role !== ROLES.SELLER || seller.shopStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Seller approval required',
        code: 'SELLER_NOT_ACTIVE',
        message: 'Your seller account must be approved before accessing seller tools'
      });
    }

    req.user.shopStatus = seller.shopStatus;
    return next();
  } catch (error) {
    console.error('Active seller verification failed:', error);
    return res.status(500).json({
      error: 'Unable to verify seller status',
      code: 'SELLER_STATUS_CHECK_FAILED'
    });
  }
}

/**
 * Generate JWT token for a user
 * Used for testing or when creating tokens manually
 * 
 * @param {Object} user - User object with id, email, role, shopStatus
 * @returns {string} JWT token
 */
function generateToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || ROLES.BUYER,
    shopStatus: user.shopStatus || null,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
  if (!JWT_SECRET || !token) return null;
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * IDOR protection middleware factory
 * Ensures users can only access their own resources
 * 
 * Usage:
 *   // For seller routes - verify sellerId matches authenticated user
 *   router.get('/dashboard', authenticate, protectSellerResource, controller);
 *   // In controller, use req.user.id instead of req.body.sellerId
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.idParam - Request parameter containing the ID (default: 'id')
 * @param {string} options.bodyField - Body field containing the ID (default: 'sellerId')
 * @returns {Function} Express middleware function
 */
function protectResource(options = {}) {
  const {
    idParam = 'id',
    bodyField = 'sellerId'
  } = options;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // For sellers, ensure they can only access their own resources
    if (req.user.role === ROLES.SELLER) {
      const resourceId = req.params[idParam] || req.body[bodyField];
      
      // Admins can access any resource
      if (resourceId && resourceId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        });
      }
    }

    next();
  };
}

/**
 * Protect seller-specific resources
 * Verifies that the authenticated user is the seller they claim to be
 */
const protectSeller = protectResource({
  idParam: 'id',
  bodyField: 'sellerId'
});

/**
 * Protect buyer-specific resources
 * Verifies that the authenticated user is the buyer they claim to be
 */
const protectBuyer = protectResource({
  idParam: 'id',
  bodyField: 'buyerId'
});

module.exports = {
  // Core functions
  authenticate,
  authenticateOptional,
  requireRole,
  requireAdmin,
  requireSeller,
  requireSellerOrAdmin,
  requireActiveSeller,
  protectResource,
  protectSeller,
  protectBuyer,
  
  // Token utilities
  generateToken,
  verifyToken,
  decodeToken,
  
  // Constants
  ROLES,
  
  // Error classes
  AuthenticationError,
  AuthorizationError
};
