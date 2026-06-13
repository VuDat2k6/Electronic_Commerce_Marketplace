/**
 * Category Controller
 * 
 * Handles product category management:
 * - Creating new categories
 * - Updating existing categories
 * - Deleting categories
 * - Listing all categories
 * 
 * Categories help organize products for better user navigation
 * and filtering in the e-commerce platform.
 * 
 * @module controllers/category
 */

const prisma = require("../utils/db");
const { asyncHandler, AppError } = require("../utils/errorHandler");

// ============================================================
// CATEGORY CONTROLLER FUNCTIONS
// Main business logic for category operations
// ============================================================

/**
 * POST /api/categories
 * 
 * Creates a new product category
 * Category names must be unique to prevent duplicates
 * 
 * Request Body:
 * - name: Category name (required)
 * 
 * @param {Request} request - Express request with category data
 * @param {Response} response - Express response object
 */
const createCategory = asyncHandler(async (request, response) => {
  const { name } = request.body;

  // Validate category name
  if (!name || name.trim().length === 0) {
    throw new AppError("Category name is required", 400);
  }

  const trimmedName = name.trim();

  // Check duplicate category name
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: trimmedName,
    },
  });

  if (existingCategory) {
    throw new AppError("Category already exists", 400);
  }

  // Create category with trimmed name
  const category = await prisma.category.create({
    data: {
      name: trimmedName,
    },
  });
  
  return response.status(201).json(category);
});

/**
 * PUT /api/categories/:id
 * 
 * Updates an existing category's name
 * Validates that category exists before updating
 * 
 * @param {Request} request - Express request with category ID and new name
 * @param {Response} response - Express response object
 */
const updateCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { name } = request.body;

  // Validate category ID
  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  // Validate new name
  if (!name || name.trim().length === 0) {
    throw new AppError("Category name is required", 400);
  }

  const trimmedName = name.trim();

  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  // Check duplicate category name on other category
  const duplicateCategory = await prisma.category.findFirst({
    where: {
      name: trimmedName,
      NOT: {
        id: id,
      },
    },
  });

  if (duplicateCategory) {
    throw new AppError("Category already exists", 400);
  }

  // Update category with new name
  const updatedCategory = await prisma.category.update({
    where: {
      id: existingCategory.id,
    },
    data: {
      name: trimmedName,
    },
  });

  return response.status(200).json(updatedCategory);
});

/**
 * DELETE /api/categories/:id
 * 
 * Deletes a category from the system
 * Categories with associated products cannot be deleted
 * to maintain data integrity and product references
 * 
 * @param {Request} request - Express request with category ID
 * @param {Response} response - Express response object
 */
const deleteCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  // Check if category has any products
  // Products reference categories via foreign key
  // Cannot delete category if products are using it
  const productsWithCategory = await prisma.product.findFirst({
    where: {
      categoryId: id,
    },
  });

  if (productsWithCategory) {
    throw new AppError("Cannot delete category that has products", 400);
  }

  // Delete category from database
  await prisma.category.delete({
    where: {
      id: id,
    },
  });
  
  return response.status(204).send();
});

/**
 * GET /api/categories/:id
 * 
 * Retrieves a single category by ID
 * Used for category detail view and editing
 * 
 * @param {Request} request - Express request with category ID
 * @param {Response} response - Express response object
 */
const getCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  // Find category by ID
  const category = await prisma.category.findUnique({
    where: {
      id: id,
    },
  });
  
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  
  return response.status(200).json(category);
});

/**
 * GET /api/categories
 * 
 * Retrieves all categories in the system
 * Used for category listing and navigation menus
 * 
 * @param {Request} request - Express request object
 * @param {Response} response - Express response object
 */
const getAllCategories = asyncHandler(async (request, response) => {
  const categories = await prisma.category.findMany({});
  return response.json(categories);
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
};