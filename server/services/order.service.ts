import { prisma } from "../../lib/prisma";

// ============================================
// Type definitions
// ============================================

export interface CheckoutPayloadItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  sellerId?: string;
}

export interface CreateCustomerOrderInput {
  // Basic order information (optional, for backward compatibility)
  name?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  apartment?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  orderNotice?: string;
  customerId?: string; // Logged-in user ID
  idempotencyKey?: string;
  items: CheckoutPayloadItem[];
  voucherCodes?: string[]; // List of voucher codes
  paymentMethod?: "COD" | "BANK_TRANSFER" | "CARD" | "VNPAY";
}

export interface CreateCustomerOrderResult {
  orderId: string;
  total: number;
  subTotal: number;
  shippingTotal: number;
  discountTotal: number;
  subOrderCount: number;
  paymentId: string;
  paymentTransactionRef?: string;
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

type SellerOrderGroup = {
  items: { productId: string; quantity: number; unitPrice: number }[];
  subTotal: number;
  shippingTotal: number;
  sellerId: string;
  sellerEmail: string;
};

const ORDER_CANCEL_WINDOW_MS = 12 * 60 * 60 * 1000;
const CANCELLABLE_SUB_ORDER_STATUSES = new Set(["PENDING", "CONFIRMED", "PROCESSING"]);
const CLOSED_PARENT_ORDER_STATUSES = new Set(["canceled", "delivered"]);

export interface ListCustomerOrdersResult {
  orders: unknown[];
}

export interface CancelCustomerOrderResult {
  orderId: string;
  status: "canceled";
  cancelledSubOrderCount: number;
  restockedItemCount: number;
}

export interface ListSellerSubOrdersResult {
  subOrders: unknown[];
}

export interface GetMerchantShopResult {
  merchant: unknown;
  products: unknown[];
}

// ============================================
// Helper functions
// ============================================

/**
 * Derive parent order status from sub-order statuses
 */
function deriveParentOrderStatus(subOrderStatuses: string[]): "processing" | "delivered" | "canceled" {
  if (subOrderStatuses.length === 0) return "processing";
  
  const allDelivered = subOrderStatuses.every((s) => s === "DELIVERED");
  if (allDelivered) return "delivered";
  
  const allCancelled = subOrderStatuses.every((s) => s === "CANCELLED");
  if (allCancelled) return "canceled";

  return "processing";
}

function getBuyerDisplayName(input: CreateCustomerOrderInput) {
  const fullName = [input.name, input.lastname].filter(Boolean).join(" ").trim();
  return fullName || input.email || "A customer";
}

async function createSellerNewOrderNotifications(
  orderId: string,
  buyerName: string,
  subOrders: SubOrderSummary[]
) {
  if (subOrders.length === 0) return;

  const notifications = subOrders.map((subOrder) => {
    const productLabel = subOrder.productCount === 1 ? "item" : "items";

    return {
      userId: subOrder.merchantId,
      title: "New order received",
      message: `${buyerName} placed order #${orderId} with ${subOrder.productCount} ${productLabel}.`,
      type: "NEW_ORDER" as const,
      priority: "HIGH" as const,
      isRead: false,
      metadata: {
        orderId,
        subOrderId: subOrder.id,
        productCount: subOrder.productCount,
        subTotal: subOrder.subTotal,
        shippingTotal: subOrder.shippingTotal,
      },
    };
  });

  try {
    await prisma.notification.createMany({ data: notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown notification error";
    console.warn(`Failed to create seller new-order notifications for order ${orderId}: ${message}`);
  }
}

async function createBuyerOrderNotification(
  orderId: string,
  input: CreateCustomerOrderInput,
  totals: {
    total: number;
    subTotal: number;
    shippingTotal: number;
    discountTotal: number;
    subOrderCount: number;
  }
) {
  if (!input.customerId) return;

  try {
    await prisma.notification.create({
      data: {
        userId: input.customerId,
        title: input.paymentMethod === "VNPAY" ? "Payment required" : "Order confirmed",
        message:
          input.paymentMethod === "VNPAY"
            ? `Your order #${orderId} is reserved while VNPay payment is pending.`
            : `Your order #${orderId} has been placed successfully and is waiting for seller confirmation.`,
        type: input.paymentMethod === "VNPAY" ? "PAYMENT_STATUS" : "ORDER_UPDATE",
        priority: "NORMAL",
        isRead: false,
        metadata: {
          orderId,
          total: totals.total,
          subTotal: totals.subTotal,
          shippingTotal: totals.shippingTotal,
          discountTotal: totals.discountTotal,
          subOrderCount: totals.subOrderCount,
          paymentMethod: input.paymentMethod || "COD",
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown notification error";
    console.warn(`Failed to create buyer order notification for order ${orderId}: ${message}`);
  }
}

// ============================================
// Core business logic
// ============================================

/**
 * Create a customer order, split it into per-seller sub-orders, persist product snapshots, decrement inventory, and apply vouchers.
 *
 * Performs validation of input items, merges duplicate product entries, verifies stock and prices against the database, groups items by seller, applies vouchers, and creates a parent order plus one sub-order per seller inside a single database transaction. Voucher usage is recorded and product inventory is decremented atomically; if any inventory decrement does not affect exactly one row the transaction fails and an error is thrown.
 *
 * @param input - Order creation input including customer/billing fields, `items` (cart lines), and optional `voucherCodes`
 * @returns The created order summary including `orderId`, `total`, `subTotal`, `shippingTotal`, `discountTotal`, `subOrderCount`, `message`, and optional `subOrders`
 */
export async function createCustomerOrder(
  input: CreateCustomerOrderInput
): Promise<CreateCustomerOrderResult> {
  if (!input.items || input.items.length === 0) {
    throw new Error("At least one cart item is required");
  }

  if (input.customerId && input.idempotencyKey) {
    const existingOrder = await prisma.customer_order.findFirst({
      where: {
        buyerId: input.customerId,
        idempotencyKey: input.idempotencyKey,
      },
      include: {
        payments: { take: 1 },
        subOrders: true,
      },
    });

    if (existingOrder) {
      const payment = existingOrder.payments[0];
      return {
        orderId: existingOrder.id,
        total: existingOrder.total,
        subTotal: existingOrder.subOrders.reduce((sum, item) => sum + item.subTotal, 0),
        shippingTotal: existingOrder.subOrders.reduce((sum, item) => sum + item.shippingTotal, 0),
        discountTotal: 0,
        subOrderCount: existingOrder.subOrders.length,
        paymentId: payment?.id || "",
        paymentTransactionRef: payment?.transactionRef || undefined,
        message: "Existing order returned",
      };
    }
  }

  // ============================================
  // Step 1: Normalize cart items
  // ============================================
  const normalizedItems = input.items.map((item) => ({
    productId: item.productId?.trim(),
    quantity: Number(item.quantity),
    unitPrice: item.unitPrice,
    sellerId: item.sellerId,
  }));

  for (const item of normalizedItems) {
    if (!item.productId) {
      throw new Error("Each cart item requires a valid productId");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Each cart item requires quantity > 0");
    }
  }

  // Merge duplicated productIds before checking stock
  // This prevents stock validation errors when the same product appears multiple times
  const mergedItemMap = new Map<
    string,
    {
      productId: string;
      quantity: number;
      unitPrice?: number;
      sellerId?: string;
    }
  >();

  for (const item of normalizedItems) {
    const existing = mergedItemMap.get(item.productId);

    if (existing) {
      existing.quantity += item.quantity;

      if (
        typeof existing.unitPrice === "number" &&
        typeof item.unitPrice === "number" &&
        existing.unitPrice !== item.unitPrice
      ) {
        throw new Error(`Inconsistent unitPrice for productId: ${item.productId}`);
      }

      if (
        existing.sellerId &&
        item.sellerId &&
        existing.sellerId !== item.sellerId
      ) {
        throw new Error(`Inconsistent sellerId for productId: ${item.productId}`);
      }
    } else {
      mergedItemMap.set(item.productId, { ...item });
    }
  }

  const mergedItems = [...mergedItemMap.values()];

  // ============================================
  // Step 2: Fetch product information from database
  // ============================================
  const uniqueProductIds = [...new Set(mergedItems.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds } },
    include: {
      seller: {
        select: {
          id: true,
          email: true,
          shopStatus: true,
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
  // Step 3: Validate products and group by seller
  // ============================================
  const sellerGroups = new Map<
    string,
    SellerOrderGroup
  >();

  for (const item of mergedItems) {
    const dbProduct = productMap.get(item.productId)!;

    // Business validation
    if (dbProduct.status !== "PUBLISHED") {
      throw new Error(`"${dbProduct.title}" is no longer available for purchase. Please remove it from your cart.`);
    }

    if (dbProduct.seller?.shopStatus !== "ACTIVE") {
      throw new Error(`Seller shop for "${dbProduct.title}" is not active. Please remove it from your cart.`);
    }

    if (dbProduct.inStock < item.quantity) {
      throw new Error(`Insufficient stock for "${dbProduct.title}": only ${dbProduct.inStock} left`);
    }

    const dbPrice = Number(dbProduct.price);
    if (typeof item.unitPrice === "number" && item.unitPrice !== dbPrice) {
      throw new Error(`Price changed for "${dbProduct.title}". Please refresh your cart.`);
    }

    // Group by seller (use sellerId from product)
    const sellerId = dbProduct.sellerId;
    if (!sellerGroups.has(sellerId)) {
      sellerGroups.set(sellerId, {
        items: [],
        subTotal: 0,
        shippingTotal: 0, // No per-seller shipping in current schema
        sellerId,
        sellerEmail: dbProduct.seller?.email || "",
      });
    }

    const group = sellerGroups.get(sellerId)!;
    group.items.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: dbPrice,
    });
    group.subTotal += dbPrice * item.quantity;
  }

  // Calculate totals
  let totalSubTotal = 0;

  for (const group of sellerGroups.values()) {
    totalSubTotal += group.subTotal;
  }

  const grandTotal = totalSubTotal;

  // ============================================
  // Step 4: Apply vouchers
  // ============================================
  let discountTotal = 0;
  const appliedVouchers: { code: string; discount: number }[] = [];

  if (input.voucherCodes && input.voucherCodes.length > 0) {
    const userId = input.customerId || input.email || "anonymous";
    const voucherResults = await applyVouchers(input.voucherCodes, userId, grandTotal, sellerGroups);
    discountTotal = voucherResults.totalDiscount;
    appliedVouchers.push(...voucherResults.applied);
  }

  const shippingTotal = grandTotal > 0 ? 50000 : 0;
  const taxTotal = Math.round(grandTotal * 0.05);
  const finalTotal = Math.max(0, grandTotal - discountTotal + shippingTotal + taxTotal);
  const paymentMethod = input.paymentMethod || "COD";

  if (!["COD", "BANK_TRANSFER", "CARD", "VNPAY"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  if (paymentMethod === "VNPAY" && input.customerId) {
    const activeReservations = await prisma.payment.count({
      where: {
        provider: "VNPAY",
        status: "PENDING",
        expiresAt: { gt: new Date() },
        customer_order: { is: { buyerId: input.customerId } },
      },
    });
    if (activeReservations >= 3) {
      throw new Error("Complete or wait for your pending VNPay payments before creating another order");
    }
  }

  // ============================================
  // Step 5: Create order + sub-orders + snapshots in transaction
  // ============================================
  const createdOrder = await prisma.$transaction(async (tx) => {
    // 5.1 Create parent order
    const order = await tx.customer_order.create({
      data: {
        buyerId: input.customerId || null,
        idempotencyKey: input.idempotencyKey || null,
        name: input.name || "Customer",
        lastname: input.lastname || "Order",
        phone: input.phone || "N/A",
        email: input.email || input.customerId || "",
        company: input.company || "",
        address: input.address || "",
        apartment: input.apartment || "",
        postalCode: input.postalCode || "",
        city: input.city || "",
        country: input.country || "",
        orderNotice: input.orderNotice || "",
        status: "processing",
        total: finalTotal,
      },
    });

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        method: paymentMethod,
        provider: paymentMethod === "VNPAY" ? "VNPAY" : "INTERNAL",
        status: "PENDING",
        amount: finalTotal,
      },
    });

    if (paymentMethod === "VNPAY") {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          transactionRef: payment.id.replace(/-/g, ""),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    }

    const createdSubOrders: SubOrderSummary[] = [];

    // 5.2 Create one sub-order for each seller
    for (const [, group] of sellerGroups.entries()) {
      const subOrder = await tx.subOrder.create({
        data: {
          parentOrderId: order.id,
          merchantId: group.sellerId,
          status: "PENDING",
          subTotal: group.subTotal,
          shippingTotal: group.shippingTotal,
          confirmedAt: new Date(),
        },
      });

      // 5.3 Create product snapshots for this sub-order
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
            merchantIdSnapshot: group.sellerId,
            merchantNameSnapshot: dbProduct.seller?.email || "Unknown Seller",
          },
        });

        // 5.4 Decrease stock safely to prevent overselling
        const stockUpdateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            status: "PUBLISHED",
            seller: { is: { shopStatus: "ACTIVE" } },
            inStock: { gte: item.quantity },
          },
          data: {
            inStock: { decrement: item.quantity },
          },
        });

        if (stockUpdateResult.count !== 1) {
          throw new Error(`"${dbProduct.title}" is no longer available in the requested quantity. Please refresh your cart.`);
        }
      }

      createdSubOrders.push({
        id: subOrder.id,
        merchantId: group.sellerId,
        merchantName: group.sellerEmail || "Unknown Seller",
        status: subOrder.status,
        subTotal: group.subTotal,
        shippingTotal: group.shippingTotal,
        productCount: group.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    }

    // 5.5 Record voucher usage
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

    return {
      ...order,
      paymentId: payment.id,
      paymentTransactionRef: paymentMethod === "VNPAY" ? payment.id.replace(/-/g, "") : undefined,
      subOrders: createdSubOrders,
    };
  });

  const notificationTasks: Promise<unknown>[] = [
    createBuyerOrderNotification(createdOrder.id, input, {
      total: finalTotal,
      subTotal: totalSubTotal,
      shippingTotal,
      discountTotal,
      subOrderCount: sellerGroups.size,
    }),
  ];

  if (paymentMethod !== "VNPAY") {
    notificationTasks.push(createSellerNewOrderNotifications(
      createdOrder.id,
      getBuyerDisplayName(input),
      createdOrder.subOrders || []
    ));
  }

  await Promise.all(notificationTasks);

  return {
    orderId: createdOrder.id,
    total: finalTotal,
    subTotal: totalSubTotal,
    shippingTotal,
    discountTotal,
    subOrderCount: sellerGroups.size,
    paymentId: createdOrder.paymentId,
    paymentTransactionRef: createdOrder.paymentTransactionRef,
    message: "Order created successfully",
    subOrders: createdOrder.subOrders || [],
  };
}

/**
 * Validates voucher codes and computes the total discount and which vouchers were applied.
 *
 * @param voucherCodes - Array of voucher codes to evaluate (case-insensitive)
 * @param userId - Identifier of the user attempting to apply the vouchers; used for per-user limits
 * @param orderTotal - Order total used to evaluate minimum-order and percentage-based discounts
 * @param sellerGroups - Seller grouping context used to scope seller vouchers
 * @returns An object containing `totalDiscount` (sum of all applied discounts) and `applied` (array of `{ code, discount }` for each applied voucher)
 */
async function applyVouchers(
  voucherCodes: string[],
  userId: string,
  orderTotal: number,
  sellerGroups: Map<string, SellerOrderGroup>
): Promise<{ totalDiscount: number; applied: { code: string; discount: number }[] }> {
  let totalDiscount = 0;
  const applied: { code: string; discount: number }[] = [];
  const normalizedCodes = [...new Set(voucherCodes.map((code) => String(code).trim().toUpperCase()).filter(Boolean))];

  for (const code of normalizedCodes) {
    const voucher = await prisma.voucher.findUnique({
      where: { code },
      include: { merchant: { select: { name: true } } },
    });

    if (!voucher) throw new Error(`Voucher ${code} was not found`);
    if (!voucher.isActive) throw new Error(`Voucher ${code} is no longer active`);
    if (voucher.startsAt && new Date() < voucher.startsAt) throw new Error(`Voucher ${code} is not active yet`);
    if (new Date() > voucher.expiresAt) throw new Error(`Voucher ${code} has expired`);
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new Error(`Voucher ${code} has reached its usage limit`);
    }

    // Check per-user usage limit
    if (userId) {
      const userUsageCount = await prisma.voucherUsage.count({
        where: { voucherId: voucher.id, userId },
      });
      if (userUsageCount >= voucher.perUserLimit) {
        throw new Error(`Voucher ${code} has already been used by this account`);
      }
    }

    const eligibleTotal = voucher.merchantId
      ? sellerGroups.get(voucher.merchantId)?.subTotal || 0
      : orderTotal;

    if (voucher.merchantId && eligibleTotal <= 0) {
      throw new Error(`Voucher ${code} only applies to products from ${voucher.merchant?.name || "the seller"}`);
    }

    // Check minimum order amount
    if (voucher.minOrderValue && eligibleTotal < voucher.minOrderValue) {
      throw new Error(`Voucher ${code} requires a minimum eligible subtotal of ${voucher.minOrderValue.toLocaleString("vi-VN")} VND`);
    }

    // Calculate discount
    let discount = 0;
    if (voucher.discountType === "FIXED") {
      discount = voucher.discountValue;
    } else if (voucher.discountType === "PERCENTAGE") {
      discount = Math.floor(eligibleTotal * (voucher.discountValue / 100));
      if (voucher.maxDiscount) {
        discount = Math.min(discount, voucher.maxDiscount);
      }
    }

    discount = Math.min(discount, eligibleTotal);

    if (discount > 0) {
      totalDiscount += discount;
      applied.push({ code, discount });
    } else {
      throw new Error(`Voucher ${code} does not apply to this order`);
    }
  }

  return { totalDiscount, applied };
}

// ============================================
// Query functions
/**
 * Fetches orders for an authenticated buyer, including seller-split products and payments.
 *
 * @param customerId - The authenticated buyer user ID used to look up orders
 * @returns An object with an `orders` array; each order includes `subOrders.products` and `payments`
 * @throws If `customerId` is falsy
 */

export async function listCustomerOrders(customerId: string): Promise<ListCustomerOrdersResult> {
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const orders = await prisma.customer_order.findMany({
    where: { buyerId: customerId },
    orderBy: { dateTime: "desc" },
    include: {
      subOrders: {
        orderBy: { createdAt: "desc" },
        include: {
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

export async function cancelCustomerOrder(
  orderId: string,
  customerId: string
): Promise<CancelCustomerOrderResult> {
  if (!orderId) {
    throw new Error("orderId is required");
  }
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const order = await tx.customer_order.findFirst({
      where: { id: orderId, buyerId: customerId },
      include: {
        subOrders: {
          include: {
            products: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (CLOSED_PARENT_ORDER_STATUSES.has(order.status)) {
      throw new Error("This order is already closed");
    }

    if (order.payments.some((payment) => payment.status === "COMPLETED")) {
      throw new Error("Paid orders require support-assisted cancellation because refunds are not automated yet");
    }

    const pendingVnpayPayments = order.payments.filter(
      (payment) => payment.provider === "VNPAY" && payment.status === "PENDING",
    );
    if (pendingVnpayPayments.length > 0) {
      const transition = await tx.payment.updateMany({
        where: {
          id: { in: pendingVnpayPayments.map((payment) => payment.id) },
          status: "PENDING",
        },
        data: { status: "CANCELLED" },
      });
      if (transition.count !== pendingVnpayPayments.length) {
        throw new Error("Payment status changed while cancelling the order. Please refresh and try again");
      }
    }

    const placedAt = order.dateTime;
    const cancelDeadline = new Date(placedAt.getTime() + ORDER_CANCEL_WINDOW_MS);

    if (now > cancelDeadline) {
      throw new Error("Orders can only be cancelled within 12 hours after placement");
    }

    const blockedSubOrder = order.subOrders.find(
      (subOrder) => !CANCELLABLE_SUB_ORDER_STATUSES.has(subOrder.status)
    );

    if (blockedSubOrder) {
      throw new Error("This order can no longer be cancelled because fulfillment has already started");
    }

    const orderedProducts = order.subOrders.flatMap((subOrder) => subOrder.products);

    for (const item of orderedProducts) {
      await tx.product.update({
        where: { id: item.productId },
        data: { inStock: { increment: item.quantity } },
      });
    }

    await tx.subOrder.updateMany({
      where: { parentOrderId: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelReason: "Cancelled by buyer within 12 hours",
      },
    });

    await tx.customer_order.update({
      where: { id: order.id },
      data: { status: "canceled" },
    });

    await tx.payment.updateMany({
      where: {
        orderId: order.id,
        status: { not: "COMPLETED" },
      },
      data: { status: "CANCELLED" },
    });

    const voucherUsages = await tx.voucherUsage.findMany({
      where: { orderId: order.id },
      select: { voucherId: true },
    });
    const voucherIds = [...new Set(voucherUsages.map((usage) => usage.voucherId))];

    for (const voucherId of voucherIds) {
      await tx.voucher.updateMany({
        where: { id: voucherId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    if (voucherIds.length > 0) {
      await tx.voucherUsage.deleteMany({ where: { orderId: order.id } });
    }

    const sellerIds = [...new Set(order.subOrders.map((subOrder) => subOrder.merchantId))];
    await tx.notification.createMany({
      data: [
        {
          userId: customerId,
          title: "Order cancelled",
          message: `Your order #${order.id} was cancelled successfully within the 12-hour window.`,
          type: "ORDER_UPDATE",
          priority: "NORMAL",
          isRead: false,
          metadata: {
            orderId: order.id,
            cancelledAt: now.toISOString(),
          },
        },
        ...sellerIds.map((sellerId) => ({
          userId: sellerId,
          title: "Order cancelled by buyer",
          message: `Order #${order.id} was cancelled by the buyer within the 12-hour window.`,
          type: "ORDER_UPDATE" as const,
          priority: "NORMAL" as const,
          isRead: false,
          metadata: {
            orderId: order.id,
            cancelledAt: now.toISOString(),
          },
        })),
      ],
    });

    return {
      orderId: order.id,
      status: "canceled",
      cancelledSubOrderCount: order.subOrders.length,
      restockedItemCount: orderedProducts.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
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
          address: true,
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

  const seller = await prisma.user.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      email: true,
      role: true,
      shopName: true,
      shopDescription: true,
      shopPhone: true,
      shopAddress: true,
      shopStatus: true,
    },
  });

  if (!seller || seller.role !== "seller" || seller.shopStatus !== "ACTIVE") {
    throw new Error("Shop is not active");
  }

  const legacyMerchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      email: true,
      phone: true,
      address: true,
      shippingFee: true,
      avatar: true,
      banner: true,
    },
  });

  const merchant = {
    id: seller.id,
    name: seller.shopName || legacyMerchant?.email || seller.email,
    description: seller.shopDescription || null,
    status: seller.shopStatus,
    email: seller.email || legacyMerchant?.email || null,
    phone: seller.shopPhone || legacyMerchant?.phone || null,
    address: seller.shopAddress || legacyMerchant?.address || null,
    shippingFee: legacyMerchant?.shippingFee || 0,
    avatar: legacyMerchant?.avatar || null,
    banner: legacyMerchant?.banner || null,
  };

  const products = await prisma.product.findMany({
    where: { sellerId: merchantId, status: "PUBLISHED" },
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
 * Update sub-order status (for seller actions)
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

  const updateData: {
    status: string;
    shippedAt?: Date;
    trackingNumber?: string;
    shippingProvider?: string;
    deliveredAt?: Date;
    cancelledAt?: Date;
  } = { status: newStatus };

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

  // Re-derive parent order status
  const siblingSubOrders = await prisma.subOrder.findMany({
    where: { parentOrderId: subOrder.parentOrderId },
    select: { status: true },
  });

  const derivedStatus = deriveParentOrderStatus(siblingSubOrders.map((s) => s.status));
  await prisma.customer_order.update({
    where: { id: subOrder.parentOrderId },
    data: { status: derivedStatus },
  });

  return updated;
}
