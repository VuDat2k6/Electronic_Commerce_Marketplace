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

const prisma = require("../utils/db");
const bcrypt = require("bcryptjs");
const { asyncHandler, AppError } = require("../utils/errorHandler");
const { ROLES } = require("../middleware/auth");

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function excludePassword(user) {
  if (!user) return user;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ============================================================
// USER CONTROLLER FUNCTIONS
// ============================================================

/**
 * GET /api/users/me
 * 
 * Retrieves the current authenticated user's profile
 * Requires valid JWT token
 * 
 * @param {Request} request - Express request with authenticated user
 * @param {Response} response - Express response object
 */
const getMe = asyncHandler(async (request, response) => {
  const userId = request.user.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      shopName: true,
      shopDescription: true,
      shopPhone: true,
      shopAddress: true,
      shopStatus: true,
      shopApprovedAt: true,
      shopCreatedAt: true,
      createdAt: true
    }
  });
  
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  return response.json(user);
});

/**
 * GET /api/users
 * 
 * Retrieves all users in the system
 * Admin only - paginated response
 * 
 * @param {Request} request - Express request object
 * @param {Response} response - Express response object
 */
const getAllUsers = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        shopName: true,
        shopStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ]);
  
  return response.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

/**
 * POST /api/users
 * 
 * Creates a new user account
 * Hashes password before storing and validates input
 * Public endpoint - no authentication required
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  // Validate password length
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  // Validate role if provided (prevent arbitrary role assignment)
  if (role && ![ROLES.BUYER, ROLES.SELLER].includes(role)) {
    throw new AppError("Invalid role. Must be 'buyer' or 'seller'", 400);
  }

  // Hash password - using cost factor 12 for better performance
  // (cost factor 14 blocks the event loop for ~1-2s per hash)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user with role buyer by default
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: role || ROLES.BUYER,
    },
  });
  
  return response.status(201).json(excludePassword(user));
});

/**
 * PUT /api/users/:id
 * 
 * Updates an existing user's profile
 * Users can update their own profile
 * Only admins can update roles or other users
 * 
 * @param {Request} request - Express request with user ID and update data
 * @param {Response} response - Express response object
 */
const updateUser = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { email, password, role } = request.body;
  const currentUser = request.user;

  // Check authorization - user can only update their own profile unless admin
  if (currentUser.role !== ROLES.ADMIN && currentUser.id !== id) {
    throw new AppError("You can only update your own profile", 403);
  }

  // Validate user ID
  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Prepare update data object
  const updateData = {};
  
  // Only admin can change role
  if (role) {
    if (currentUser.role !== ROLES.ADMIN) {
      throw new AppError("Only admins can change user roles", 403);
    }
    if (![ROLES.BUYER, ROLES.SELLER, ROLES.ADMIN].includes(role)) {
      throw new AppError("Invalid role", 400);
    }
    updateData.role = role;
  }
  
  // Validate and add email if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Invalid email format", 400);
    }
    
    // Check if email is already taken by another user
    const emailExists = await prisma.user.findFirst({
      where: { email, id: { not: id } }
    });
    if (emailExists) {
      throw new AppError("Email is already in use", 409);
    }
    updateData.email = email;
  }
  
  // Hash and add new password if provided
  if (password) {
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }
    updateData.password = await bcrypt.hash(password, 12);
  }

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: updateData,
  });

  return response.status(200).json(excludePassword(updatedUser));
});

/**
 * DELETE /api/users/:id
 * 
 * Deletes a user from the system
 * Admin only
 * 
 * @param {Request} request - Express request with user ID
 * @param {Response} response - Express response object
 */
const deleteUser = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Prevent self-deletion
  if (request.user.id === id) {
    throw new AppError("You cannot delete your own account", 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Delete user from database
  await prisma.user.delete({
    where: { id }
  });
  
  return response.status(204).send();
});

/**
 * GET /api/users/:id
 * 
 * Retrieves a single user by ID
 * Users can view their own profile, admins can view any profile
 * 
 * @param {Request} request - Express request with user ID
 * @param {Response} response - Express response object
 */
const getUser = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const currentUser = request.user;

  if (!id) {
    throw new AppError("User ID is required", 400);
  }

  // Users can only view their own profile unless admin
  if (currentUser.role !== ROLES.ADMIN && currentUser.id !== id) {
    throw new AppError("You can only view your own profile", 403);
  }

  // Find user by ID
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      shopName: true,
      shopDescription: true,
      shopPhone: true,
      shopAddress: true,
      shopStatus: true,
      shopApprovedAt: true,
      shopCreatedAt: true,
      createdAt: true
    }
  });
  
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  return response.status(200).json(user);
});

/**
 * GET /api/users/email/:email
 * 
 * Retrieves a user by their email address
 * Used for authentication flows (forgot password, etc.)
 * 
 * @param {Request} request - Express request with email parameter
 * @param {Response} response - Express response object
 */
const getUserByEmail = asyncHandler(async (request, response) => {
  const { email } = request.params;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  // Validate email format to prevent injection
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  // Find user by email - only return basic info for security
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      shopStatus: true
    }
  });
  
  if (!user) {
    // Return 404 to prevent user enumeration
    throw new AppError("User not found", 404);
  }
  
  return response.status(200).json(user);
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
  getMe
};
