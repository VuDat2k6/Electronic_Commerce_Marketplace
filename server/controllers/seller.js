/**
 * Seller Controller with IDOR Protection
 * 
 * All seller operations use sellerId from authenticated JWT token
 * to prevent IDOR attacks. Sellers can only access their own resources.
 * 
 * @module controllers/seller
 */

const prisma = require('../utils/db');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { ROLES } = require('../middleware/auth');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get seller ID from authenticated user
 * Prevents IDOR by using token instead of request body
 */
function getSellerIdFromRequest(req) {
  // Sellers must use their own ID from the JWT token
  if (req.user.role === ROLES.SELLER) {
    return req.user.id;
  }
  // Admins can impersonate any seller via query param
  if (req.user.role === ROLES.ADMIN && req.query.sellerId) {
    return req.query.sellerId;
  }
  // Fallback to token for sellers
  return req.user.id;
}

/**
 * Verify that the authenticated user is the owner of the resource
 */
async function verifySellerOwnership(req, resourceId, resourceType = 'resource') {
  if (!resourceId) return;
  
  const user = req.user;
  
  // Admins can access any resource
  if (user.role === ROLES.ADMIN) return;
  
  // Sellers can only access their own resources
  if (user.role === ROLES.SELLER && resourceId !== user.id) {
    throw new AppError(`You do not have permission to access this ${resourceType}`, 403);
  }
}

// ============================================================
// SELLER CONTROLLER FUNCTIONS
// ============================================================

/**
 * POST /api/seller/register
 * Convert a regular user into a seller (waiting for admin approval)
 */
const registerAsSeller = asyncHandler(async (req, res) => {
  const { shopName, shopDescription, shopPhone, shopAddress } = req.body;
  const userId = req.user.id;

  if (!shopName) {
    throw new AppError('shopName is required', 400);
  }

  // Get current user to verify they exist and aren't already a seller
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User does not exist', 404);
  if (user.role === ROLES.SELLER) throw new AppError('User is already a seller', 400);
  if (user.role === ROLES.ADMIN) throw new AppError('Admin cannot register as a seller', 400);

  // Check if user already has a pending or active shop
  if (user.shopStatus === 'PENDING' || user.shopStatus === 'ACTIVE') {
    throw new AppError('You already have a seller account', 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: ROLES.SELLER,
      shopName,
      shopDescription: shopDescription || null,
      shopPhone: shopPhone || null,
      shopAddress: shopAddress || null,
      shopStatus: 'PENDING',
      shopCreatedAt: new Date(),
    },
    select: { 
      id: true, 
      email: true, 
      role: true, 
      shopName: true, 
      shopStatus: true,
      shopCreatedAt: true
    }
  });

  return res.status(201).json({
    message: 'Seller registration successful. Please wait for admin approval.',
    user: updatedUser
  });
});

/**
 * GET /api/seller/dashboard
 * Get seller dashboard statistics
 * Uses sellerId from JWT token to prevent IDOR
 */
const getSellerDashboard = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  
  // Verify the seller exists
  const seller = await prisma.user.findUnique({ 
    where: { id: sellerId },
    select: { id: true, role: true, shopStatus: true }
  });
  if (!seller || seller.role !== ROLES.SELLER) {
    throw new AppError('Seller does not exist', 404);
  }

  // Run all queries in parallel for better performance
  const [
    totalProducts,
    totalOrderItems,
    todayStart,
    pendingItems
  ] = await Promise.all([
    prisma.product.count({ where: { sellerId } }),
    prisma.order_item.count({ where: { sellerId } }),
    Promise.resolve(new Date().setHours(0, 0, 0, 0)),
    prisma.order_item.count({ 
      where: { 
        sellerId,
        order: { status: 'processing' }
      }
    })
  ]);

  // Revenue aggregation using Prisma aggregate (not findMany + reduce)
  const revenueResult = await prisma.order_item.aggregate({
    where: { sellerId },
    _sum: { priceAtPurchase: true }
  });
  const totalRevenue = revenueResult._sum.priceAtPurchase || 0;

  // Today's orders
  const todayOrders = await prisma.order_item.count({
    where: {
      sellerId,
      order: { dateTime: { gte: new Date(todayStart) } }
    }
  });

  return res.json({
    totalProducts,
    totalOrderItems,
    totalRevenue,
    todayOrderCount: todayOrders,
    pendingOrderCount: pendingItems,
  });
});

/**
 * GET /api/seller/products
 * Get seller's own products
 * Uses sellerId from JWT token to prevent IDOR
 */
const getSellerProducts = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.product.count({ where: { sellerId } })
  ]);

  return res.json({
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

/**
 * POST /api/seller/products
 * Create a new product for the seller
 * Uses sellerId from JWT token to prevent IDOR
 */
const createSellerProduct = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  const { title, slug, price, manufacturer, description, mainImage, categoryId, inStock } = req.body;

  if (!title || !slug || !price || !categoryId) {
    throw new AppError('title, slug, price, and categoryId are required', 400);
  }

  // Verify the seller is valid and approved
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== ROLES.SELLER) {
    throw new AppError('Invalid seller', 403);
  }
  if (seller.shopStatus !== 'ACTIVE') {
    throw new AppError('Shop has not been approved yet', 403);
  }

  // Check for duplicate slug
  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) {
    throw new AppError('Slug already exists, please choose another one', 400);
  }

  // Validate category exists
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError('Invalid category', 400);
  }

  const product = await prisma.product.create({
    data: {
      sellerId,
      title,
      slug,
      price: parseInt(price),
      manufacturer: manufacturer || '',
      description: description || '',
      mainImage: mainImage || '',
      categoryId,
      inStock: parseInt(inStock ?? 1),
      rating: 5,
      status: 'PUBLISHED'
    }
  });

  return res.status(201).json(product);
});

/**
 * PUT /api/seller/products/:id
 * Update seller's own product
 * Verifies product belongs to the authenticated seller
 */
const updateSellerProduct = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  const { id } = req.params;
  const { title, slug, price, manufacturer, description, mainImage, categoryId, inStock } = req.body;

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product does not exist', 404);

  // IDOR protection: seller can only edit their own product
  await verifySellerOwnership(req, product.sellerId, 'product');

  // Check slug uniqueness if changed
  if (slug && slug !== product.slug) {
    const existingSlug = await prisma.product.findFirst({ 
      where: { slug, id: { not: id } } 
    });
    if (existingSlug) {
      throw new AppError('Slug already exists, please choose another one', 400);
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(price !== undefined && { price: parseInt(price) }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(description !== undefined && { description }),
      ...(mainImage !== undefined && { mainImage }),
      ...(categoryId && { categoryId }),
      ...(inStock !== undefined && { inStock: parseInt(inStock) })
    }
  });

  return res.json(updated);
});

/**
 * DELETE /api/seller/products/:id
 * Delete seller's own product
 * Verifies product belongs to the authenticated seller
 */
const deleteSellerProduct = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  const { id } = req.params;

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product does not exist', 404);

  // IDOR protection: seller can only delete their own product
  await verifySellerOwnership(req, product.sellerId, 'product');

  // Check for related orders
  const relatedItems = await prisma.order_item.findMany({ 
    where: { productId: id },
    take: 1
  });
  if (relatedItems.length > 0) {
    // Instead of failing, archive the product
    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
    return res.json({ 
      message: 'Product has existing orders and has been archived instead of deleted',
      archived: true 
    });
  }

  await prisma.product.delete({ where: { id } });
  return res.status(204).send();
});

/**
 * GET /api/seller/orders
 * Get seller's own orders
 * Uses sellerId from JWT token to prevent IDOR
 */
const getSellerOrders = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.order_item.findMany({
      where: { sellerId },
      include: {
        product: { 
          select: { 
            id: true, 
            title: true, 
            mainImage: true, 
            slug: true 
          } 
        },
        order: {
          select: {
            id: true, 
            name: true, 
            lastname: true, 
            email: true,
            city: true, 
            country: true, 
            status: true, 
            dateTime: true, 
            total: true
          }
        }
      },
      orderBy: { order: { dateTime: 'desc' } },
      skip,
      take: limit,
    }),
    prisma.order_item.count({ where: { sellerId } })
  ]);

  return res.json({
    items,
    pagination: { 
      page, 
      limit, 
      total, 
      totalPages: Math.ceil(total / limit) 
    }
  });
});

/**
 * PATCH /api/seller/orders/:itemId/status
 * Update order item status
 * Verifies item belongs to the authenticated seller
 */
const updateOrderItemStatus = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  const { itemId } = req.params;
  const { status } = req.body;

  const VALID_STATUSES = ['processing', 'delivered', 'canceled'];
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`, 400);
  }

  // Verify item exists and belongs to this seller
  const item = await prisma.order_item.findUnique({
    where: { id: itemId },
    include: { order: true }
  });
  if (!item) throw new AppError('Order item does not exist', 404);

  // IDOR protection: seller can only update their own items
  await verifySellerOwnership(req, item.sellerId, 'order item');

  // Prevent seller from updating multi-seller orders
  const orderItems = await prisma.order_item.findMany({
    where: { orderId: item.orderId },
    select: { sellerId: true }
  });

  const hasOtherSellerItems = orderItems.some(orderItem => orderItem.sellerId !== sellerId);
  if (hasOtherSellerItems && req.user.role !== ROLES.ADMIN) {
    throw new AppError('Cannot update a multi-seller order. Only admin can perform this action.', 403);
  }

  // Update status on Customer_order (entire order)
  const updatedOrder = await prisma.customer_order.update({
    where: { id: item.orderId },
    data: { status }
  });

  // Create notification for buyer
  if (updatedOrder.buyerId) {
    await prisma.notification.create({
      data: {
        userId: updatedOrder.buyerId,
        title: 'Order updated',
        message: `Order #${updatedOrder.id.slice(0, 8)} has been updated to: ${status}`,
        type: 'ORDER_UPDATE',
        priority: 'NORMAL',
      }
    });
  }

  return res.json({ message: 'Update successful', order: updatedOrder });
});

/**
 * GET /api/seller/settings
 * Get seller's shop settings
 * Uses sellerId from JWT token to prevent IDOR
 */
const getSellerSettings = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
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
      shopCreatedAt: true
    }
  });
  if (!seller || seller.role !== ROLES.SELLER) {
    throw new AppError('Seller does not exist', 404);
  }

  return res.json(seller);
});

/**
 * PUT /api/seller/settings
 * Update seller's shop settings
 * Uses sellerId from JWT token to prevent IDOR
 */
const updateSellerSettings = asyncHandler(async (req, res) => {
  const sellerId = getSellerIdFromRequest(req);
  const { shopName, shopDescription, shopPhone, shopAddress } = req.body;

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, role: true }
  });
  if (!seller || seller.role !== ROLES.SELLER) {
    throw new AppError('Seller does not exist or is invalid', 404);
  }

  const updated = await prisma.user.update({
    where: { id: sellerId },
    data: { 
      ...(shopName && { shopName }),
      ...(shopDescription !== undefined && { shopDescription }),
      ...(shopPhone !== undefined && { shopPhone }),
      ...(shopAddress !== undefined && { shopAddress })
    },
    select: {
      id: true, 
      email: true, 
      shopName: true, 
      shopDescription: true,
      shopPhone: true, 
      shopAddress: true, 
      shopStatus: true
    }
  });

  return res.json(updated);
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  registerAsSeller,
  getSellerDashboard,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateOrderItemStatus,
  getSellerSettings,
  updateSellerSettings,
};
