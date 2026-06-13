// server/controllers/sellerAnalytics.js
const prisma = require('../utils/db');
const { asyncHandler } = require('../utils/errorHandler');

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function toDateKey(date) {
  return new Date(date).toISOString().split('T')[0];
}

function normalizeAnalyticsStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();

  if (['PENDING'].includes(normalized)) return 'pending';
  if (['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(normalized)) return 'processing';
  if (['DELIVERED', 'COMPLETED', 'PAID'].includes(normalized)) return 'delivered';
  if (['CANCELLED', 'CANCELED'].includes(normalized)) return 'canceled';

  return 'pending';
}

function addProductSales(productMap, productId, quantity, revenue, product) {
  if (!productId) return;

  const existing = productMap.get(productId) || {
    productId,
    quantitySold: 0,
    revenue: 0,
    product: product || null,
  };

  existing.quantitySold += quantity;
  existing.revenue += revenue;
  if (!existing.product && product) {
    existing.product = product;
  }

  productMap.set(productId, existing);
}

// GET /api/seller/analytics/overview
const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user.role === 'admin' && req.query.sellerId
    ? req.query.sellerId
    : req.user.id;

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, role: true },
  });

  if (!seller || seller.role !== 'seller') {
    throw new Error('Seller does not exist');
  }

  const now = new Date();
  const today = startOfDay(now);
  const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const thirtyDaysAgo = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));

  const [totalProducts, legacyOrderItems, currentSubOrders] = await Promise.all([
    prisma.product.count({ where: { sellerId } }),
    prisma.order_item.findMany({
      where: { sellerId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            dateTime: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            mainImage: true,
          },
        },
      },
      orderBy: { order: { dateTime: 'desc' } },
    }),
    prisma.subOrder.findMany({
      where: {
        merchantId: sellerId,
        parentOrder: {
          is: {
            OR: [
              { payments: { none: { provider: 'VNPAY' } } },
              { payments: { some: { provider: 'VNPAY', status: 'COMPLETED' } } },
            ],
          },
        },
      },
      include: {
        parentOrder: {
          select: {
            id: true,
            status: true,
            dateTime: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                mainImage: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const productSales = new Map();
  const legacyOrderMap = new Map();

  for (const item of legacyOrderItems) {
    if (!item.order) continue;

    const revenue = item.priceAtPurchase * item.quantity;
    const existing = legacyOrderMap.get(item.orderId) || {
      id: item.orderId,
      total: 0,
      itemCount: 0,
      status: item.order.status,
      date: item.order.dateTime,
    };

    existing.total += revenue;
    existing.itemCount += item.quantity;
    legacyOrderMap.set(item.orderId, existing);
    addProductSales(productSales, item.productId, item.quantity, revenue, item.product);
  }

  const legacyOrders = Array.from(legacyOrderMap.values());
  const currentOrders = currentSubOrders.map((subOrder) => {
    const productTotal = subOrder.products.reduce(
      (sum, product) => sum + product.unitPriceSnapshot * product.quantity,
      0
    );
    const total = subOrder.subTotal || productTotal;

    for (const product of subOrder.products) {
      addProductSales(
        productSales,
        product.productId,
        product.quantity,
        product.unitPriceSnapshot * product.quantity,
        product.product
      );
    }

    return {
      id: subOrder.id,
      parentOrderId: subOrder.parentOrderId,
      total,
      itemCount: subOrder.products.reduce((sum, product) => sum + product.quantity, 0),
      status: subOrder.status || subOrder.parentOrder?.status,
      date: subOrder.parentOrder?.dateTime || subOrder.createdAt,
    };
  });

  const allOrders = [...legacyOrders, ...currentOrders].filter((order) => order.date);
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);

  const recentOrdersList = allOrders.filter((order) => new Date(order.date) >= sevenDaysAgo);
  const recentOrders = recentOrdersList.length;
  const recentRevenue = recentOrdersList.reduce((sum, order) => sum + order.total, 0);

  const dailyRevenueMap = new Map();
  for (let i = 29; i >= 0; i--) {
    const date = startOfDay(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
    dailyRevenueMap.set(toDateKey(date), 0);
  }

  for (const order of allOrders) {
    const orderDate = new Date(order.date);
    if (orderDate < thirtyDaysAgo) continue;

    const key = toDateKey(orderDate);
    dailyRevenueMap.set(key, (dailyRevenueMap.get(key) || 0) + order.total);
  }

  const orderStatusBreakdown = {
    pending: 0,
    processing: 0,
    delivered: 0,
    canceled: 0,
  };

  for (const order of allOrders) {
    const key = normalizeAnalyticsStatus(order.status);
    orderStatusBreakdown[key] += 1;
  }

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return res.json({
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders,
    recentRevenue,
    topProducts,
    dailyRevenue: Array.from(dailyRevenueMap.entries()).map(([date, revenue]) => ({ date, revenue })),
    orderStatusBreakdown,
    averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
  });
});

module.exports = { getSellerAnalytics };
