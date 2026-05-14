// ============================================
// Order Service - Handle multi-merchant order creation and queries
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
 * Create customer order (supports multi-merchant split orders)
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

  // Generate unique order ID
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Group items by merchant ID
  const itemsByMerchant = {};
  for (const item of items) {
    const merchantId = item.merchantId || "default";
    if (!itemsByMerchant[merchantId]) {
      itemsByMerchant[merchantId] = [];
    }
    itemsByMerchant[merchantId].push(item);
  }

  // Use transaction to create order and sub-orders
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create parent order
    const customerOrder = await tx.customer_order.create({
      data: {
        id: orderId,
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
        status: "PENDING",
        total: 0, // Will be updated after sub-order totals are calculated
        dateTime: new Date()
      }
    });

    let totalOrderAmount = 0;

    // 2. Create one sub-order for each merchant
    for (const [merchantId, merchantItems] of Object.entries(itemsByMerchant)) {
      // Get merchant info
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId }
      }).catch(() => null);

      // Calculate sub-order subtotal
      let subTotal = 0;
      for (const item of merchantItems) {
        const productId = item.productId || item.id;
        const product = await tx.product.findUnique({
          where: { id: productId }
        }).catch(() => null);

        if (product) {
          const unitPrice = item.unitPrice || product.price;
          subTotal += unitPrice * item.quantity;
        }
      }

      // Calculate shipping fee
      const shippingFee = merchant?.shippingFee || 0;

      // Create sub-order
      const subOrder = await tx.subOrder.create({
        data: {
          parentOrderId: customerOrder.id,
          merchantId: merchantId,
          status: "PENDING",
          subTotal: subTotal,
          shippingTotal: shippingFee
        }
      });

      // 3. Create sub-order product records
      for (const item of merchantItems) {
        const productId = item.productId || item.id;
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (product) {
          await tx.subOrderProduct.create({
            data: {
              subOrderId: subOrder.id,
              productId: product.id,
              quantity: item.quantity,
              productNameSnapshot: product.title,
              productImageSnapshot: product.mainImage,
              unitPriceSnapshot: item.unitPrice || product.price,
              merchantIdSnapshot: product.merchantId,
              merchantNameSnapshot: merchant?.name || "Unknown"
            }
          });
        }
      }

      totalOrderAmount += subTotal + shippingFee;
    }

    // 4. Update parent order total
    const updatedOrder = await tx.customer_order.update({
      where: { id: customerOrder.id },
      data: { total: totalOrderAmount }
    });

    // 5. Handle vouchers if provided
    if (voucherCodes && voucherCodes.length > 0) {
      for (const code of voucherCodes) {
        const voucher = await tx.voucher.findUnique({
          where: { code: code }
        }).catch(() => null);

        if (voucher && voucher.isActive) {
          // Record voucher usage
          await tx.voucherUsage.create({
            data: {
              voucherId: voucher.id,
              userId: customerId || "",
              orderId: customerOrder.id,
              usedAt: new Date()
            }
          });

          // Increase voucher used count
          await tx.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } }
          });
        }
      }
    }

    return updatedOrder;
  });

  return result;
}

/**
 * Get customer order list
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Order list
 */
async function listCustomerOrders(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  // Find orders by user email because orders store email instead of user ID
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

  // Get all customer orders
  const orders = await prisma.customer_order.findMany({
    where: { email: email },
    include: {
      subOrders: {
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  mainImage: true,
                  price: true
                }
              }
            }
          },
          merchant: {
            select: {
              id: true,
              name: true,
              avatar: true
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

  // Add revenue field to each sub-order
  const enrichedOrders = orders.map((order) => ({
    ...order,
    subOrders: order.subOrders.map((subOrder) => ({
      ...subOrder,
      revenue: subOrder.subTotal + subOrder.shippingTotal
    }))
  }));

  return {
    orders: enrichedOrders,
    pagination: {
      page: 1,
      limit: 20,
      total: enrichedOrders.length,
      totalPages: 1
    }
  };
}

/**
 * Get seller sub-order list
 * @param {string} merchantId - Merchant ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Sub-order list
 */
async function listSellerSubOrders(merchantId, options = {}) {
  const status = options.status;
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 20;

  if (!merchantId) {
    throw new Error("Merchant ID is required");
  }

  const where = { merchantId };
  if (status) {
    where.status = status;
  }

  const offset = (page - 1) * limit;

  const [subOrders, total] = await Promise.all([
    prisma.subOrder.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        parentOrder: {
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
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                mainImage: true
              }
            }
          }
        }
      }
    }),
    prisma.subOrder.count({ where })
  ]);

  // Calculate revenue for each sub-order
  const enrichedSubOrders = subOrders.map((subOrder) => ({
    ...subOrder,
    revenue: subOrder.subTotal + subOrder.shippingTotal
  }));

  return {
    subOrders: enrichedSubOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Update sub-order status
 * @param {string} subOrderId - Sub-order ID
 * @param {Object} data - Update payload
 * @returns {Promise<Object>} Updated sub-order
 */
async function updateSubOrderStatus(subOrderId, data) {
  const { status, trackingNumber, shippingProvider, cancelReason } = data;

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId }
  });

  if (!subOrder) {
    throw new Error("SubOrder not found");
  }

  const updateData = { status };

  // Update related timestamps based on status
  if (status === "SHIPPED") {
    updateData.shippedAt = new Date();
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingProvider) updateData.shippingProvider = shippingProvider;
  }
  if (status === "DELIVERED") {
    updateData.deliveredAt = new Date();
  }
  if (status === "CANCELLED") {
    updateData.cancelledAt = new Date();
    if (cancelReason) updateData.cancelReason = cancelReason;
  }

  // Update sub-order
  const updated = await prisma.subOrder.update({
    where: { id: subOrderId },
    data: updateData
  });

  // Recalculate parent order status
  await updateParentOrderStatus(subOrder.parentOrderId);

  return updated;
}

/**
 * Update parent order status based on all sub-order statuses
 * @param {string} parentOrderId - Parent order ID
 */
async function updateParentOrderStatus(parentOrderId) {
  const siblings = await prisma.subOrder.findMany({
    where: { parentOrderId: parentOrderId },
    select: { status: true }
  });

  if (siblings.length === 0) return;

  const allDelivered = siblings.every((s) => s.status === "DELIVERED");
  const allCancelled = siblings.every((s) => s.status === "CANCELLED");
  const anyShipped = siblings.some((s) => ["SHIPPED", "DELIVERED"].includes(s.status));
  const anyPending = siblings.some((s) => ["PENDING", "CONFIRMED", "PROCESSING"].includes(s.status));
  const anyCancelled = siblings.some((s) => s.status === "CANCELLED");

  let parentStatus = "PROCESSING";
  if (allDelivered) parentStatus = "COMPLETED";
  else if (allCancelled) parentStatus = "CANCELLED";
  else if (anyShipped && anyPending) parentStatus = "PARTIALLY_FULFILLED";
  else if (anyCancelled) parentStatus = "PARTIALLY_CANCELLED";

  await prisma.customer_order.update({
    where: { id: parentOrderId },
    data: { status: parentStatus }
  });
}

/**
 * Get merchant shop info and its products
 * @param {string} merchantId - Merchant ID
 * @returns {Promise<Object>} Merchant shop data
 */
async function getMerchantShop(merchantId) {
  if (!merchantId) {
    throw new Error("Merchant ID is required");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        include: {
          category: {
            select: { id: true, name: true }
          },
          reviews: {
            select: { rating: true }
          }
        }
      }
    }
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  // Calculate average rating
  const allRatings = merchant.products.flatMap((p) => p.reviews.map((r) => r.rating));
  const averageRating =
    allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : 0;

  return {
    merchant: {
      id: merchant.id,
      name: merchant.name,
      description: merchant.description,
      avatar: merchant.avatar,
      banner: merchant.banner,
      rating: Math.round(averageRating * 10) / 10,
      totalProducts: merchant.products.length
    },
    products: merchant.products
  };
}

module.exports = {
  createCustomerOrder,
  listCustomerOrders,
  listSellerSubOrders,
  updateSubOrderStatus,
  updateParentOrderStatus,
  getMerchantShop
};