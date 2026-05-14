/**
 * Request Logger Middleware
 * 
 * Provides comprehensive request logging and security monitoring:
 * - Generates unique request IDs for tracing
 * - Logs all HTTP requests to access.log
 * - Logs errors (4xx, 5xx) to error.log
 * - Detects and logs suspicious security patterns
 * 
 * Uses Morgan library for HTTP request logging with custom formats
 * and Winston-inspired JSON logging for security events.
 * 
 * @module middleware/requestLogger
 */

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// ============================================================
// LOG DIRECTORY SETUP
// Create logs directory if it doesn't exist
// ============================================================

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('Created logs directory:', logsDir);
}

// ============================================================
// MORGAN CUSTOM TOKENS
// Define custom tokens for log formatting
// ============================================================

// Request ID token - unique identifier for request tracing
morgan.token('reqId', (req) => req.reqId || 'unknown');

// User ID token - extract user ID from authenticated requests
morgan.token('userId', (req) => req.user?.id || 'anonymous');

/**
 * Log format string for Morgan
 * Combines standard Apache Combined Log Format with custom tokens
 * 
 * Format: IP - user [date] "METHOD URL HTTP/version" status size "referrer" "user-agent" reqId=xxx userId=xxx
 */
const logFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" reqId=:reqId userId=:userId';

// ============================================================
// LOG STREAMS
// Create write streams for different log types
// ============================================================

// Access log stream - all requests
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'), 
  { flags: 'a' }  // Append mode
);

// Error log stream - only 4xx and 5xx responses
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'), 
  { flags: 'a' }  // Append mode
);

// ============================================================
// ADD REQUEST ID MIDDLEWARE
// Generates unique ID for each request and adds to headers
// ============================================================

/**
 * Middleware to add unique request ID to each request
 * ID is generated using nanoid for short unique identifiers
 * 
 * The request ID is:
 * - Added to req.reqId for internal use
 * - Set as X-Request-ID response header for client reference
 * - Included in all log entries for correlation
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const addRequestId = async (req, res, next) => {
  try {
    // Dynamically import nanoid for async ID generation
    const { nanoid } = await import('nanoid');
    req.reqId = nanoid(8);  // Generate 8-character unique ID
    res.setHeader('X-Request-ID', req.reqId);
    next();
  } catch (error) {
    console.error('Error generating request ID:', error);
    // Fallback ID using Math.random if nanoid fails
    req.reqId = Math.random().toString(36).substr(2, 8);
    res.setHeader('X-Request-ID', req.reqId);
    next();
  }
};

// ============================================================
// REQUEST LOGGERS
// Morgan-based logging middleware for different purposes
// ============================================================

/**
 * Standard request logger
 * Logs all HTTP requests to access.log
 * Skips health check endpoint to reduce noise
 * 
 * Uses custom format defined above with reqId and userId tokens
 */
const requestLogger = morgan(logFormat, {
  stream: accessLogStream,
  skip: (req, res) => req.url === '/health'  // Skip health checks
});

/**
 * Error logger
 * Only logs requests that resulted in 4xx or 5xx responses
 * Helps identify client errors and server issues
 * 
 * @see https://expressjs.com/en/guide/error-handling.html
 */
const errorLogger = morgan(logFormat, {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400  // Only log errors
});

// ============================================================
// SECURITY LOGGING
// Detects and logs suspicious request patterns
// ============================================================

/**
 * Security logger middleware
 * Checks incoming requests for suspicious patterns that may indicate:
 * - SQL injection attempts
 * - XSS (Cross-Site Scripting) attacks
 * - Command injection attempts
 * 
 * Logs security alerts to security.log for monitoring and analysis
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const securityLogger = (req, res, next) => {
  // Patterns that indicate potential security threats
  const suspiciousPatterns = [
    /script.*alert/i,      // XSS attempts (script + alert)
    /union.*select/i,       // SQL injection (UNION SELECT)
    /drop.*table/i,         // SQL injection (DROP TABLE)
    /<script/i,            // XSS attempts (<script)
    /javascript:/i          // XSS attempts (javascript:)
  ];
  
  // Get request URL and User-Agent for pattern matching
  const url = req.url.toLowerCase();
  const userAgent = (req.get('User-Agent') || '').toLowerCase();
  
  // Check each pattern against URL and User-Agent
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      // Create structured log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'SECURITY_ALERT',
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        reqId: req.reqId,
        pattern: pattern.source
      };
      
      // Append to security log
      fs.appendFile(
        path.join(logsDir, 'security.log'),
        JSON.stringify(logEntry) + '\n',
        (error) => {
          if (error) {
            console.error('Error writing security log:', error);
          }
        }
      );
      
      // Log to console for immediate visibility
      console.warn(`[SECURITY] Suspicious pattern detected: ${pattern.source} from ${logEntry.ip}`);
    }
  }
  
  next();
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  addRequestId,      // Add unique request ID to each request
  requestLogger,    // Log all requests to access.log
  errorLogger,      // Log errors to error.log
  securityLogger    // Log security alerts
};

/**
 * LOG FILE DESCRIPTIONS:
 * 
 * access.log   - All HTTP requests (method, URL, status, duration)
 * error.log    - Only error responses (4xx, 5xx status codes)
 * security.log - Security alerts (suspicious patterns detected)
 * 
 * LOG ROTATION:
 * For production, consider using a log rotation tool like:
 * - logrotate (Linux)
 * - winston-daily-rotate-file (Node.js)
 * - loggly, papertrail, or other log management services
 */