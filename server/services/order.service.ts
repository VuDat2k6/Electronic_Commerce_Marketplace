import { prisma } from "../../lib/prisma";

// ============================================
// 类型定义
// ============================================

export interface CheckoutPayloadItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  merchantId?: string;
}

export interface CreateCustomerOrderInput {
  // 订单基本信息（可选，兼容旧的简化调用）
  name?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  company?: string;
  adress?: string;
  apartment?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  orderNotice?: string;
  customerId?: string; // 用户ID（登录用户）
  items: CheckoutPayloadItem[];
  voucherCodes?: string[]; // 优惠券码列表
}

export interface CreateCustomerOrderResult {
  orderId: string;
  total: number;
  subTotal: number;
  shippingTotal: number;
  discountTotal: number;
  subOrderCount: number;
  message: string;
  subOrders?: SubOrderSummary[];
}

export interface SubOrderSummary {
  id: string;
  merchantId: string;
  merchantName: string;
  status: string;
  subTotal: number;
  shippingTotal: number;
  productCount: number;
}

export interface ListCustomerOrdersResult {
  orders: unknown[];
}

export interface ListSellerSubOrdersResult {
  subOrders: unknown[];
}

export interface GetMerchantShopResult {
  merchant: unknown;
  products: unknown[];
}

// ============================================
// 辅助函数
// ============================================

/**
 * 根据子订单状态派生父订单状态
 */
function deriveParentOrderStatus(subOrderStatuses: string[]): string {
  if (subOrderStatuses.length === 0) return "PENDING";
  
  const allDelivered = subOrderStatuses.every(s => s === "DELIVERED");
  if (allDelivered) return "COMPLETED";
  
  const allCancelled = subOrderStatuses.every(s => s === "CANCELLED");
  if (allCancelled) return "CANCELLED";
  
  const anyShipped = subOrderStatuses.some(s => ["SHIPPED", "DELIVERED"].includes(s));
  const anyPending = subOrderStatuses.some(s => ["PENDING", "CONFIRMED", "PROCESSING"].includes(s));
  if (anyShipped && anyPending) return "PARTIALLY_FULFILLED";
  
  const anyCancelled = subOrderStatuses.some(s => s === "CANCELLED");
  if (anyCancelled) return "PARTIALLY_CANCELLED";
  
  const anyConfirmed = subOrderStatuses.some(s => s !== "PENDING");
  if (anyConfirmed) return "PROCESSING";
  
  return "PAID";
}

// ============================================
// 核心业务逻辑
// ============================================

/**
 * 创建客户订单（带 SubOrder 拆分）
 * 核心逻辑：
 * 1. 验证商品信息（库存、价格、商户）
 * 2. 按商户分组商品
 * 3. 在事务中创建父订单 + 子订单 + 订单产品快照
 * 4. 扣减库存
 */
export async function createCustomerOrder(
  input: CreateCustomerOrderInput
): Promise<CreateCustomerOrderResult> {
  if (!input.items || input.items.length === 0) {
    throw new Error("At least one cart item is required");
  }

  // ============================================
  // 第1步：规范化商品数据
  // ============================================
  const normalizedItems = input.items.map((item) => ({
    productId: item.productId?.trim(),
    quantity: Number(item.quantity),
    unitPrice: item.unitPrice,
    merchantId: item.merchantId,
  }));

  for (const item of normalizedItems) {
    if (!item.productId) {
      throw new Error("Each cart item requires a valid productId");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Each cart item requires quantity > 0");
    }
  }

  // ============================================
  // 第2步：从数据库批量获取商品信息（含商户）
  // ============================================
  const uniqueProductIds = [...new Set(normalizedItems.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds } },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          shippingFee: true,
          status: true,
        },
      },
    },
  });

  if (products.length !== uniqueProductIds.length) {
    const foundIds = new Set(products.map((p) => p.id));
    const missing = uniqueProductIds.filter((id) => !foundIds.has(id));
    throw new Error(`Products not found: ${missing.join(", ")}`);
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  // ============================================
  // 第3步：校验商品 + 计算每个商户的运费和小计
  // ============================================
  const merchantGroups = new Map<string, {
    items: { productId: string; quantity: number; unitPrice: number }[];
    subTotal: number;
    shippingTotal: number;
    merchant: (typeof products)[0]["merchant"];
  }>();

  for (const item of normalizedItems) {
    const dbProduct = productMap.get(item.productId)!;

    // 业务校验
    if (dbProduct.merchant.status !== "ACTIVE") {
      throw new Error(`Merchant is not active for product: ${dbProduct.title}`);
    }
    if (dbProduct.inStock < item.quantity) {
      throw new Error(`Insufficient stock for "${dbProduct.title}": only ${dbProduct.inStock} left`);
    }
    if (item.merchantId && item.merchantId !== dbProduct.merchantId) {
      throw new Error(`Merchant mismatch for product: ${dbProduct.title}`);
    }

    const dbPrice = Number(dbProduct.price);
    if (typeof item.unitPrice === "number" && item.unitPrice !== dbPrice) {
      throw new Error(`Price changed for "${dbProduct.title}". Please refresh your cart.`);
    }

    // 按商户分组
    if (!merchantGroups.has(dbProduct.merchantId)) {
      merchantGroups.set(dbProduct.merchantId, {
        items: [],
        subTotal: 0,
        shippingTotal: Number(dbProduct.merchant.shippingFee) || 0,
        merchant: dbProduct.merchant,
      });
    }
    const group = merchantGroups.get(dbProduct.merchantId)!;
    group.items.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: dbPrice,
    });
    group.subTotal += dbPrice * item.quantity;
  }

  // 计算总计
  let totalSubTotal = 0;
  let totalShipping = 0;
  for (const group of merchantGroups.values()) {
    totalSubTotal += group.subTotal;
    totalShipping += group.shippingTotal;
  }
  const grandTotal = totalSubTotal + totalShipping;

  // ============================================
  // 第4步：处理优惠券
  // ============================================
  let discountTotal = 0;
  const appliedVouchers: { code: string; discount: number }[] = [];

  if (input.voucherCodes && input.voucherCodes.length > 0) {
    const voucherResults = await applyVouchers(input.voucherCodes, input.customerId || input.email, grandTotal, merchantGroups);
    discountTotal = voucherResults.totalDiscount;
    appliedVouchers.push(...voucherResults.applied);
  }

  const finalTotal = Math.max(0, grandTotal - discountTotal);

  // ============================================
  // 第5步：事务创建订单 + SubOrder + 产品快照
  // ============================================
  const createdOrder = await prisma.$transaction(async (tx) => {
    // 5.1 创建父订单
    const order = await tx.customer_order.create({
      data: {
        name: input.name || "Customer",
        lastname: input.lastname || "Order",
        phone: input.phone || "N/A",
        email: input.email || input.customerId || "",
        company: input.company || "",
        adress: input.adress || "",
        apartment: input.apartment || "",
        postalCode: input.postalCode || "",
        city: input.city || "",
        country: input.country || "",
        status: "PAID",
        total: finalTotal,
      },
    });

    const createdSubOrders: SubOrderSummary[] = [];

    // 5.2 为每个商户创建 SubOrder
    for (const [merchantId, group] of merchantGroups.entries()) {
      const subOrder = await tx.subOrder.create({
        data: {
          parentOrderId: order.id,
          merchantId,
          status: "PENDING",
          subTotal: group.subTotal,
          shippingTotal: group.shippingTotal,
          confirmedAt: new Date(),
        },
      });

      // 5.3 为该商户的商品创建订单产品快照
      for (const item of group.items) {
        const dbProduct = productMap.get(item.productId)!;
        await tx.subOrderProduct.create({
          data: {
            subOrderId: subOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            productNameSnapshot: dbProduct.title,
            productImageSnapshot: dbProduct.mainImage,
            unitPriceSnapshot: item.unitPrice,
            merchantIdSnapshot: merchantId,
            merchantNameSnapshot: group.merchant.name,
          },
        });

        // 5.4 扣减库存
        await tx.product.update({
          where: { id: item.productId },
          data: { inStock: { decrement: item.quantity } },
        });
      }

      createdSubOrders.push({
        id: subOrder.id,
        merchantId,
        merchantName: group.merchant.name,
        status: subOrder.status,
        subTotal: group.subTotal,
        shippingTotal: group.shippingTotal,
        productCount: group.items.length,
      });
    }

    // 5.5 记录优惠券使用
    for (const voucher of appliedVouchers) {
      const dbVoucher = await tx.voucher.findUnique({ where: { code: voucher.code } });
      if (dbVoucher) {
        await tx.voucher.update({
          where: { id: dbVoucher.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.voucherUsage.create({
          data: {
            voucherId: dbVoucher.id,
            userId: input.customerId || input.email || "anonymous",
            orderId: order.id,
          },
        });
      }
    }

    // 返回带子订单摘要的订单
    return { ...order, subOrders: createdSubOrders };
  });

  return {
    orderId: createdOrder.id,
    total: finalTotal,
    subTotal: totalSubTotal,
    shippingTotal: totalShipping,
    discountTotal,
    subOrderCount: merchantGroups.size,
    message: "Order created successfully",
    subOrders: (createdOrder as any).subOrders || [],
  };
}

/**
 * 验证并应用优惠券
 */
async function applyVouchers(
  voucherCodes: string[],
  userId: string,
  orderTotal: number,
  merchantGroups: Map<string, unknown>
): Promise<{ totalDiscount: number; applied: { code: string; discount: number }[] }> {
  let totalDiscount = 0;
  const applied: { code: string; discount: number }[] = [];

  for (const code of voucherCodes) {
    const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });

    if (!voucher) continue;
    if (!voucher.isActive) continue;
    if (new Date() > voucher.expiresAt) continue;
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) continue;

    // 检查每人使用次数
    if (userId) {
      const userUsageCount = await prisma.voucherUsage.count({
        where: { voucherId: voucher.id, userId },
      });
      if (userUsageCount >= voucher.perUserLimit) continue;
    }

    // 检查最低订单金额
    if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) continue;

    // 计算折扣
    let discount = 0;
    if (voucher.discountType === "FIXED") {
      discount = voucher.discountValue;
    } else if (voucher.discountType === "PERCENTAGE") {
      discount = Math.floor(orderTotal * (voucher.discountValue / 100));
      if (voucher.maxDiscount) {
        discount = Math.min(discount, voucher.maxDiscount);
      }
    }

    if (discount > 0) {
      totalDiscount += discount;
      applied.push({ code, discount });
    }
  }

  return { totalDiscount, applied };
}

// ============================================
// 查询函数
// ============================================

export async function listCustomerOrders(customerId: string): Promise<ListCustomerOrdersResult> {
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const orders = await prisma.customer_order.findMany({
    where: { email: customerId },
    orderBy: { dateTime: "desc" },
    include: {
      subOrders: {
        include: {
          merchant: { select: { id: true, name: true } },
          products: {
            include: {
              product: { select: { id: true, slug: true, mainImage: true } },
            },
          },
        },
      },
      payments: true,
    },
  });

  return { orders };
}

export async function listSellerSubOrders(merchantId: string): Promise<ListSellerSubOrdersResult> {
  if (!merchantId) {
    throw new Error("merchantId is required");
  }

  const subOrders = await prisma.subOrder.findMany({
    where: { merchantId },
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
          city: true,
          country: true,
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
  });

  return { subOrders };
}

export async function getMerchantShop(merchantId: string): Promise<GetMerchantShopResult> {
  if (!merchantId) {
    throw new Error("merchantId is required");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      email: true,
      phone: true,
      address: true,
      shippingFee: true,
      avatar: true,
      banner: true,
    },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  const products = await prisma.product.findMany({
    where: { merchantId },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      price: true,
      inStock: true,
      slug: true,
      mainImage: true,
      description: true,
      rating: true,
    },
  });

  return { merchant, products };
}

/**
 * 更新子订单状态（供卖家操作）
 */
export async function updateSubOrderStatus(
  subOrderId: string,
  merchantId: string,
  newStatus: string,
  trackingData?: { trackingNumber?: string; shippingProvider?: string }
): Promise<unknown> {
  const subOrder = await prisma.subOrder.findUnique({ where: { id: subOrderId } });

  if (!subOrder) throw new Error("SubOrder not found");
  if (subOrder.merchantId !== merchantId) throw new Error("Unauthorized: merchant mismatch");

  const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "SHIPPED") {
    updateData.shippedAt = new Date();
    if (trackingData?.trackingNumber) updateData.trackingNumber = trackingData.trackingNumber;
    if (trackingData?.shippingProvider) updateData.shippingProvider = trackingData.shippingProvider;
  }
  if (newStatus === "DELIVERED") {
    updateData.deliveredAt = new Date();
  }
  if (newStatus === "CANCELLED") {
    updateData.cancelledAt = new Date();
  }

  const updated = await prisma.subOrder.update({
    where: { id: subOrderId },
    data: updateData,
  });

  // 重新派生父订单状态
  const siblingSubOrders = await prisma.subOrder.findMany({
    where: { parentOrderId: subOrder.parentOrderId },
    select: { status: true },
  });

  const derivedStatus = deriveParentOrderStatus(siblingSubOrders.map(s => s.status));
  await prisma.customer_order.update({
    where: { id: subOrder.parentOrderId },
    data: { status: derivedStatus },
  });

  return updated;
}
