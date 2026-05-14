/**
 * Error Handler Utilities
 * 
 * Provides centralized error handling for the Express application:
 * - Custom error class (AppError) for application errors
 * - Prisma database error handling with user-friendly messages
 * - Async route handler wrapper (asyncHandler)
 * - Error logging with context
 * 
 * @module utills/errorHandler
 */

// ============================================================
// CUSTOM ERROR CLASS
// Base error class for application-specific errors
// ============================================================

/**
 * Application Error class
 * Extends built-in Error with HTTP status code and operational flag
 * 
 * Operational errors are expected errors (validation, not found, etc.)
 * Non-operational errors are unexpected bugs (database crash, etc.)
 * 
 * @class AppError
 * @extends Error
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {boolean} isOperational - Whether error is operational/expected (default: true)
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// ERROR LOGGING
// Structured logging for server-side errors
// ============================================================

/**
 * Logs error with timestamp and context
 * Differentiates between AppError and generic Error
 * 
 * @param {Error} error - The error to log
 * @param {string} context - Optional context (e.g., "POST /api/users")
 */
const logError = (error, context = "") => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : "";

  if (error instanceof AppError) {
    // AppError with known status code
    console.error(`${timestamp}${contextStr} AppError:`, {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
    });
  } else if (error instanceof Error) {
    // Generic JavaScript Error
    console.error(`${timestamp}${contextStr} Error:`, {
      message: error.message,
      stack: error.stack,
    });
  } else {
    // Unknown error type
    console.error(`${timestamp}${contextStr} Unknown error:`, error);
  }
};

// ============================================================
// PRISMA ERROR HANDLING
// Translates Prisma error codes to user-friendly messages
// ============================================================

/**
 * Maps Prisma error codes to human-readable error messages
 * Prisma uses specific error codes for different database errors
 * 
 * @param {Object} error - Prisma error object
 * @returns {Object} Structured error response
 * 
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
const handlePrismaError = (error) => {
  // Validate error object has expected structure
  if (!error || typeof error !== "object" || !("code" in error)) {
    return {
      error: "Internal server error. Please try again later.",
      timestamp: new Date().toISOString(),
    };
  }

  const prismaError = error;

  /**
   * Prisma Error Code Reference:
   * 
   * P2002: Unique constraint failed
   *         → Record with this value already exists
   *         
   * P2025: Record not found
   *         → The requested record doesn't exist
   *         
   * P2003: Foreign key constraint failed
   *         → Related record doesn't exist
   *         
   * P2014: Required relation violation
   *         → Operation violates relationship constraints
   *         
   * P2021: Table doesn't exist
   *         → Database schema issue
   *         
   * P2022: Column doesn't exist
   *         → Database schema issue
   */
  switch (prismaError.code) {
    case "P2002":
      // Unique constraint violation
      return {
        error: "A record with this information already exists",
        details: prismaError.meta?.target
          ? `Field: ${prismaError.meta.target.join(", ")}`
          : undefined,
        timestamp: new Date().toISOString(),
      };
    case "P2025":
      // Record not found
      return {
        error: "Record not found",
        timestamp: new Date().toISOString(),
      };
    case "P2003":
      // Foreign key constraint failed
      return {
        error: "Foreign key constraint failed",
        timestamp: new Date().toISOString(),
      };
    case "P2014":
      // Required relation violation
      return {
        error:
          "The change you are trying to make would violate the required relation",
        timestamp: new Date().toISOString(),
      };
    case "P2021":
      // Table doesn't exist
      return {
        error: "The table does not exist in the current database",
        timestamp: new Date().toISOString(),
      };
    case "P2022":
      // Column doesn't exist
      return {
        error: "The column does not exist in the current database",
        timestamp: new Date().toISOString(),
      };
    default:
      // Unknown Prisma error
      return {
        error: "Database operation failed",
        details: `Error code: ${prismaError.code}`,
        timestamp: new Date().toISOString(),
      };
  }
};

/**
 * Maps Prisma error codes to appropriate HTTP status codes
 * 
 * @param {Object} error - Prisma error object
 * @returns {number} HTTP status code
 */
const getStatusCodeFromPrismaError = (error) => {
  switch (error.code) {
    case "P2002":
      return 409; // Conflict - duplicate record
    case "P2025":
      return 404; // Not Found
    case "P2003":
    case "P2014":
      return 400; // Bad Request
    case "P2021":
    case "P2022":
      return 500; // Internal Server Error (schema issue)
    default:
      return 500;
  }
};

// ============================================================
// CENTRAL ERROR HANDLER
// Express error handling middleware
// ============================================================

/**
 * Central error handler for Express
 * Processes all errors and returns appropriate JSON response
 * 
 * @param {Error} error - The error to handle
 * @param {Response} res - Express response object
 * @param {string} context - Error context for logging
 */
const handleServerError = (error, res, context = "") => {
  const timestamp = new Date().toISOString();

  // Log the error first
  logError(error, context);

  // Handle AppError (custom application errors)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      timestamp,
    });
    return;
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const errorResponse = handlePrismaError(error);
    const statusCode = getStatusCodeFromPrismaError(error);

    res.status(statusCode).json(errorResponse);
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    error: "Internal server error. Please try again later.",
    timestamp,
  });
};

// ============================================================
// ASYNC HANDLER
// Wrapper for async route handlers to catch promise rejections
// ============================================================

/**
 * Wraps async route handlers to catch errors
 * Express doesn't automatically catch errors in async functions
 * This wrapper ensures errors are passed to error handling middleware
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches errors
 * 
 * @example
 * // Without asyncHandler:
 * router.get('/users', async (req, res) => {
 *   const users = await prisma.user.findMany(); // Error not caught!
 *   res.json(users);
 * });
 * 
 * // With asyncHandler:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await prisma.user.findMany(); // Error caught!
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Async Handler Error:", error);
      console.error("Stack:", error.stack);

      if (res.headersSent) {
        return next(error);
      }

      handleServerError(error, res, `${req.method} ${req.path}`);
    });
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  AppError,                    // Custom error class
  logError,                    // Structured error logging
  handlePrismaError,           // Prisma error translation
  getStatusCodeFromPrismaError,// Prisma error to HTTP status
  handleServerError,           // Express error handler
  asyncHandler,                // Async route wrapper
};

/**
 * USAGE EXAMPLE:
 * 
 * const { AppError, asyncHandler, handleServerError } = require('./utills/errorHandler');
 * 
 * // In routes:
 * router.post('/users', asyncHandler(async (req, res) => {
 *   const { email } = req.body;
 *   
 *   if (!email) {
 *     throw new AppError('Email is required', 400);
 *   }
 *   
 *   const user = await prisma.user.create({ data: { email } });
 *   res.status(201).json(user);
 * }));
 */