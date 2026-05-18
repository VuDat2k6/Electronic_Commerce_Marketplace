const prisma = require('../utils/db');
const { asyncHandler, AppError } = require("../utils/errorHandler");

const createOrderProduct = asyncHandler(async (request, response) => {
  const { subOrderId, productId, quantity } = request.body;
  const parsedQuantity = Number(quantity);

  // Validate required fields
  if (!subOrderId) {
    throw new AppError("SubOrder ID is required", 400);
  }
  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }
  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    throw new AppError("Valid quantity is required", 400);
  }

  // Check if SubOrder exists
  const existingSubOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId }
  });

  if (!existingSubOrder) {
    throw new AppError("SubOrder not found", 404);
  }

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  // Get merchant info for snapshot
  const merchant = await prisma.merchant.findUnique({
    where: { id: existingProduct.merchantId }
  });

  // Create order product record with snapshot data
  const orderProduct = await prisma.subOrderProduct.create({
    data: {
      subOrderId: subOrderId,
      productId: productId,
      quantity: parsedQuantity,
      productNameSnapshot: existingProduct.title,
      productImageSnapshot: existingProduct.mainImage,
      unitPriceSnapshot: existingProduct.price,
      merchantIdSnapshot: existingProduct.merchantId,
      merchantNameSnapshot: merchant ? merchant.name : 'Unknown'
    }
  });

  return response.status(201).json(orderProduct);
});

/**
 * POST /api/order-product/bulk
 *
 * Creates multiple order items in a single batch operation
 * Optimized to avoid N+1 queries - fetches all products in parallel
 *
 * Request Body:
 * - orderId: The customer order ID
 * - items: Array of { productId, quantity, unitPrice }
 *
 * @param {Request} request - Express request with order items data
 * @param {Response} response - Express response object
 */
const bulkCreateOrderProducts = asyncHandler(async (request, response) => {
  const { orderId, items } = request.body;

  // Validate required fields
  if (!orderId) {
    throw new AppError("Order ID is required", 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Items array is required and must not be empty", 400);
  }

  // Validate each item
  for (const item of items) {
    if (!item.productId) {
      throw new AppError("Product ID is required for each item", 400);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError("Valid quantity is required for each item", 400);
    }
  }

  // Check if order exists
  const existingOrder = await prisma.customer_order.findUnique({
    where: { id: orderId }
  });

  if (!existingOrder) {
    throw new AppError("Order not found", 404);
  }

  // Fetch all products in parallel to avoid N+1 queries
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      title: true,
      mainImage: true,
      price: true,
      merchantId: true,
      inStock: true,
      sellerId: true
    }
  });

  // Create a map for quick product lookup
  const productMap = new Map(products.map(p => [p.id, p]));

  // Validate all products exist
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }
  }

  // Fetch merchant/seller info for all products in parallel
  const merchantIds = [...new Set(products.map(p => p.merchantId).filter(Boolean))];
  const merchants = merchantIds.length > 0
    ? await prisma.merchant.findMany({
        where: { id: { in: merchantIds } },
        select: { id: true, name: true }
      })
    : [];
  const merchantMap = new Map(merchants.map(m => [m.id, m]));

  // Build order items data
  const orderItemsData = items.map(item => {
    const product = productMap.get(item.productId);
    const merchant = product?.merchantId ? merchantMap.get(product.merchantId) : null;

    return {
      orderId,
      productId: item.productId,
      sellerId: item.sellerId || product?.sellerId || '',
      quantity: item.quantity,
      priceAtPurchase: item.unitPrice || product?.price || 0,
      // Snapshot fields for order history
      productNameSnapshot: product?.title || '',
      productImageSnapshot: product?.mainImage || '',
      unitPriceSnapshot: item.unitPrice || product?.price || 0,
      merchantIdSnapshot: product?.merchantId || '',
      merchantNameSnapshot: merchant?.name || 'Unknown Shop'
    };
  });

  // Create all order items in a single transaction
  const createdItems = await prisma.$transaction(
    orderItemsData.map(itemData =>
      prisma.order_item.create({ data: itemData })
    )
  );

  // Also update stock in the same transaction
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { inStock: { decrement: item.quantity } }
    });
  }

  return response.status(201).json({
    success: true,
    message: `${createdItems.length} order items created`,
    items: createdItems
  });
});

const updateProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { quantity } = request.body;

  if (!id) {
    throw new AppError("Order product ID is required", 400);
  }

  const existingOrder = await prisma.subOrderProduct.findUnique({
    where: {
      id: id
    }
  });

  if (!existingOrder) {
    throw new AppError("Order product not found", 404);
  }

  // Validate quantity
  if (quantity !== undefined) {
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new AppError("Quantity must be greater than 0", 400);
    }
  }

  const updatedOrder = await prisma.subOrderProduct.update({
    where: {
      id: existingOrder.id
    },
    data: {
      quantity: quantity !== undefined ? Number(quantity) : existingOrder.quantity
    }
  });

  return response.json(updatedOrder);
});

const deleteProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Order product ID is required", 400);
  }

  const existingOrder = await prisma.subOrderProduct.findUnique({
    where: { id }
  });

  if (!existingOrder) {
    throw new AppError("Order product not found", 404);
  }

  await prisma.subOrderProduct.delete({
    where: { id }
  });
  
  return response.status(204).send();
});

const getProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("SubOrder ID is required", 400);
  }

  const subOrder = await prisma.subOrder.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true
        }
      }
    }
  });
  
  if (!subOrder) {
    throw new AppError("SubOrder not found", 404);
  }
  
  return response.status(200).json(subOrder.products);
});

const getAllProductOrders = asyncHandler(async (request, response) => {
  const subOrders = await prisma.subOrder.findMany({
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              mainImage: true,
              price: true,
              slug: true
            }
          }
        }
      },
      parentOrder: {
        select: {
          id: true,
          name: true,
          lastname: true,
          phone: true,
          email: true,
          company: true,
          adress: true,
          apartment: true,
          postalCode: true,
          dateTime: true,
          status: true,
          total: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return response.json(subOrders);
});

module.exports = {
  createOrderProduct,
  bulkCreateOrderProducts,
  updateProductOrder,
  deleteProductOrder,
  getProductOrder,
  getAllProductOrders
};