// ============================================
// Order Service - Handle multi-merchant order creation and queries
// Uses Order_item model (NOT SubOrder/SubOrderProduct)
// ============================================
const { PrismaClient } = require("@prisma/client");

// Use shared Prisma client instance
let prisma;
try {
  prisma = require("../utills/db");
} catch (e) {
  prisma = new PrismaClient();
}

/**
 * Create customer order with Order_item records
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order object
 */
async function createCustomerOrder(orderData) {
  const {
    customerId,
    name,
    lastname,
    phone,
    email,
    company,
    adress,
    apartment,
    postalCode,
    city,
    country,
    orderNotice,
    items = [],
    voucherCodes = []
  } = orderData;

  // Use transaction to create order and order_items
  const result = await prisma.$transaction(async (tx) => {
    // Calculate total and group items by seller
    let totalOrderAmount = 0;
    const itemsBySeller = {};

    // First pass: validate and group items
    for (const item of items) {
      const productId = item.productId || item.id;
      const sellerId = item.sellerId;
      const quantity = item.quantity;

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { price: true, sellerId: true }
      });

      if (product) {
        const resolvedSellerId = sellerId || product.sellerId;
        if (!itemsBySeller[resolvedSellerId]) {
          itemsBySeller[resolvedSellerId] = [];
        }
        const unitPrice = item.unitPrice || product.price;
        itemsBySeller[resolvedSellerId].push({
          productId,
          sellerId: resolvedSellerId,
          quantity,
          unitPrice
        });
        totalOrderAmount += unitPrice * quantity;
      }
    }

    // 1. Create parent order
    const customerOrder = await tx.customer_order.create({
      data: {
        buyerId: customerId || null,
        name: name || "",
        lastname: lastname || "",
        phone: phone || "",
        email: email || "",
        company: company || "",
        adress: adress || "",
        apartment: apartment || "",
        postalCode: postalCode || "",
        city: city || "",
        country: country || "",
        orderNotice: orderNotice || "",
        status: "processing",
        total: totalOrderAmount,
        dateTime: new Date()
      }
    });

    // 2. Create order_items for each product
    for (const [, sellerItems] of Object.entries(itemsBySeller)) {
      for (const item of sellerItems) {
        await tx.order_item.create({
          data: {
            orderId: customerOrder.id,
            productId: item.productId,
            sellerId: item.sellerId,
            quantity: item.quantity,
            priceAtPurchase: item.unitPrice
          }
        });

        // 3. Decrement product stock
        await tx.product.update({
          where: { id: item.productId },
          data: { inStock: { decrement: item.quantity } }
        }).catch(() => {}); // Ignore if product doesn't exist
      }
    }

    // 4. Handle vouchers if provided
    if (voucherCodes && voucherCodes.length > 0) {
      for (const code of voucherCodes) {
        const voucher = await tx.voucher.findUnique({
          where: { code: code }
        }).catch(() => null);

        if (voucher && voucher.isActive) {
          await tx.voucherUsage.create({
            data: {
              voucherId: voucher.id,
              userId: customerId || "",
              orderId: customerOrder.id,
              usedAt: new Date()
            }
          });

          await tx.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } }
          });
        }
      }
    }

    return customerOrder;
  });

  return result;
}

/**
 * Get customer order list
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Order list with items
 */
async function listCustomerOrders(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: customerId }
  }).catch(() => null);

  if (!user) {
    return {
      orders: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  const email = user.email;

  // Get all customer orders with order_items
  const orders = await prisma.customer_order.findMany({
    where: { email: email },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              mainImage: true,
              price: true
            }
          },
          seller: {
            select: {
              id: true,
              shopName: true,
              shopStatus: true
            }
          }
        }
      },
      payments: {
        select: {
          id: true,
          status: true,
          amount: true,
          method: true,
          paidAt: true
        }
      }
    },
    orderBy: {
      dateTime: "desc"
    }
  });

  return {
    orders,
    pagination: {
      page: 1,
      limit: 20,
      total: orders.length,
      totalPages: 1
    }
  };
}

/**
 * Get seller order items list (aggregated by order)
 * @param {string} sellerId - Seller ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Order items list grouped by order
 */
async function listSellerOrderItems(sellerId, options = {}) {
  const status = options.status;
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 20;

  if (!sellerId) {
    throw new Error("Seller ID is required");
  }

  const offset = (page - 1) * limit;

  // Build where clause
  const where = { sellerId };
  if (status) {
    // Status filtering is on the parent order, handled after fetch
  }

  // Get order items with product and parent order info
  const [orderItems, total] = await Promise.all([
    prisma.order_item.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { order: { dateTime: "desc" } },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            mainImage: true,
            price: true
          }
        },
        order: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            phone: true,
            adress: true,
            apartment: true,
            city: true,
            country: true,
            postalCode: true,
            dateTime: true,
            status: true,
            total: true
          }
        }
      }
    }),
    prisma.order_item.count({ where })
  ]);

  // Group items by order
  const ordersMap = new Map();
  for (const item of orderItems) {
    if (!ordersMap.has(item.orderId)) {
      ordersMap.set(item.orderId, {
        order: item.order,
        items: [],
        totalRevenue: 0
      });
    }
    const revenue = item.priceAtPurchase * item.quantity;
    ordersMap.get(item.orderId).items.push({
      ...item,
      revenue
    });
    ordersMap.get(item.orderId).totalRevenue += revenue;
  }

  const orders = Array.from(ordersMap.values());

  // Apply status filter if provided
  const filteredOrders = status
    ? orders.filter(o => o.order.status.toLowerCase() === status.toLowerCase())
    : orders;

  return {
    orders: filteredOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Update order item status (marks order as shipped/delivered/cancelled)
 * @param {string} itemId - Order item ID
 * @param {Object} data - Update payload
 * @returns {Promise<Object>} Updated order
 */
async function updateOrderItemStatus(itemId, data) {
  const { status } = data;

  const orderItem = await prisma.order_item.findUnique({
    where: { id: itemId },
    include: { order: true }
  });

  if (!orderItem) {
    throw new Error("Order item not found");
  }

  // Update parent order status
  const updated = await prisma.customer_order.update({
    where: { id: orderItem.orderId },
    data: { status }
  });

  return updated;
}

/**
 * Get seller shop info and their products
 * @param {string} sellerId - Seller ID (same as User ID)
 * @returns {Promise<Object>} Seller shop data
 */
async function getSellerShop(sellerId) {
  if (!sellerId) {
    throw new Error("Seller ID is required");
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      shopName: true,
      shopDescription: true,
      shopPhone: true,
      shopAddress: true,
      shopStatus: true,
      shopApprovedAt: true
    }
  });

  if (!seller || seller.shopStatus !== "ACTIVE") {
    throw new Error("Seller not found or not active");
  }

  // Get products with category and review info
  const products = await prisma.product.findMany({
    where: { sellerId, status: "PUBLISHED" },
    include: {
      category: { select: { id: true, name: true } },
      reviews: { select: { rating: true } }
    }
  });

  // Calculate average rating
  const allRatings = products.flatMap((p) => p.reviews.map((r) => r.rating));
  const averageRating = allRatings.length > 0
    ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
    : 0;

  return {
    seller: {
      id: seller.id,
      shopName: seller.shopName,
      description: seller.shopDescription,
      phone: seller.shopPhone,
      address: seller.shopAddress,
      status: seller.shopStatus,
      rating: Math.round(averageRating * 10) / 10,
      totalProducts: products.length
    },
    products
  };
}

module.exports = {
  createCustomerOrder,
  listCustomerOrders,
  listSellerOrderItems,
  updateOrderItemStatus,
  getSellerShop
};