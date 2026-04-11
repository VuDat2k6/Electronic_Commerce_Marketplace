const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { asyncHandler } = require("../utills/errorHandler");

// ============================================
// 获取卖家的所有子订单
// GET /api/seller/orders
// ============================================
router.get("/", asyncHandler(async (req, res) => {
  const merchantId = req.query.merchantId;
  const status = req.query.status;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  if (!merchantId) {
    return res.status(400).json({ error: "merchantId is required" });
  }

  const where = { merchantId };
  if (status) where.status = status;

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
            total: true,
          },
        },
        products: {
          include: {
            product: {
              select: { id: true, title: true, slug: true, mainImage: true },
            },
          },
        },
      },
    }),
    prisma.subOrder.count({ where }),
  ]);

  // 计算每个子订单的收入（小计 + 运费）
  const enrichedSubOrders = subOrders.map((so) => ({
    ...so,
    revenue: so.subTotal + so.shippingTotal,
  }));

  return res.json({
    subOrders: enrichedSubOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// ============================================
// 获取单个子订单详情
// GET /api/seller/orders/:id
// ============================================
router.get("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const merchantId = req.query.merchantId;

  const subOrder = await prisma.subOrder.findUnique({
    where: { id },
    include: {
      parentOrder: true,
      merchant: { select: { id: true, name: true, email: true, phone: true } },
      products: {
        include: {
          product: { select: { id: true, title: true, slug: true, mainImage: true, price: true } },
        },
      },
    },
  });

  if (!subOrder) {
    return res.status(404).json({ error: "SubOrder not found" });
  }

  // 权限检查
  if (merchantId && subOrder.merchantId !== merchantId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  return res.json({
    ...subOrder,
    revenue: subOrder.subTotal + subOrder.shippingTotal,
  });
}));

// ============================================
// 更新子订单状态
// PUT /api/seller/orders/:id/status
// ============================================
router.put("/:id/status", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber, shippingProvider, merchantId, cancelReason } = req.body;

  if (!merchantId) {
    return res.status(400).json({ error: "merchantId is required" });
  }

  const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const subOrder = await prisma.subOrder.findUnique({ where: { id } });

  if (!subOrder) {
    return res.status(404).json({ error: "SubOrder not found" });
  }
  if (subOrder.merchantId !== merchantId) {
    return res.status(403).json({ error: "Unauthorized: merchant mismatch" });
  }

  const updateData = { status };
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

  const updated = await prisma.subOrder.update({
    where: { id },
    data: updateData,
  });

  // 重新派生父订单状态
  const siblings = await prisma.subOrder.findMany({
    where: { parentOrderId: subOrder.parentOrderId },
    select: { status: true },
  });

  const allDelivered = siblings.every(s => s.status === "DELIVERED");
  const allCancelled = siblings.every(s => s.status === "CANCELLED");
  const anyShipped = siblings.some(s => ["SHIPPED", "DELIVERED"].includes(s));
  const anyPending = siblings.some(s => ["PENDING", "CONFIRMED", "PROCESSING"].includes(s));
  const anyCancelled = siblings.some(s => s.status === "CANCELLED");

  let parentStatus = "PROCESSING";
  if (allDelivered) parentStatus = "COMPLETED";
  else if (allCancelled) parentStatus = "CANCELLED";
  else if (anyShipped && anyPending) parentStatus = "PARTIALLY_FULFILLED";
  else if (anyCancelled) parentStatus = "PARTIALLY_CANCELLED";

  await prisma.customer_order.update({
    where: { id: subOrder.parentOrderId },
    data: { status: parentStatus },
  });

  return res.json(updated);
}));

// ============================================
// 获取卖家统计概览
// GET /api/seller/orders/stats
// ============================================
router.get("/stats/overview", asyncHandler(async (req, res) => {
  const merchantId = req.query.merchantId;

  if (!merchantId) {
    return res.status(400).json({ error: "merchantId is required" });
  }

  const [totalSubOrders, pendingOrders, shippedOrders, deliveredOrders, cancelledOrders] = await Promise.all([
    prisma.subOrder.count({ where: { merchantId } }),
    prisma.subOrder.count({ where: { merchantId, status: "PENDING" } }),
    prisma.subOrder.count({ where: { merchantId, status: "SHIPPED" } }),
    prisma.subOrder.count({ where: { merchantId, status: "DELIVERED" } }),
    prisma.subOrder.count({ where: { merchantId, status: "CANCELLED" } }),
  ]);

  // 计算总收入（已完成的订单）
  const revenueResult = await prisma.subOrder.aggregate({
    where: { merchantId, status: { in: ["DELIVERED", "SHIPPED"] } },
    _sum: { subTotal: true, shippingTotal: true },
  });

  const totalRevenue = (revenueResult._sum.subTotal || 0) + (revenueResult._sum.shippingTotal || 0);

  return res.json({
    totalSubOrders,
    pendingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
  });
}));

module.exports = router;
