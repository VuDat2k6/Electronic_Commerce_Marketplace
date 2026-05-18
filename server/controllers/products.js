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
    const queryArray = request.url
      .substring(dividerLocation + 1, request.url.length)
      .split("&");

    let filterType;
    let filterArray = [];

    for (let i = 0; i < queryArray.length; i++) {
      const queryParam = queryArray[i];
      
      if (queryParam.includes("filters")) {
        if (queryParam.includes("price")) filterType = "price";
        else if (queryParam.includes("rating")) filterType = "rating";
        else if (queryParam.includes("category")) filterType = "category";
        else if (queryParam.includes("inStock")) filterType = "inStock";
        else if (queryParam.includes("outOfStock")) filterType = "outOfStock";
        else continue;
      }

      if (queryParam.includes("sort")) {
        const extractedSortValue = queryParam.substring(queryParam.indexOf("=") + 1);
        if (validateSortValue(extractedSortValue)) {
          sortByValue = extractedSortValue;
        }
      }

      if (queryParam.includes("filters") && filterType) {
        let filterValue;
        
        if (filterType === "category") {
          filterValue = queryParam.substring(queryParam.indexOf("=") + 1);
        } else {
          const numValue = parseInt(queryParam.substring(queryParam.indexOf("=") + 1));
          filterValue = isNaN(numValue) ? null : numValue;
        }

        const operatorStart = queryParam.indexOf("$") + 1;
        const operatorEnd = queryParam.indexOf("=") - 1;
        
        if (operatorStart > 0 && operatorEnd > operatorStart) {
          const filterOperator = queryParam.substring(operatorStart, operatorEnd);
          
          if (filterValue !== null && filterOperator) {
            filterArray.push({ filterType, filterOperator, filterValue });
          }
        }
      }
    }
    
    filterObj = buildSafeFilterObject(filterArray);
  }

  let whereClause = { ...filterObj };
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
    include: { category: { select: { name: true } } },
    orderBy: sortObj,
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
 * Authenticated seller/admin only - uses sellerId from JWT token
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
      price: parseInt(price),
      rating: 5,
      description: description || '',
      manufacturer: manufacturer || '',
      categoryId,
      inStock: parseInt(inStock ?? 1),
      status: status || "PUBLISHED",
    },
  });

  return response.status(201).json(product);
});

/**
 * PUT /api/products/:id
 * Authenticated seller (own products) or admin
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
  if (price !== undefined) updateData.price = parseInt(price);
  if (rating !== undefined) updateData.rating = parseInt(rating);
  if (description !== undefined) updateData.description = description;
  if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (inStock !== undefined) updateData.inStock = parseInt(inStock);
  if (status !== undefined) updateData.status = status;

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return response.status(200).json(updatedProduct);
});

/**
 * DELETE /api/products/:id
 * Authenticated seller (own products) or admin
 */
const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) throw new AppError("Product ID is required", 400);

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new AppError("Product not found", 404);

  // IDOR protection
  await verifyProductOwnership(request, id);

  // Check for related order items
  const relatedOrderItems = await prisma.order_item.count({ where: { productId: id } });

  if (relatedOrderItems > 0) {
    // Archive instead of delete to preserve order history
    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' }
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
      OR: [
        { title: { contains: sanitizedQuery } },
        { description: { contains: sanitizedQuery } },
        { manufacturer: { contains: sanitizedQuery } },
      ],
    },
    take: 50, // Limit results
    include: { category: { select: { name: true } } },
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

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
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
  searchProducts,
  getProductById,
};
