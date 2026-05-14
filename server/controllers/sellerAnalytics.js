// server/controllers/sellerAnalytics.js
const prisma = require('../utills/db');
const { asyncHandler } = require('../utills/errorHandler');

// GET /api/seller/analytics/overview?sellerId=xxx
const getSellerAnalytics = asyncHandler(async (req, res) => {
  const { sellerId } = req.query;
  if (!sellerId) throw new Error('sellerId is required');

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.role !== 'seller') throw new Error('Seller does not exist');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total products
  const totalProducts = await prisma.product.count({ where: { sellerId } });

  // Total orders (through order_items)
  const totalOrderItems = await prisma.order_item.findMany({
    where: { sellerId },
    select: { id: true, quantity: true, priceAtPurchase: true, orderId: true, createdAt: true }
  });

  const totalRevenue = totalOrderItems.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
  const totalOrders = totalOrderItems.length;

  // Orders in last 7 days
  const recentOrders = totalOrderItems.filter(item => new Date(item.createdAt) >= sevenDaysAgo);
  const recentRevenue = recentOrders.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

  // Top products by sales
  const productSales = {};
  for (const item of totalOrderItems) {
    if (!productSales[item.productId]) {
      productSales[item.productId] = { productId: item.productId, quantitySold: 0, revenue: 0 };
    }
    productSales[item.productId].quantitySold += item.quantity;
    productSales[item.productId].revenue += item.priceAtPurchase * item.quantity;
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Get product names for top products
  if (topProducts.length > 0) {
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, mainImage: true }
    });
    const productMap = new Map(products.map(p => [p.id, p]));
    for (const p of topProducts) {
      p.product = productMap.get(p.productId) || null;
    }
  }

  // Daily revenue last 30 days
  const dailyRevenue = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    dailyRevenue[dateStr] = 0;
  }

  for (const item of totalOrderItems) {
    const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
    if (dailyRevenue[itemDate] !== undefined) {
      dailyRevenue[itemDate] += item.priceAtPurchase * item.quantity;
    }
  }

  const dailyRevenueArray = Object.entries(dailyRevenue)
    .map(([date, revenue]) => ({ date, revenue }))
    .reverse();

  // Order status breakdown
  const orderStatusBreakdown = {
    pending: 0,
    processing: 0,
    delivered: 0,
    canceled: 0
  };

  // Get order statuses through customer_order
  const orderIds = [...new Set(totalOrderItems.map(item => item.orderId))];
  if (orderIds.length > 0) {
    const orders = await prisma.customer_order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, status: true }
    });
    const orderStatusMap = new Map(orders.map(o => [o.id, o.status]));
    for (const item of totalOrderItems) {
      const status = orderStatusMap.get(item.orderId) || 'pending';
      if (orderStatusBreakdown.hasOwnProperty(status.toLowerCase())) {
        orderStatusBreakdown[status.toLowerCase()]++;
      } else {
        orderStatusBreakdown.pending++;
      }
    }
  }

  return res.json({
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders: recentOrders.length,
    recentRevenue,
    topProducts,
    dailyRevenue: dailyRevenueArray,
    orderStatusBreakdown,
    averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  });
});

module.exports = { getSellerAnalytics };
