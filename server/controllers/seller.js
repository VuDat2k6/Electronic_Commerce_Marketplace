// server/controllers/seller.js
const prisma = require('../utills/db');
const { asyncHandler, AppError } = require('../utills/errorHandler');

// POST /api/seller/register
// Convert a regular user into a seller (waiting for admin approval)
const registerAsSeller = asyncHandler(async (req, res) => {
  const { userId, shopName, shopDescription, shopPhone, shopAddress } = req.body;

  if (!userId || !shopName) {
    throw new AppError('userId and shopName are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User does not exist', 404);
  if (user.role === 'seller') throw new AppError('User is already a seller', 400);
  if (user.role === 'admin') throw new AppError('Admin cannot register as a seller', 400);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: 'seller',
      shopName,
      shopDescription: shopDescription || null,
      shopPhone: shopPhone || null,
      shopAddress: shopAddress || null,
      shopStatus: 'PENDING',
      shopCreatedAt: new Date(),
    },
    select: { id: true, email: true, role: true, shopName: true, shopStatus: true }
  });

  return res.status(201).json({
    message: 'Seller registration successful. Please wait for admin approval.',
    user: updatedUser
  });
});

// GET /api/seller/dashboard?sellerId=xxx
const getSellerDashboard = asyncHandler(async (req, res) => {
  const { sellerId } = req.query;
  if (!sellerId) throw new AppError('sellerId is required', 400);

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== 'seller') throw new AppError('Seller does not exist', 404);

  // Count products
  const totalProducts = await prisma.product.count({ where: { sellerId } });

  // Count total order items
  const totalOrderItems = await prisma.order_item.count({ where: { sellerId } });

  // Revenue: sum of (priceAtPurchase * quantity) for items belonging to this seller
  const revenueAgg = await prisma.order_item.findMany({
    where: { sellerId },
    select: { priceAtPurchase: true, quantity: true }
  });
  const totalRevenue = revenueAgg.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

  // Today's orders: retrieve through Customer_order join Order_item
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = await prisma.order_item.findMany({
    where: {
      sellerId,
      order: { dateTime: { gte: todayStart } }
    },
    select: { id: true }
  });

  // Pending/processing orders
  const pendingItems = await prisma.order_item.findMany({
    where: {
      sellerId,
      order: { status: 'processing' }
    },
    select: { id: true }
  });

  return res.json({
    totalProducts,
    totalOrderItems,
    totalRevenue,
    todayOrderCount: todayOrders.length,
    pendingOrderCount: pendingItems.length,
  });
});

// GET /api/seller/products?sellerId=xxx
const getSellerProducts = asyncHandler(async (req, res) => {
  const { sellerId } = req.query;
  if (!sellerId) throw new AppError('sellerId is required', 400);

  const products = await prisma.product.findMany({
    where: { sellerId },
    include: { category: { select: { name: true } } },
    orderBy: { title: 'asc' }
  });

  return res.json(products);
});

// POST /api/seller/products
// Body: { sellerId, title, slug, price, manufacturer, description, mainImage, categoryId, inStock }
const createSellerProduct = asyncHandler(async (req, res) => {
  const { sellerId, title, slug, price, manufacturer, description, mainImage, categoryId, inStock } = req.body;

  if (!sellerId || !title || !slug || !price || !categoryId) {
    throw new AppError('sellerId, title, slug, price, and categoryId are required', 400);
  }

  // Check whether the seller is valid and already approved
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== 'seller') throw new AppError('Invalid seller', 403);
  if (seller.shopStatus !== 'ACTIVE') throw new AppError('Shop has not been approved yet', 403);

  // Check for duplicate slug
  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) throw new AppError('Slug already exists, please choose another one', 400);

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
    }
  });

  return res.status(201).json(product);
});

// PUT /api/seller/products/:id
const updateSellerProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sellerId, title, slug, price, manufacturer, description, mainImage, categoryId, inStock } = req.body;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product does not exist', 404);

  // Protection: seller can only edit their own product
  if (product.sellerId !== sellerId) {
    throw new AppError('You do not have permission to edit this product', 403);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      title,
      slug,
      price: parseInt(price),
      manufacturer,
      description,
      mainImage,
      categoryId,
      inStock: parseInt(inStock)
    }
  });

  return res.json(updated);
});

// DELETE /api/seller/products/:id
const deleteSellerProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sellerId } = req.body;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product does not exist', 404);
  if (product.sellerId !== sellerId) throw new AppError('You do not have permission to delete this product', 403);

  // Check whether there are any order_items containing this product
  const relatedItems = await prisma.order_item.findMany({ where: { productId: id } });
  if (relatedItems.length > 0) {
    throw new AppError('Cannot delete product because it already exists in orders', 400);
  }

  await prisma.product.delete({ where: { id } });
  return res.status(204).send();
});

// GET /api/seller/orders?sellerId=xxx&page=1
const getSellerOrders = asyncHandler(async (req, res) => {
  const { sellerId, page = 1 } = req.query;
  if (!sellerId) throw new AppError('sellerId is required', 400);

  const limit = 20;
  const skip = (parseInt(page) - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.order_item.findMany({
      where: { sellerId },
      include: {
        product: { select: { id: true, title: true, mainImage: true, slug: true } },
        order: {
          select: {
            id: true, name: true, lastname: true, email: true,
            city: true, country: true, status: true, dateTime: true, total: true
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
    pagination: { page: parseInt(page), limit, total, totalPages: Math.ceil(total / limit) }
  });
});

// PATCH /api/seller/orders/:itemId/status
// Seller is only allowed to update the order status (not the item itself)
const updateOrderItemStatus = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { sellerId, status } = req.body;

  const VALID_STATUSES = ['processing', 'delivered', 'canceled'];
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`, 400);
  }

  const item = await prisma.order_item.findUnique({
    where: { id: itemId },
    include: { order: true }
  });
  if (!item) throw new AppError('Order item does not exist', 404);
  if (item.sellerId !== sellerId) throw new AppError('You do not have permission to update this order', 403);

  // Prevent seller from updating the whole order if it contains items from other sellers
  const orderItems = await prisma.order_item.findMany({
    where: { orderId: item.orderId },
    select: { sellerId: true }
  });

  const hasOtherSellerItems = orderItems.some(orderItem => orderItem.sellerId !== sellerId);
  if (hasOtherSellerItems) {
    throw new AppError('Cannot update a multi-seller order as a whole. Only admin can perform this action.', 403);
  }

  // Update status on Customer_order (entire order)
  const updatedOrder = await prisma.customer_order.update({
    where: { id: item.orderId },
    data: { status }
  });

  // Create notification for buyer if buyerId exists
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

// GET /api/seller/settings?sellerId=xxx
const getSellerSettings = asyncHandler(async (req, res) => {
  const { sellerId } = req.query;
  if (!sellerId) throw new AppError('sellerId is required', 400);

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true, email: true, role: true,
      shopName: true, shopDescription: true, shopPhone: true,
      shopAddress: true, shopStatus: true, shopApprovedAt: true, shopCreatedAt: true
    }
  });
  if (!seller || seller.role !== 'seller') throw new AppError('Seller does not exist', 404);

  return res.json(seller);
});

// PUT /api/seller/settings
const updateSellerSettings = asyncHandler(async (req, res) => {
  const { sellerId, shopName, shopDescription, shopPhone, shopAddress } = req.body;
  if (!sellerId) throw new AppError('sellerId is required', 400);

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, role: true }
  });
  if (!seller || seller.role !== 'seller') {
    throw new AppError('Seller does not exist or is invalid', 404);
  }

  const updated = await prisma.user.update({
    where: { id: sellerId },
    data: { shopName, shopDescription, shopPhone, shopAddress },
    select: {
      id: true, email: true, shopName: true, shopDescription: true,
      shopPhone: true, shopAddress: true, shopStatus: true
    }
  });

  return res.json(updated);
});

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