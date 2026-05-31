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

function requireWholeNumber(value, fieldName, minimum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    const requirement = minimum === 1 ? 'a positive whole VND amount' : 'a non-negative whole number';
    throw new AppError(`${fieldName} must be ${requirement}`, 400);
  }
  return parsed;
}

function normalizeSubOrderStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  const aliases = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
  };

  return aliases[normalized];
}

function normalizeLegacyOrderStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  const aliases = {
    pending: 'processing',
    confirmed: 'processing',
    processing: 'processing',
    shipped: 'processing',
    delivered: 'delivered',
    completed: 'delivered',
    cancelled: 'canceled',
    canceled: 'canceled',
  };

  return aliases[normalized];
}

function deriveParentOrderStatus(subOrderStatuses) {
  if (!subOrderStatuses.length) return 'processing';

  const normalizedStatuses = subOrderStatuses.map((status) => String(status || '').toUpperCase());
  if (normalizedStatuses.every((status) => status === 'DELIVERED')) return 'delivered';
  if (normalizedStatuses.every((status) => status === 'CANCELLED')) return 'canceled';

  return 'processing';
}

async function createBuyerOrderUpdateNotification(order, status) {
  if (!order?.buyerId) return;

  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      title: 'Order updated',
      message: `Order #${String(order.id).slice(0, 8)} status is now ${status}.`,
      type: 'ORDER_UPDATE',
      priority: 'NORMAL',
      metadata: {
        orderId: order.id,
        status,
      },
    },
  });
}

async function createAdminSellerApplicationNotifications(seller) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: ROLES.ADMIN },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: 'New seller application',
        message: `${seller.shopName || 'A new shop'} (${seller.email}) submitted a seller application and is waiting for approval.`,
        type: 'SYSTEM_ALERT',
        priority: 'HIGH',
        isRead: false,
        metadata: {
          sellerId: seller.id,
          sellerEmail: seller.email,
          shopName: seller.shopName,
          shopStatus: seller.shopStatus,
        },
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown notification error';
    console.warn(`Failed to create admin seller-application notification for seller ${seller?.id}: ${message}`);
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

  // Note: Since Prisma schema sets shopStatus to 'PENDING' by default for all new buyers,
  // checking user.shopStatus === 'PENDING' here incorrectly blocks new registrations.
  // The user.role === ROLES.SELLER check above already correctly prevents double registration.
  /*
  if (user.shopStatus === 'PENDING' || user.shopStatus === 'ACTIVE') {
    throw new AppError('You already have a seller account', 400);
  }
  */

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

  await createAdminSellerApplicationNotifications(updatedUser);

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

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(startOfToday);
  const dayOffset = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - dayOffset);

  const startOfPreviousWeek = new Date(startOfWeek);
  startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);

  const isPendingStatus = (status) => {
    const normalized = String(status || '').toUpperCase();
    return normalized === 'PENDING' || normalized === 'PROCESSING';
  };

  const getChangePercent = (current, previous) => {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const [totalProducts, legacyOrderItems, currentSubOrders] = await Promise.all([
    prisma.product.count({ where: { sellerId } }),
    prisma.order_item.findMany({
      where: { sellerId },
      include: {
        order: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            status: true,
            dateTime: true,
          },
        },
      },
      orderBy: { order: { dateTime: 'desc' } },
    }),
    prisma.subOrder.findMany({
      where: { merchantId: sellerId },
      include: {
        parentOrder: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            dateTime: true,
          },
        },
        products: {
          select: {
            quantity: true,
            unitPriceSnapshot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const legacyOrderMap = new Map();
  for (const item of legacyOrderItems) {
    if (!item.order) continue;

    const amount = item.priceAtPurchase * item.quantity;
    const existing = legacyOrderMap.get(item.orderId) || {
      id: item.orderId,
      customer: [item.order.name, item.order.lastname].filter(Boolean).join(' ') || item.order.email || 'Customer',
      items: 0,
      total: 0,
      status: item.order.status,
      date: item.order.dateTime,
    };

    existing.items += item.quantity;
    existing.total += amount;
    legacyOrderMap.set(item.orderId, existing);
  }

  const legacyOrders = Array.from(legacyOrderMap.values());
  const subOrders = currentSubOrders.map((subOrder) => {
    const productsTotal = subOrder.products.reduce(
      (sum, product) => sum + product.unitPriceSnapshot * product.quantity,
      0
    );

    return {
      id: subOrder.parentOrderId,
      customer: [subOrder.parentOrder?.name, subOrder.parentOrder?.lastname].filter(Boolean).join(' ')
        || subOrder.parentOrder?.email
        || 'Customer',
      items: subOrder.products.reduce((sum, product) => sum + product.quantity, 0),
      total: subOrder.subTotal || productsTotal,
      status: subOrder.status,
      date: subOrder.parentOrder?.dateTime || subOrder.createdAt,
    };
  });

  const allOrders = [...legacyOrders, ...subOrders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalOrderItems = allOrders.reduce((sum, order) => sum + order.items, 0);
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
  const monthlyRevenue = allOrders
    .filter((order) => new Date(order.date) >= startOfMonth)
    .reduce((sum, order) => sum + order.total, 0);
  const weeklyRevenue = allOrders
    .filter((order) => new Date(order.date) >= startOfWeek)
    .reduce((sum, order) => sum + order.total, 0);
  const previousWeekRevenue = allOrders
    .filter((order) => {
      const orderDate = new Date(order.date);
      return orderDate >= startOfPreviousWeek && orderDate < startOfWeek;
    })
    .reduce((sum, order) => sum + order.total, 0);
  const todayOrders = allOrders.filter((order) => new Date(order.date) >= startOfToday).length;
  const pendingItems = allOrders.filter((order) => isPendingStatus(order.status)).length;

  return res.json({
    totalProducts,
    totalOrderItems,
    totalOrders: allOrders.length,
    totalRevenue,
    monthlyRevenue,
    weeklyRevenue,
    weeklyRevenueChangePercent: getChangePercent(weeklyRevenue, previousWeekRevenue),
    todayOrderCount: todayOrders,
    pendingOrderCount: pendingItems,
    recentOrders: allOrders.slice(0, 5).map((order) => ({
      id: order.id,
      displayId: `#${String(order.id).slice(0, 8).toUpperCase()}`,
      customer: order.customer,
      items: order.items,
      total: order.total,
      status: String(order.status || 'PENDING').toUpperCase(),
      date: order.date,
    })),
    storeViewsLast7Days: 0,
    storeViewsChangePercent: null,
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

  const validatedPrice = requireWholeNumber(price, 'price', 1);
  const validatedStock = requireWholeNumber(inStock ?? 1, 'inStock', 0);

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
      price: validatedPrice,
      manufacturer: manufacturer || '',
      description: description || '',
      mainImage: mainImage || '',
      categoryId,
      inStock: validatedStock,
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

  const validatedPrice = price !== undefined ? requireWholeNumber(price, 'price', 1) : undefined;
  const validatedStock = inStock !== undefined ? requireWholeNumber(inStock, 'inStock', 0) : undefined;

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
      ...(price !== undefined && { price: validatedPrice }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(description !== undefined && { description }),
      ...(mainImage !== undefined && { mainImage }),
      ...(categoryId && { categoryId }),
      ...(inStock !== undefined && { inStock: validatedStock })
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

  // Preserve product records referenced by either current or legacy order flow.
  const [relatedItems, relatedSubOrderProducts] = await Promise.all([
    prisma.order_item.count({ where: { productId: id } }),
    prisma.subOrderProduct.count({ where: { productId: id } }),
  ]);
  if (relatedItems > 0 || relatedSubOrderProducts > 0) {
    // Remove from sale without breaking order history or product snapshots.
    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED', inStock: 0 }
    });
    return res.json({ 
      message: 'Product has existing orders and was removed from sale instead of permanently deleted',
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

  const [legacyItems, currentSubOrders] = await Promise.all([
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
    }),
    prisma.subOrder.findMany({
      where: { merchantId: sellerId },
      include: {
        parentOrder: {
          select: {
            id: true,
            buyerId: true,
            name: true,
            lastname: true,
            email: true,
            city: true,
            country: true,
            status: true,
            dateTime: true,
            total: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                mainImage: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const currentItems = currentSubOrders.flatMap((subOrder) =>
    subOrder.products.map((productSnapshot) => ({
      id: productSnapshot.id,
      source: 'subOrderProduct',
      subOrderId: subOrder.id,
      quantity: productSnapshot.quantity,
      priceAtPurchase: productSnapshot.unitPriceSnapshot,
      product: {
        id: productSnapshot.productId,
        title: productSnapshot.productNameSnapshot || productSnapshot.product?.title || 'Product',
        mainImage: productSnapshot.productImageSnapshot || productSnapshot.product?.mainImage || '',
        slug: productSnapshot.product?.slug || '',
      },
      order: {
        id: subOrder.parentOrder?.id,
        name: subOrder.parentOrder?.name,
        lastname: subOrder.parentOrder?.lastname,
        email: subOrder.parentOrder?.email,
        city: subOrder.parentOrder?.city,
        country: subOrder.parentOrder?.country,
        status: subOrder.status,
        dateTime: subOrder.parentOrder?.dateTime || subOrder.createdAt,
        total: subOrder.subTotal + subOrder.shippingTotal,
      },
    }))
  );

  const legacyOrderItems = legacyItems.map((item) => ({
    ...item,
    source: 'legacyOrderItem',
  }));

  const items = [...currentItems, ...legacyOrderItems].sort(
    (a, b) => new Date(b.order?.dateTime || 0).getTime() - new Date(a.order?.dateTime || 0).getTime()
  );

  const pagedItems = items.slice(skip, skip + limit);

  return res.json({
    items: pagedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit)
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

  const item = await prisma.order_item.findUnique({
    where: { id: itemId },
    include: { order: true }
  });

  if (!item) {
    const subOrderProduct = await prisma.subOrderProduct.findUnique({
      where: { id: itemId },
      include: {
        subOrder: {
          include: { parentOrder: true },
        },
      },
    });

    const subOrder = subOrderProduct?.subOrder || await prisma.subOrder.findUnique({
      where: { id: itemId },
      include: { parentOrder: true },
    });

    if (!subOrder) throw new AppError('Order item does not exist', 404);

    const subOrderStatus = normalizeSubOrderStatus(status);
    if (!subOrderStatus) {
      throw new AppError('Invalid status. Allowed values: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED', 400);
    }

    await verifySellerOwnership(req, subOrder.merchantId, 'sub-order');

    const updateData = { status: subOrderStatus };
    if (subOrderStatus === 'SHIPPED') updateData.shippedAt = new Date();
    if (subOrderStatus === 'DELIVERED') updateData.deliveredAt = new Date();
    if (subOrderStatus === 'CANCELLED') updateData.cancelledAt = new Date();

    const updatedSubOrder = await prisma.subOrder.update({
      where: { id: subOrder.id },
      data: updateData,
    });

    const siblingSubOrders = await prisma.subOrder.findMany({
      where: { parentOrderId: subOrder.parentOrderId },
      select: { status: true },
    });

    const parentStatus = deriveParentOrderStatus(siblingSubOrders.map((sibling) => sibling.status));
    const updatedOrder = await prisma.customer_order.update({
      where: { id: subOrder.parentOrderId },
      data: { status: parentStatus },
    });

    await createBuyerOrderUpdateNotification(updatedOrder, subOrderStatus);

    return res.json({
      message: 'Update successful',
      subOrder: updatedSubOrder,
      order: updatedOrder,
    });
  }

  const legacyStatus = normalizeLegacyOrderStatus(status);
  if (!legacyStatus) {
    throw new AppError('Invalid status. Allowed values: processing, delivered, canceled', 400);
  }

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
    data: { status: legacyStatus }
  });

  // Create notification for buyer
  await createBuyerOrderUpdateNotification(updatedOrder, legacyStatus);

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
