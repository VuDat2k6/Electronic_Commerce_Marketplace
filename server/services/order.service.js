// ============================================
// 订单服务 - 处理多商户订单创建和查询
// ============================================
const { PrismaClient } = require("@prisma/client");

// 使用共享的 Prisma 客户端实例
let prisma;
try {
  prisma = require("../utills/db");
} catch (e) {
  prisma = new PrismaClient();
}

/**
 * 创建客户订单（支持多商户拆分）
 * @param {Object} orderData - 订单数据
 * @returns {Promise<Object>} 创建的订单对象
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

  // 生成唯一订单号
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // 按商户ID分组商品
  const itemsByMerchant = {};
  for (const item of items) {
    const merchantId = item.merchantId || 'default';
    if (!itemsByMerchant[merchantId]) {
      itemsByMerchant[merchantId] = [];
    }
    itemsByMerchant[merchantId].push(item);
  }

  // 使用事务创建订单和子订单
  const result = await prisma.$transaction(async (tx) => {
    // 1. 创建主订单
    const customerOrder = await tx.customer_order.create({
      data: {
        id: orderId,
        name: name || '',
        lastname: lastname || '',
        phone: phone || '',
        email: email || '',
        company: company || '',
        adress: adress || '',
        apartment: apartment || '',
        postalCode: postalCode || '',
        city: city || '',
        country: country || '',
        orderNotice: orderNotice || '',
        status: 'PENDING',
        total: 0, // 将由子订单计算更新
        dateTime: new Date()
      }
    });

    let totalOrderAmount = 0;

    // 2. 为每个商户创建子订单
    for (const [merchantId, merchantItems] of Object.entries(itemsByMerchant)) {
      // 获取商户信息
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId }
      }).catch(() => null);

      // 计算子订单小计
      let subTotal = 0;
      for (const item of merchantItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        }).catch(() => null);
        
        if (product) {
          const unitPrice = item.unitPrice || product.price;
          subTotal += unitPrice * item.quantity;
        }
      }

      // 计算运费
      const shippingFee = merchant?.shippingFee || 0;

      // 创建子订单
      const subOrder = await tx.subOrder.create({
        data: {
          parentOrderId: customerOrder.id,
          merchantId: merchantId,
          status: 'PENDING',
          subTotal: subTotal,
          shippingTotal: shippingFee
        }
      });

      // 3. 为每个商品创建子订单产品记录
      for (const item of merchantItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
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
              merchantNameSnapshot: merchant?.name || 'Unknown'
            }
          });
        }
      }

      totalOrderAmount += subTotal + shippingFee;
    }

    // 4. 更新主订单总金额
    const updatedOrder = await tx.customer_order.update({
      where: { id: customerOrder.id },
      data: { total: totalOrderAmount }
    });

    // 5. 处理优惠券（如果提供）
    if (voucherCodes && voucherCodes.length > 0) {
      for (const code of voucherCodes) {
        const voucher = await tx.voucher.findUnique({
          where: { code: code }
        }).catch(() => null);

        if (voucher && voucher.isActive) {
          // 记录优惠券使用
          await tx.voucherUsage.create({
            data: {
              voucherId: voucher.id,
              userId: customerId || '',
              orderId: customerOrder.id,
              usedAt: new Date()
            }
          });

          // 更新优惠券已使用次数
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
 * 获取客户的订单列表
 * @param {string} customerId - 客户ID
 * @returns {Promise<Object>} 订单列表
 */
async function listCustomerOrders(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  // 通过用户邮箱查找订单（因为订单记录的是邮箱而非用户ID）
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

  // 获取客户的所有订单
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
      dateTime: 'desc'
    }
  });

  // 计算总金额（子订单小计 + 运费）
  const enrichedOrders = orders.map(order => ({
    ...order,
    subOrders: order.subOrders.map(subOrder => ({
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
 * 获取卖家的子订单列表
 * @param {string} merchantId - 商户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 子订单列表
 */
async function listSellerSubOrders(merchantId, options = {}) {
  const { status, page = 1, limit = 20 } = options;

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
      orderBy: { createdAt: 'desc' },
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

  // 计算每个子订单的收入
  const enrichedSubOrders = subOrders.map(subOrder => ({
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
 * 更新子订单状态
 * @param {string} subOrderId - 子订单ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的子订单
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

  // 根据状态更新相关时间戳
  if (status === 'SHIPPED') {
    updateData.shippedAt = new Date();
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingProvider) updateData.shippingProvider = shippingProvider;
  }
  if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }
  if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
    if (cancelReason) updateData.cancelReason = cancelReason;
  }

  // 更新子订单
  const updated = await prisma.subOrder.update({
    where: { id: subOrderId },
    data: updateData
  });

  // 重新计算父订单状态
  await updateParentOrderStatus(subOrder.parentOrderId);

  return updated;
}

/**
 * 更新父订单状态（基于所有子订单状态）
 * @param {string} parentOrderId - 父订单ID
 */
async function updateParentOrderStatus(parentOrderId) {
  const siblings = await prisma.subOrder.findMany({
    where: { parentOrderId: parentOrderId },
    select: { status: true }
  });

  if (siblings.length === 0) return;

  const allDelivered = siblings.every(s => s.status === 'DELIVERED');
  const allCancelled = siblings.every(s => s.status === 'CANCELLED');
  const anyShipped = siblings.some(s => ['SHIPPED', 'DELIVERED'].includes(s));
  const anyPending = siblings.some(s => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(s));
  const anyCancelled = siblings.some(s => s.status === 'CANCELLED');

  let parentStatus = 'PROCESSING';
  if (allDelivered) parentStatus = 'COMPLETED';
  else if (allCancelled) parentStatus = 'CANCELLED';
  else if (anyShipped && anyPending) parentStatus = 'PARTIALLY_FULFILLED';
  else if (anyCancelled) parentStatus = 'PARTIALLY_CANCELLED';

  await prisma.customer_order.update({
    where: { id: parentOrderId },
    data: { status: parentStatus }
  });
}

/**
 * 获取商户店铺信息及其商品
 * @param {string} merchantId - 商户ID
 * @returns {Promise<Object>} 商户店铺信息
 */
async function getMerchantShop(merchantId) {
  if (!merchantId) {
    throw new Error("Merchant ID is required");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      products: {
        where: { status: 'PUBLISHED' },
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

  // 计算平均评分
  const allRatings = merchant.products.flatMap(p => p.reviews.map(r => r.rating));
  const averageRating = allRatings.length > 0
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
