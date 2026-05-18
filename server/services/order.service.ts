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
  items: CheckoutPayloadItem[];
  voucherCodes?: string[]; // List of voucher codes
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
// Helper functions
// ============================================

/**
 * Derive parent order status from sub-order statuses
 */
function deriveParentOrderStatus(subOrderStatuses: string[]): string {
  if (subOrderStatuses.length === 0) return "PENDING";
  
  const allDelivered = subOrderStatuses.every((s) => s === "DELIVERED");
  if (allDelivered) return "COMPLETED";
  
  const allCancelled = subOrderStatuses.every((s) => s === "CANCELLED");
  if (allCancelled) return "CANCELLED";
  
  const anyShipped = subOrderStatuses.some((s) => ["SHIPPED", "DELIVERED"].includes(s));
  const anyPending = subOrderStatuses.some((s) => ["PENDING", "CONFIRMED", "PROCESSING"].includes(s));
  if (anyShipped && anyPending) return "PARTIALLY_FULFILLED";
  
  const anyCancelled = subOrderStatuses.some((s) => s === "CANCELLED");
  if (anyCancelled) return "PARTIALLY_CANCELLED";
  
  const anyConfirmed = subOrderStatuses.some((s) => s !== "PENDING");
  if (anyConfirmed) return "PROCESSING";
  
  return "PAID";
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
    {
      items: { productId: string; quantity: number; unitPrice: number }[];
      subTotal: number;
      shippingTotal: number;
      sellerId: string;
      sellerEmail: string;
    }
  >();

  for (const item of mergedItems) {
    const dbProduct = productMap.get(item.productId)!;

    // Business validation
    if (dbProduct.inStock < item.quantity) {
      throw new Error(`Insufficient stock for "${dbProduct.title}": only ${dbProduct.inStock} left`);
    }

    const dbPrice = Number(dbProduct.price);
    if (typeof item.unitPrice === "number" && item.unitPrice !== dbPrice) {
      throw new Error(`Price changed for "${dbProduct.title}". Please refresh your cart.`);
    }

    // Group by seller (use sellerId from product)
    const sellerId = item.merchantId || dbProduct.sellerId;
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

  const finalTotal = Math.max(0, grandTotal - discountTotal);

  // ============================================
  // Step 5: Create order + sub-orders + snapshots in transaction
  // ============================================
  const createdOrder = await prisma.$transaction(async (tx) => {
    // 5.1 Create parent order
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
            inStock: { gte: item.quantity },
          },
          data: {
            inStock: { decrement: item.quantity },
          },
        });

        if (stockUpdateResult.count !== 1) {
          throw new Error(`Insufficient stock for "${dbProduct.title}" during checkout`);
        }
      }

      createdSubOrders.push({
        id: subOrder.id,
        merchantId: group.sellerId,
        merchantName: dbProduct?.seller?.email || "Unknown Seller",
        status: subOrder.status,
        subTotal: group.subTotal,
        shippingTotal: group.shippingTotal,
        productCount: group.items.length,
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

    return { ...order, subOrders: createdSubOrders };
  });

  return {
    orderId: createdOrder.id,
    total: finalTotal,
    subTotal: totalSubTotal,
    shippingTotal: 0,
    discountTotal,
    subOrderCount: sellerGroups.size,
    message: "Order created successfully",
    subOrders: (createdOrder as any).subOrders || [],
  };
}

/**
 * Validates voucher codes and computes the total discount and which vouchers were applied.
 *
 * @param voucherCodes - Array of voucher codes to evaluate (case-insensitive)
 * @param userId - Identifier of the user attempting to apply the vouchers; used for per-user limits
 * @param orderTotal - Order total used to evaluate minimum-order and percentage-based discounts
 * @param _sellerGroups - Unused placeholder for seller grouping context
 * @returns An object containing `totalDiscount` (sum of all applied discounts) and `applied` (array of `{ code, discount }` for each applied voucher)
 */
async function applyVouchers(
  voucherCodes: string[],
  userId: string,
  orderTotal: number,
  _sellerGroups: Map<string, unknown>
): Promise<{ totalDiscount: number; applied: { code: string; discount: number }[] }> {
  let totalDiscount = 0;
  const applied: { code: string; discount: number }[] = [];

  for (const code of voucherCodes) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) continue;
    if (!voucher.isActive) continue;
    if (new Date() > voucher.expiresAt) continue;
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) continue;

    // Check per-user usage limit
    if (userId) {
      const userUsageCount = await prisma.voucherUsage.count({
        where: { voucherId: voucher.id, userId },
      });
      if (userUsageCount >= voucher.perUserLimit) continue;
    }

    // Check minimum order amount
    if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) continue;

    // Calculate discount
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
// Query functions
/**
 * Fetches orders for the given customer email, including each order's items and payments.
 *
 * @param customerId - The customer's email used to look up orders
 * @returns An object with an `orders` array; each order includes `items` (with `product` id/slug/mainImage and `seller` id/email) and `payments`
 * @throws If `customerId` is falsy
 */

export async function listCustomerOrders(customerId: string): Promise<ListCustomerOrdersResult> {
  if (!customerId) {
    throw new Error("customerId is required");
  }

  const orders = await prisma.customer_order.findMany({
    where: { email: customerId },
    orderBy: { dateTime: "desc" },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, mainImage: true } },
          seller: { select: { id: true, email: true } },
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