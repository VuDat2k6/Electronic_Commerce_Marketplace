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
 * Create a customer order and corresponding order_item records grouped by seller, decrement product stock, and apply voucher usage.
 *
 * Expects an `orderData` object containing buyer details and order contents. Relevant fields:
 * - `customerId`, `name`, `lastname`, `phone`, `email`, `company`, `adress`, `apartment`, `postalCode`, `city`, `country`, `orderNotice`
 * - `items` (array of items with `productId`/`id`, optional `sellerId`, `quantity`, optional `unitPrice`)
 * - `voucherCodes` (array of voucher code strings)
 *
 * @param {Object} orderData - Order payload with buyer info, items, and optional voucher codes.
 * @returns {Object} The created `customer_order` record.
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
 * Retrieve a customer's orders (including order items, product and seller details, and payments) by customer ID.
 * @param {string} customerId - The customer's user ID.
 * @returns {Object} An object with `orders` and `pagination`.
 *   - `orders`: Array of `customer_order` records. Each order includes:
 *       - `items`: Array of `order_item` records; each item includes:
 *           - `product`: `{ id, title, slug, mainImage, price }`
 *           - `seller`: `{ id, shopName, shopStatus }`
 *       - `payments`: Array of payment records: `{ id, status, amount, method, paidAt }`
 *   - `pagination`: `{ page, limit, total, totalPages }`
 * @throws {Error} If `customerId` is not provided.
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
 * Retrieve a seller's order items grouped by their parent orders.
 *
 * @param {string} sellerId - The seller's unique identifier.
 * @param {Object} [options] - Query options.
 * @param {string} [options.status] - If provided, only include orders whose parent order's status matches this value (case-insensitive).
 * @param {number|string} [options.page=1] - Page number for pagination.
 * @param {number|string} [options.limit=20] - Number of items per page.
 * @returns {Object} An object containing `orders` (array of groups where each group has `order`, `items` and `totalRevenue`) and `pagination` (`page`, `limit`, `total`, `totalPages`).
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
 * Update the parent customer order's status based on an order item.
 * @param {string} itemId - ID of the order_item used to identify the parent order.
 * @param {Object} data - Update payload containing the new status.
 * @param {string} data.status - New status to set on the parent customer order.
 * @returns {Object} The updated customer order.
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
 * Retrieve the seller's shop profile and published products.
 *
 * @param {string} sellerId - Seller's user ID; required.
 * @returns {Object} An object with:
 *  - `seller`: seller profile containing `id`, `shopName`, `description`, `phone`, `address`, `status`, `rating` (one decimal), and `totalProducts`.
 *  - `products`: array of the seller's published product records, each including `category` and `reviews`.
 * @throws {Error} If `sellerId` is missing or the seller is not found or not active.
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