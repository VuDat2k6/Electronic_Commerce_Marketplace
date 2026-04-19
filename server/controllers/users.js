/**
 * Users Controller
 * 
 * Handles all user-related operations including:
 * - User registration and authentication
 * - User profile management
 * - Role-based access control
 * - Password hashing and security
 * 
 * @module controllers/users
 */

const prisma = require("../utills/db");
const bcrypt = require("bcryptjs");
const { asyncHandler, AppError } = require("../utills/errorHandler");

// ============================================================
// HELPER FUNCTIONS
// Utility functions used across multiple controller methods
// ============================================================

/**
 * Removes password field from user object before sending response
 * Ensures sensitive data is never exposed to clients
 * 
 * @param {Object} user - User object from database
 * @returns {Object} User object without password field
 */
function excludePassword(user) {
  if (!user) return user;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ============================================================
// USER CONTROLLER FUNCTIONS
// Main business logic for user operations
// ============================================================

/**
 * GET /api/users
 * 
 * Retrieves all users in the system
 * Used primarily by admin dashboard
 * 
 * @param {Request} request - Express request object
 * @param {Response} response - Express response object
 */
const getAllUsers = asyncHandler(async (request, response) => {
  const users = await prisma.user.findMany({});
  // Remove passwords from all user objects before returning
  const usersWithoutPasswords = users.map(user => excludePassword(user));
  return response.json(usersWithoutPasswords);
});

/**
 * POST /api/users
 * 
 * Creates a new user account
 * Hashes password before storing and validates input
 * 
 * Request Body:
 * - email: User email address (required)
 * - password: User password, minimum 8 characters (required)
 * - role: User role (optional, defaults to "user")
 * 
 * @param {Request} request - Express request with user data
 * @param {Response} response - Express response object
 */
const createUser = asyncHandler(async (request, response) => {
  const { email, password, role } = request.body;

  // Validate required fields
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // Validate email format using regex
  // Ensures email has proper structure: user@domain.extension
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  // Validate password length for security
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }

  // Hash password using bcrypt with salt rounds of 14
  // Higher rounds = more secure but slower
  const hashedPassword = await bcrypt.hash(password, 14);

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: role || "user",
    },
  });
  
  // Return user data without password
  return response.status(201).json(excludePassword(user));
});

/**
 * PUT /api/users/:id
 * 
 * Updates an existing user's profile
 * Can update email, password, or role
 * Password is hashed before storing if provided
 * 
 * @param {Request} request - Express request with user ID and update data
 * @param {Response} response - Express response object
 */
const updateUser = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { email, password, role } = request.body;

  // Validate user ID
  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Prepare update data object
  const updateData = {};
  
  // Validate and add email if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Invalid email format", 400);
    }
    updateData.email = email;
  }
  
  // Hash and add new password if provided
  if (password) {
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }
    updateData.password = await bcrypt.hash(password, 14);
  }
  
  // Add role if provided
  if (role) {
    updateData.role = role;
  }

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: updateData,
  });

  // Return updated user data without password
  return response.status(200).json(excludePassword(updatedUser));
});

/**
 * DELETE /api/users/:id
 * 
 * Deletes a user from the system
 * User must exist before deletion
 * 
 * @param {Request} request - Express request with user ID
 * @param {Response} response - Express response object
 */
const deleteUser = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Delete user from database
  await prisma.user.delete({
    where: {
      id: id,
    },
  });
  
  return response.status(204).send();
});

/**
 * GET /api/users/:id
 * 
 * Retrieves a single user by ID
 * Used for profile viewing and editing
 * 
 * @param {Request} request - Express request with user ID
 * @param {Response} response - Express response object
 */
const getUser = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Find user by ID
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  // Return user data without password
  return response.status(200).json(excludePassword(user));
});

/**
 * GET /api/users/email/:email
 * 
 * Retrieves a user by their email address
 * Primarily used for authentication and email verification
 * 
 * @param {Request} request - Express request with email parameter
 * @param {Response} response - Express response object
 */
const getUserByEmail = asyncHandler(async (request, response) => {
  const { email } = request.params;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  // Return user data without password
  return response.status(200).json(excludePassword(user));
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getUserByEmail,
};
