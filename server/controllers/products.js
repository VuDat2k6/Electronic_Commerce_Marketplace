/**
 * Products Controller with Authentication and IDOR Protection
 * 
 * Handles all product-related operations including:
 * - Listing products with filtering, sorting, and pagination (public)
 * - CRUD operations (authenticated seller/admin only)
 * - Search functionality (public)
 * 
 * Security measures:
 * - sellerId comes from JWT token, not request body
 * - Sellers can only modify their own products
 * - Admins can modify any product
 * 
 * @module controllers/products
 */

const prisma = require("../utils/db");
const { asyncHandler, AppError } = require("../utils/errorHandler");
const { ROLES } = require("../middleware/auth");

// ============================================================
// SECURITY WHITELISTS
// ============================================================

const ALLOWED_FILTER_TYPES = ['price', 'rating', 'category', 'inStock', 'outOfStock'];
const ALLOWED_OPERATORS = ['gte', 'lte', 'gt', 'lt', 'equals', 'contains'];
const ALLOWED_SORT_VALUES = ['defaultSort', 'titleAsc', 'titleDesc', 'lowPrice', 'highPrice'];
const ALLOWED_PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const ALLOWED_WARNING_TYPES = [
  'POLICY_VIOLATION',
  'MISLEADING_INFORMATION',
  'COUNTERFEIT_RISK',
  'PROHIBITED_ITEM',
  'IMAGE_OR_BRAND_MISUSE',
  'OTHER',
];
const ALLOWED_WARNING_PRIORITIES = ['NORMAL', 'HIGH', 'URGENT'];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function validateFilterType(filterType) {
  return ALLOWED_FILTER_TYPES.includes(filterType);
}

function validateOperator(operator) {
  return ALLOWED_OPERATORS.includes(operator);
}

function validateSortValue(sortValue) {
  return ALLOWED_SORT_VALUES.includes(sortValue);
}

function requireWholeNumber(value, fieldName, minimum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    const requirement = minimum === 1 ? 'a positive whole VND amount' : 'a non-negative whole number';
    throw new AppError(`${fieldName} must be ${requirement}`, 400);
  }
  return parsed;
}

function validateAndSanitizeFilterValue(filterType, filterValue) {
  switch (filterType) {
    case 'price':
    case 'rating':
    case 'inStock':
    case 'outOfStock':
      const numValue = parseInt(filterValue);
      return isNaN(numValue) ? null : numValue;
    case 'category':
      return typeof filterValue === 'string' && filterValue.trim().length > 0 
        ? filterValue.trim() 
        : null;
    default:
      return null;
  }
}

function buildSafeFilterObject(filterArray) {
  const filterObj = {};
  
  for (const item of filterArray) {
    if (!validateFilterType(item.filterType)) continue;
    if (!validateOperator(item.filterOperator)) continue;
    
    const sanitizedValue = validateAndSanitizeFilterValue(item.filterType, item.filterValue);
    if (sanitizedValue === null) continue;
    
    filterObj[item.filterType] = {
      [item.filterOperator]: sanitizedValue,
    };
  }
  
  return filterObj;
}

function activeSellerFilter() {
  return {
    seller: {
      is: {
        role: ROLES.SELLER,
        shopStatus: 'ACTIVE',
      },
    },
  };
}

/**
 * Get seller ID from authenticated user
 * Prevents IDOR by using token instead of request body
 */
function getSellerIdFromRequest(req) {
  if (req.user.role === ROLES.SELLER) {
    return req.user.id;
  }
  if (req.user.role === ROLES.ADMIN && req.body.sellerId) {
    return req.body.sellerId;
  }
  return req.user.id;
}

/**
 * Verify seller can modify product (IDOR protection)
 */
async function verifyProductOwnership(req, productId) {
  const user = req.user;
  
  if (user.role === ROLES.ADMIN) return;
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true }
  });
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  if (product.sellerId !== user.id) {
    throw new AppError('You do not have permission to modify this product', 403);
  }
}

// ============================================================
// PRODUCT CONTROLLER FUNCTIONS
// ============================================================

/**
 * GET /api/products
 * Public - list products with filtering, sorting, pagination
 */
const getAllProducts = asyncHandler(async (request, response) => {
  const mode = request.query.mode || "";

  if (mode === "admin") {
    const page = Math.max(parseInt(request.query.page) || 1, 1);
    const limit = Math.min(parseInt(request.query.limit) || 50, 100);
    const skip = (page - 1) * limit;
    const searchTerm = typeof request.query.search === 'string'
      ? request.query.search.trim().slice(0, 100)
      : '';
    const requestedStatus = String(request.query.status || '').toUpperCase();
    const status = ALLOWED_PRODUCT_STATUSES.includes(requestedStatus) ? requestedStatus : null;
    const where = {
      ...(status ? { status } : {}),
      ...(searchTerm ? {
        OR: [
          { title: { contains: searchTerm } },
          { slug: { contains: searchTerm } },
          { manufacturer: { contains: searchTerm } },
          { seller: { is: { shopName: { contains: searchTerm } } } },
        ],
      } : {}),
    };

    const [adminProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          seller: { select: { id: true, email: true, shopName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return response.json({
      products: adminProducts,
      pagination: {
        page, limit, total, totalPages: Math.ceil(total / limit)
      }
    });
  }

  const dividerLocation = request.url.indexOf("?");
  let filterObj = {};
  let sortObj = {};
  let sortByValue = "defaultSort";

  const page = Number(request.query.page);
  const validatedPage = (page && page > 0) ? page : 1;

  if (dividerLocation !== -1) {
    const searchParams = new URLSearchParams(
      request.url.substring(dividerLocation + 1, request.url.length)
    );
    let filterArray = [];

    const requestedSort = searchParams.get("sort");
    if (requestedSort && validateSortValue(requestedSort)) {
      sortByValue = requestedSort;
    }

    for (const [key, rawValue] of searchParams.entries()) {
      const match = key.match(/^filters\[([^\]]+)\]\[\$([^\]]+)\]$/);
      if (!match) continue;

      const [, filterType, filterOperator] = match;
      let filterValue;

      if (filterType === "category") {
        filterValue = rawValue;
      } else {
        const numValue = parseInt(rawValue, 10);
        filterValue = isNaN(numValue) ? null : numValue;
      }

      if (filterValue !== null && filterOperator) {
        filterArray.push({ filterType, filterOperator, filterValue });
      }
    }

    filterObj = buildSafeFilterObject(filterArray);
  }

  let whereClause = { status: 'PUBLISHED', ...activeSellerFilter(), ...filterObj };
  if (filterObj.category && filterObj.category.equals) {
    delete whereClause.category;
  }

  switch (sortByValue) {
    case "titleAsc": sortObj = { title: "asc" }; break;
    case "titleDesc": sortObj = { title: "desc" }; break;
    case "lowPrice": sortObj = { price: "asc" }; break;
    case "highPrice": sortObj = { price: "desc" }; break;
    default: sortObj = {};
  }

  let products;
  const queryOptions = {
    skip: (validatedPage - 1) * 12,
    take: 12,
    include: {
      category: { select: { name: true } },
      seller: { select: { id: true, shopName: true } },
    },
    orderBy: sortObj,
    where: { status: 'PUBLISHED', ...activeSellerFilter() },
  };

  if (Object.keys(filterObj).length === 0) {
    products = await prisma.product.findMany(queryOptions);
  } else if (filterObj.category && filterObj.category.equals) {
    products = await prisma.product.findMany({
      ...queryOptions,
      where: {
        ...whereClause,
        category: { name: { equals: filterObj.category.equals } },
      },
    });
  } else {
    products = await prisma.product.findMany({
      ...queryOptions,
      where: whereClause,
    });
  }

  return response.json(products);
});

/**
 * POST /api/products
 * Authenticated active seller only - uses sellerId from JWT token
 */
const createProduct = asyncHandler(async (request, response) => {
  const sellerId = getSellerIdFromRequest(request);
  const {
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

  if (!title) throw new AppError("Missing required field: title", 400);
  if (!slug) throw new AppError("Missing required field: slug", 400);
  if (price === undefined || price === null) throw new AppError("Missing required field: price", 400);
  if (!categoryId) throw new AppError("Missing required field: categoryId", 400);

  const validatedPrice = requireWholeNumber(price, "price", 1);
  const validatedStock = requireWholeNumber(inStock ?? 1, "inStock", 0);

  // Verify seller exists and is approved
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== ROLES.SELLER) {
    throw new AppError("Invalid seller", 403);
  }
  if (seller.shopStatus !== 'ACTIVE' && seller.role !== ROLES.ADMIN) {
    throw new AppError("Shop has not been approved yet", 403);
  }

  // Check slug uniqueness
  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) {
    throw new AppError("Slug already exists", 400);
  }

  const product = await prisma.product.create({
    data: {
      sellerId,
      slug,
      title,
      mainImage: mainImage || '',
      price: validatedPrice,
      rating: 5,
      description: description || '',
      manufacturer: manufacturer || '',
      categoryId,
      inStock: validatedStock,
      status: status || "PUBLISHED",
    },
  });

  return response.status(201).json(product);
});

/**
 * PUT /api/products/:id
 * Authenticated active seller (own products) only
 */
const updateProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const {
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

  if (!id) throw new AppError("Product ID is required", 400);

  // Verify product exists
  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new AppError("Product not found", 404);

  // IDOR protection
  await verifyProductOwnership(request, id);

  const validatedPrice = price !== undefined ? requireWholeNumber(price, "price", 1) : undefined;
  const validatedStock = inStock !== undefined ? requireWholeNumber(inStock, "inStock", 0) : undefined;

  // Check slug uniqueness if changing
  if (slug && slug !== existingProduct.slug) {
    const slugExists = await prisma.product.findFirst({ 
      where: { slug, id: { not: id } } 
    });
    if (slugExists) throw new AppError("Slug already exists", 400);
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (mainImage !== undefined) updateData.mainImage = mainImage;
  if (slug !== undefined) updateData.slug = slug;
  if (price !== undefined) updateData.price = validatedPrice;
  if (rating !== undefined) updateData.rating = parseInt(rating);
  if (description !== undefined) updateData.description = description;
  if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (inStock !== undefined) updateData.inStock = validatedStock;
  if (status !== undefined) updateData.status = status;

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return response.status(200).json(updatedProduct);
});

/**
 * DELETE /api/products/:id
 * Authenticated active seller (own products) only
 */
const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) throw new AppError("Product ID is required", 400);

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new AppError("Product not found", 404);

  // IDOR protection
  await verifyProductOwnership(request, id);

  // Keep products referenced by either order implementation for order history.
  const [relatedOrderItems, relatedSubOrderProducts] = await Promise.all([
    prisma.order_item.count({ where: { productId: id } }),
    prisma.subOrderProduct.count({ where: { productId: id } }),
  ]);

  if (relatedOrderItems > 0 || relatedSubOrderProducts > 0) {
    // Archive instead of delete to preserve order history
    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED', inStock: 0 }
    });
    return response.json({ 
      message: 'Product has orders and has been archived instead of deleted',
      archived: true 
    });
  }

  await prisma.product.delete({ where: { id } });
  return response.status(204).send();
});

/**
 * GET /api/products/moderation/:id
 * Admin only - retrieve product context for compliance review.
 */
const getModerationProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!id) throw new AppError("Product ID is required", 400);

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      seller: { select: { id: true, email: true, shopName: true, shopStatus: true } },
      _count: { select: { orderItems: true, subOrderProducts: true, reviews: true } },
    },
  });

  if (!product) throw new AppError("Product not found", 404);
  return response.status(200).json(product);
});

/**
 * POST /api/products/moderation/:id/warnings
 * Admin only - notify the owning seller about a compliance issue.
 */
const sendProductViolationWarning = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const reason = typeof request.body.reason === 'string' ? request.body.reason.trim() : '';
  const requestedType = String(request.body.violationType || 'POLICY_VIOLATION').toUpperCase();
  const requestedPriority = String(request.body.priority || 'HIGH').toUpperCase();

  if (reason.length < 10 || reason.length > 1000) {
    throw new AppError("Warning reason must be between 10 and 1000 characters", 400);
  }

  const violationType = ALLOWED_WARNING_TYPES.includes(requestedType) ? requestedType : 'OTHER';
  const priority = ALLOWED_WARNING_PRIORITIES.includes(requestedPriority) ? requestedPriority : 'HIGH';
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      sellerId: true,
      status: true,
      seller: { select: { email: true } },
    },
  });

  if (!product) throw new AppError("Product not found", 404);

  const notification = await prisma.notification.create({
    data: {
      userId: product.sellerId,
      title: `Compliance warning: ${product.title}`,
      message: `Your listing "${product.title}" requires attention. ${reason} Please review the listing and update or remove it if necessary.`,
      type: 'SYSTEM_ALERT',
      priority,
      metadata: {
        event: 'PRODUCT_VIOLATION_WARNING',
        productId: product.id,
        productSlug: product.slug,
        productStatus: product.status,
        violationType,
        issuedByAdminId: request.user.id,
      },
    },
  });

  return response.status(201).json({
    message: `Warning sent to ${product.seller.email}`,
    notificationId: notification.id,
  });
});

/**
 * GET /api/products/search
 * Public - search products
 */
const searchProducts = asyncHandler(async (request, response) => {
  const { query } = request.query;
  
  if (!query) throw new AppError("Query parameter is required", 400);

  // Limit query length to prevent abuse
  const sanitizedQuery = String(query).slice(0, 100);

  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      ...activeSellerFilter(),
      OR: [
        { title: { contains: sanitizedQuery } },
        { description: { contains: sanitizedQuery } },
        { manufacturer: { contains: sanitizedQuery } },
      ],
    },
    take: 50, // Limit results
    include: {
      category: { select: { name: true } },
      seller: { select: { id: true, shopName: true } },
    },
  });

  return response.json(products);
});

/**
 * GET /api/products/:id
 * Public - get product by ID
 */
const getProductById = asyncHandler(async (request, response) => {
  const { id } = request.params;
  
  if (!id) throw new AppError("Product ID is required", 400);

  const product = await prisma.product.findFirst({
    where: {
      id,
      status: 'PUBLISHED',
      ...activeSellerFilter(),
    },
    include: {
      category: true,
      seller: { select: { id: true, shopName: true } },
    },
  });
  
  if (!product) throw new AppError("Product not found", 404);
  
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
  getModerationProduct,
  sendProductViolationWarning,
  searchProducts,
  getProductById,
};
