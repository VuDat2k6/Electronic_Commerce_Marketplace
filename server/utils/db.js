/**
 * Database Connection Utility
 * 
 * Provides a singleton Prisma client instance for the entire application.
 * This module:
 * - Creates a single shared Prisma client instance
 * - Validates DATABASE_URL environment variable
 * - Configures SSL settings for production
 * - Enables query logging in development mode
 * - Prevents multiple connections in development (HMR safe)
 * 
 * @module utils/db
 */

// ============================================================
// PRISMA CLIENT INITIALIZATION
// Handle both server/ and root-level node_modules paths
// ============================================================

// Try to load Prisma Client from local server node_modules first
// Falls back to root node_modules if not available
let PrismaClient;
try {
    // First try local node_modules in server folder
    ({ PrismaClient } = require("@prisma/client"));
} catch (e) {
    // Fallback to root node_modules
    try {
        ({ PrismaClient } = require("../../node_modules/@prisma/client"));
    } catch (e2) {
        throw new Error('Cannot find @prisma/client. Please run "npm install" and "npx prisma generate" in the server directory.');
    }
}

// ============================================================
// PRISMA CLIENT FACTORY
// Creates and configures the Prisma client instance
// ============================================================

/**
 * Creates a configured Prisma client instance
 * Validates environment and configures logging
 * 
 * @returns {PrismaClient} Configured Prisma client instance
 */
const prismaClientSingleton = () => {
    // Validate required environment variable
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    // Parse DATABASE_URL for debugging SSL configuration
    const databaseUrl = process.env.DATABASE_URL;
    const url = new URL(databaseUrl);
    
    // Log connection details in development mode
    if (process.env.NODE_ENV === "development") {
        console.log(` Database connection: ${url.protocol}//${url.hostname}:${url.port || '3306'}`);
        console.log(`🔒 SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
    }

    // Create Prisma client with appropriate logging
    return new PrismaClient({
        // Enable query logging in development, minimal logging in production
        log: process.env.NODE_ENV === "development" 
            ? ['query', 'info', 'warn', 'error']
            : ['error', 'warn'],
    });
}

// ============================================================
// SINGLETON PATTERN
// Ensures only one Prisma client instance exists
// Critical for preventing connection pool exhaustion in development
// ============================================================

// Use global to persist client across hot reloads in development
const globalForPrisma = globalThis;

// Create singleton instance or reuse existing one
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Export the Prisma client
module.exports = prisma;

// Store in global to prevent hot reload issues in development
// In production, globals are typically reset so this only affects dev
if(process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * USAGE EXAMPLE:
 * 
 * const prisma = require('./utils/db');
 * 
 * // Query all users
 * const users = await prisma.user.findMany();
 * 
 * // Create a new user
 * const newUser = await prisma.user.create({
 *   data: {
 *     email: 'user@example.com',
 *     name: 'John Doe',
 *   },
 * });
 * 
 * // Update a user
 * const updated = await prisma.user.update({
 *   where: { id: 1 },
 *   data: { name: 'Jane Doe' },
 * });
 * 
 * // Delete a user
 * await prisma.user.delete({
 *   where: { id: 1 },
 * });
 */
