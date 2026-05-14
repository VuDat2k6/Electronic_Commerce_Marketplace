/**
 * Products Controller
 * 
 * Handles all product-related operations including:
 * - Listing products with filtering, sorting, and pagination
 * - CRUD operations (Create, Read, Update, Delete)
 * - Search functionality
 * 
 * @module controllers/products
 */

const prisma = require("../utills/db"); // Shared database connection with SSL support
const { asyncHandler, handleServerError, AppError } = require("../utills/errorHandler");

// ============================================================
// SECURITY WHITELISTS
// Define allowed values to prevent injection attacks
// ============================================================

/**
 * Allowed filter types for product queries
 * Prevents SQL injection through query parameters
 */
const ALLOWED_FILTER_TYPES = ['price', 'rating', 'category', 'inStock', 'outOfStock'];

/**
 * Allowed comparison operators for filtering
 * Limits what operators can be used in queries
 */
const ALLOWED_OPERATORS = ['gte', 'lte', 'gt', 'lt', 'equals', 'contains'];

/**
 * Allowed sort values
 * Prevents arbitrary sorting that could cause performance issues
 */
const ALLOWED_SORT_VALUES = ['defaultSort', 'titleAsc', 'titleDesc', 'lowPrice', 'highPrice'];

// ============================================================
// INPUT VALIDATION FUNCTIONS
// Validate and sanitize user input before database queries
// ============================================================

/**
 * Validates if a filter type is in the allowed list
 * @param {string} filterType - The filter type to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateFilterType(filterType) {
  return ALLOWED_FILTER_TYPES.includes(filterType);
}

/**
 * Validates if an operator is in the allowed list
 * @param {string} operator - The operator to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateOperator(operator) {
  return ALLOWED_OPERATORS.includes(operator);
}

/**
 * Validates if a sort value is in the allowed list
 * @param {string} sortValue - The sort value to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateSortValue(sortValue) {
  return ALLOWED_SORT_VALUES.includes(sortValue);
}

/**
 * Validates and sanitizes filter values based on their type
 * Converts string values to appropriate types for database queries
 * 
 * @param {string} filterType - Type of filter (price, rating, category, etc.)
 * @param {any} filterValue - The value to sanitize
 * @returns {number|string|null} Sanitized value or null if invalid
 */
function validateAndSanitizeFilterValue(filterType, filterValue) {
  switch (filterType) {
    case 'price':
    case 'rating':
    case 'inStock':
    case 'outOfStock':
      // Convert to integer for numeric filters
      const numValue = parseInt(filterValue);
      return isNaN(numValue) ? null : numValue;
    case 'category':
      // For category, ensure it's a non-empty string
      return typeof filterValue === 'string' && filterValue.trim().length > 0 
        ? filterValue.trim() 
        : null;
    default:
      return null;
  }
}

/**
 * Builds a safe filter object from an array of filter parameters
 * Validates each parameter before adding to the filter object
 * 
 * @param {Array} filterArray - Array of filter objects {filterType, filterOperator, filterValue}
 * @returns {Object} Validated filter object for Prisma query
 */
function buildSafeFilterObject(filterArray) {
  const filterObj = {};
  
  for (const item of filterArray) {
    // Validate filter type against whitelist
    if (!validateFilterType(item.filterType)) {
      console.warn(`Invalid filter type: ${item.filterType}`);
      continue;
    }
    
    // Validate operator against whitelist
    if (!validateOperator(item.filterOperator)) {
      console.warn(`Invalid operator: ${item.filterOperator}`);
      continue;
    }
    
    // Validate and sanitize filter value
    const sanitizedValue = validateAndSanitizeFilterValue(item.filterType, item.filterValue);
    if (sanitizedValue === null) {
      console.warn(`Invalid filter value for ${item.filterType}: ${item.filterValue}`);
      continue;
    }
    
    // Build filter object with validated parameters
    filterObj[item.filterType] = {
      [item.filterOperator]: sanitizedValue,
    };
  }
  
  return filterObj;
}

// ============================================================
// PRODUCT CONTROLLER FUNCTIONS
// Main business logic for product operations
// ============================================================

/**
 * GET /api/products
 * 
 * Retrieves all products with optional filtering, sorting, and pagination
 * 
 * Query Parameters:
 * - mode=admin: Returns all products without pagination/filtering (for admin panel)
 * - page: Page number for pagination (default: 1)
 * - filters[filterType][$operator]=value: Filter products
 * - sort=value: Sort order (titleAsc, titleDesc, lowPrice, highPrice)
 * 
 * @param {Request} request - Express request object
 * @param {Response} response - Express response object
 */
const getAllProducts = asyncHandler(async (request, response) => {
  const mode = request.query.mode || "";

  // Admin mode: Return products with pagination (max 100 per page)
  // Used in admin dashboard with paginated results
  if(mode === "admin"){
    const page = Math.max(parseInt(request.query.page) || 1, 1);
    const limit = Math.min(parseInt(request.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [adminProducts, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          seller: { select: { id: true, shopName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count()
    ]);

    return response.json({
      products: adminProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } else {
    // Customer mode: Apply filtering, sorting, and pagination
    const dividerLocation = request.url.indexOf("?");
    let filterObj = {};
    let sortObj = {};
    let sortByValue = "defaultSort";

    // Parse and validate page number
    const page = Number(request.query.page);
    const validatedPage = (page && page > 0) ? page : 1;

    // Parse query string for filter and sort parameters
    if (dividerLocation !== -1) {
      const queryArray = request.url
        .substring(dividerLocation + 1, request.url.length)
        .split("&");

      let filterType;
      let filterArray = [];

      // Process each query parameter
      for (let i = 0; i < queryArray.length; i++) {
        const queryParam = queryArray[i];
        
        // Extract filter type from parameter name
        if (queryParam.includes("filters")) {
          if (queryParam.includes("price")) {
            filterType = "price";
          } else if (queryParam.includes("rating")) {
            filterType = "rating";
          } else if (queryParam.includes("category")) {
            filterType = "category";
          } else if (queryParam.includes("inStock")) {
            filterType = "inStock";
          } else if (queryParam.includes("outOfStock")) {
            filterType = "outOfStock";
          } else {
            // Skip unknown filter types for security
            continue;
          }
        }

        // Extract and validate sort parameter
        if (queryParam.includes("sort")) {
          const extractedSortValue = queryParam.substring(queryParam.indexOf("=") + 1);
          if (validateSortValue(extractedSortValue)) {
            sortByValue = extractedSortValue;
          }
        }

        // Extract filter parameters (type, operator, value)
        if (queryParam.includes("filters") && filterType) {
          let filterValue;
          
          // Extract filter value based on type
          if (filterType === "category") {
            // Category values are strings
            filterValue = queryParam.substring(queryParam.indexOf("=") + 1);
          } else {
            // Numeric values (price, rating, stock)
            const numValue = parseInt(queryParam.substring(queryParam.indexOf("=") + 1));
            filterValue = isNaN(numValue) ? null : numValue;
          }

          // Extract operator from between $ and =
          const operatorStart = queryParam.indexOf("$") + 1;
          const operatorEnd = queryParam.indexOf("=") - 1;
          
          if (operatorStart > 0 && operatorEnd > operatorStart) {
            const filterOperator = queryParam.substring(operatorStart, operatorEnd);
            
            // Add to filter array if all values are valid
            if (filterValue !== null && filterOperator) {
              filterArray.push({ 
                filterType, 
                filterOperator, 
                filterValue 
              });
            }
          }
        }
      }
      
      // Build validated filter object
      filterObj = buildSafeFilterObject(filterArray);
    }

    // Build WHERE clause from filter object
    let whereClause = { ...filterObj };

    // Handle category filter separately (requires join)
    if (filterObj.category && filterObj.category.equals) {
      delete whereClause.category;
    }

    // Build sort object based on sort value
    switch (sortByValue) {
      case "defaultSort":
        sortObj = {};
        break;
      case "titleAsc":
        sortObj = { title: "asc" };
        break;
      case "titleDesc":
        sortObj = { title: "desc" };
        break;
      case "lowPrice":
        sortObj = { price: "asc" };
        break;
      case "highPrice":
        sortObj = { price: "desc" };
        break;
      default:
        sortObj = {};
    }

    // Execute database query with or without filters
    let products;

    if (Object.keys(filterObj).length === 0) {
      // No filters - simple query with pagination
      products = await prisma.product.findMany({
        skip: (validatedPage - 1) * 12,
        take: 12,
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: sortObj,
      });
    } else {
      // Has filters - apply WHERE clause
      if (filterObj.category && filterObj.category.equals) {
        // Category filter requires relation query
        products = await prisma.product.findMany({
          skip: (validatedPage - 1) * 12,
          take: 12,
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
          where: {
            ...whereClause,
            category: {
              name: {
                equals: filterObj.category.equals,
              },
            },
          },
          orderBy: sortObj,
        });
      } else {
        // Numeric filters
        products = await prisma.product.findMany({
          skip: (validatedPage - 1) * 12,
          take: 12,
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
          where: whereClause,
          orderBy: sortObj,
        });
      }
    }

    return response.json(products);
  }
});

/**
 * POST /api/products
 * 
 * Creates a new product
 * 
 * Request Body:
 * - merchantId: ID of the seller/merchant
 * - slug: URL-friendly identifier
 * - title: Product name
 * - mainImage: Primary product image URL
 * - price: Product price (integer, in cents)
 * - description: Product description
 * - manufacturer: Manufacturer name
 * - categoryId: ID of the product category
 * - inStock: Number of items in stock
 * - status: Product status (default: "DRAFT")
 * 
 * @param {Request} request - Express request object with product data
 * @param {Response} response - Express response object
 */
const createProduct = asyncHandler(async (request, response) => {
  const {
    sellerId,
    slug,
    title,
    mainImage,
    price,
    description,
    manufacturer,
    categoryId,
    inStock,
    status,
  } = request.body;

  // Validate required fields
  if (!title) {
    throw new AppError("Missing required field: title", 400);
  }

  if (!sellerId) {
    throw new AppError("Missing required field: sellerId", 400);
  }

  if (!slug) {
    throw new AppError("Missing required field: slug", 400);
  }

  if (price === undefined || price === null) {
    throw new AppError("Missing required field: price", 400);
  }

  if (!categoryId) {
    throw new AppError("Missing required field: categoryId", 400);
  }

  // Create product in database
  const product = await prisma.product.create({
    data: {
      sellerId,
      slug,
      title,
      mainImage,
      price,
      rating: 5, // Default rating for new products
      description,
      manufacturer,
      categoryId,
      inStock,
      status: status || "DRAFT",
    },
  });

  return response.status(201).json(product);
});

/**
 * PUT /api/products/:id
 * 
 * Updates an existing product
 * Only updates fields that are provided in the request body
 * 
 * @param {Request} request - Express request with product ID and update data
 * @param {Response} response - Express response object
 */
const updateProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const {
    sellerId,
    slug,
    title,
    mainImage,
    price,
    rating,
    description,
    manufacturer,
    categoryId,
    inStock,
    status,
  } = request.body;

  // Validate product ID
  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  const updateData = {};

  if (sellerId !== undefined) updateData.sellerId = sellerId;
  if (title !== undefined) updateData.title = title;
  if (mainImage !== undefined) updateData.mainImage = mainImage;
  if (slug !== undefined) updateData.slug = slug;
  if (price !== undefined) updateData.price = price;
  if (rating !== undefined) updateData.rating = rating;
  if (description !== undefined) updateData.description = description;
  if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (inStock !== undefined) updateData.inStock = inStock;
  if (status !== undefined) updateData.status = status;

  // Update product with provided fields
  const updatedProduct = await prisma.product.update({
    where: {
      id,
    },
    data: updateData,
  });

  return response.status(200).json(updatedProduct);
});

/**
 * DELETE /api/products/:id
 * 
 * Deletes a product from the database
 * Cannot delete products that have associated order records
 * 
 * @param {Request} request - Express request with product ID
 * @param {Response} response - Express response object
 */
const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  // Check for related order records using Order_item (not SubOrder)
  // Products with orders cannot be deleted to maintain order history
  const relatedOrderItems = await prisma.order_item.count({
    where: {
      productId: id,
    },
  });

  if (relatedOrderItems > 0) {
    throw new AppError("Cannot delete product because it has order records", 400);
  }

  // Delete product
  await prisma.product.delete({
    where: {
      id,
    },
  });
  
  return response.status(204).send();
});

/**
 * GET /api/products/search
 * 
 * Legacy search endpoint - searches products by title or description
 * Note: This is a simple contains search, for advanced search use /api/search
 * 
 * @param {Request} request - Express request with query parameter
 * @param {Response} response - Express response object
 */
const searchProducts = asyncHandler(async (request, response) => {
  const { query } = request.query;
  
  if (!query) {
    throw new AppError("Query parameter is required", 400);
  }

  // Search in title and description fields (removed mode: "insensitive" - not supported in MySQL)
  const products = await prisma.product.findMany({
    where: {
      OR: [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ],
    },
  });

  return response.json(products);
});

/**
 * GET /api/products/:id
 * 
 * Retrieves a single product by ID with its category
 * 
 * @param {Request} request - Express request with product ID
 * @param {Response} response - Express response object
 */
const getProductById = asyncHandler(async (request, response) => {
  const { id } = request.params;
  
  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  // Find product by ID
  const product = await prisma.product.findUnique({
    where: {
      id: id,
    },
    include: {
      category: true,
    },
  });
  
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  
  return response.status(200).json(product);
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductById,
};``