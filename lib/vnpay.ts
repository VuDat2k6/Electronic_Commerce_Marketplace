import { createHash, createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const VNPAY_VERSION = "2.1.0";
const VNPAY_COMMAND = "pay";
const VNPAY_CURRENCY = "VND";
const VNPAY_SUCCESS_CODE = "00";

type VnpayParams = Record<string, string>;

function getConfig() {
  const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
  const hashSecret = process.env.VNPAY_HASH_SECRET?.trim();
  const paymentUrl =
    process.env.VNPAY_PAYMENT_URL?.trim() ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl =
    process.env.VNPAY_RETURN_URL?.trim() ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/payment/vnpay/return`;

  if (!tmnCode || !hashSecret) {
    throw new Error("VNPay is not configured");
  }

  return { tmnCode, hashSecret, paymentUrl, returnUrl };
}

function formatVnpayDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

function encode(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function createQuery(params: VnpayParams) {
  return Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");
}

function createSignature(params: VnpayParams, hashSecret: string) {
  return createHmac("sha512", hashSecret).update(createQuery(params)).digest("hex");
}

function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left.toLowerCase());
  const rightBuffer = Buffer.from(right.toLowerCase());
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function assertVnpayConfigured() {
  getConfig();
}

export async function createVnpayPaymentUrl(input: {
  transactionRef: string;
  orderId: string;
  amount: number;
  ipAddress: string;
}) {
  const config = getConfig();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const params: VnpayParams = {
    vnp_Version: VNPAY_VERSION,
    vnp_Command: VNPAY_COMMAND,
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(input.amount * 100),
    vnp_CreateDate: formatVnpayDate(now),
    vnp_CurrCode: VNPAY_CURRENCY,
    vnp_IpAddr: input.ipAddress || "127.0.0.1",
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan don hang ${input.orderId}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: config.returnUrl,
    vnp_TxnRef: input.transactionRef,
    vnp_ExpireDate: formatVnpayDate(expiresAt),
  };

  const signature = createSignature(params, config.hashSecret);
  return `${config.paymentUrl}?${createQuery(params)}&vnp_SecureHash=${signature}`;
}

export function verifyVnpayParams(searchParams: URLSearchParams) {
  const config = getConfig();
  const receivedHash = searchParams.get("vnp_SecureHash") || "";
  const params: VnpayParams = {};

  for (const [key, value] of searchParams.entries()) {
    if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
      params[key] = value;
    }
  }

  const expectedHash = createSignature(params, config.hashSecret);
  return {
    valid: Boolean(receivedHash) && secureCompare(receivedHash, expectedHash),
    params,
  };
}

export async function processVnpayIpn(searchParams: URLSearchParams) {
  const config = getConfig();
  const verification = verifyVnpayParams(searchParams);
  if (!verification.valid) {
    return { RspCode: "97", Message: "Invalid checksum" };
  }

  const transactionRef = verification.params.vnp_TxnRef;
  const payment = await prisma.payment.findUnique({
    where: { transactionRef },
    include: {
      customer_order: {
        include: {
          subOrders: { include: { products: true } },
          buyer: { select: { id: true } },
        },
      },
    },
  });

  if (!payment) {
    return { RspCode: "01", Message: "Order not found" };
  }

  if (
    verification.params.vnp_TmnCode !== config.tmnCode ||
    verification.params.vnp_CurrCode !== VNPAY_CURRENCY ||
    payment.provider !== "VNPAY" ||
    payment.method !== "VNPAY"
  ) {
    return { RspCode: "97", Message: "Invalid payment context" };
  }

  if (
    !/^\d+$/.test(verification.params.vnp_Amount || "") ||
    verification.params.vnp_Amount !== String(payment.amount * 100)
  ) {
    return { RspCode: "04", Message: "Invalid amount" };
  }

  const eventKey = createHash("sha256").update(createQuery(verification.params)).digest("hex");
  await prisma.paymentEvent.createMany({
    data: [{
      paymentId: payment.id,
      eventKey,
      eventType: "VNPAY_IPN",
      payload: verification.params,
    }],
    skipDuplicates: true,
  });

  if (payment.status !== "PENDING" || payment.customer_order.status === "canceled") {
    return { RspCode: "02", Message: "Order already confirmed" };
  }

  const responseCode = verification.params.vnp_ResponseCode || "";
  const transactionStatus = verification.params.vnp_TransactionStatus || "";
  const isSuccessful =
    responseCode === VNPAY_SUCCESS_CODE && transactionStatus === VNPAY_SUCCESS_CODE;

  if (isSuccessful) {
    const transitioned = await prisma.$transaction(async (tx) => {
      const transition = await tx.payment.updateMany({
        where: {
          id: payment.id,
          provider: "VNPAY",
          method: "VNPAY",
          status: "PENDING",
        },
        data: {
          status: "COMPLETED",
          responseCode,
          gatewayTransactionNo: verification.params.vnp_TransactionNo || null,
          bankCode: verification.params.vnp_BankCode || null,
          cardType: verification.params.vnp_CardType || null,
          rawResponse: verification.params,
          paidAt: new Date(),
        },
      });
      if (transition.count !== 1) return false;

      const sellerNotifications = payment.customer_order.subOrders.map((subOrder) => ({
        userId: subOrder.merchantId,
        title: "New paid order received",
        message: `VNPay confirmed payment for order #${payment.orderId}.`,
        type: "NEW_ORDER" as const,
        priority: "HIGH" as const,
        isRead: false,
        metadata: { orderId: payment.orderId, subOrderId: subOrder.id, paymentMethod: "VNPAY" },
      }));
      if (sellerNotifications.length > 0) {
        await tx.notification.createMany({ data: sellerNotifications });
      }

      if (payment.customer_order.buyerId) {
        await tx.notification.create({
          data: {
            userId: payment.customer_order.buyerId,
            title: "VNPay payment confirmed",
            message: `Your payment for order #${payment.orderId} was confirmed successfully.`,
            type: "PAYMENT_STATUS",
            priority: "NORMAL",
            metadata: { orderId: payment.orderId, paymentMethod: "VNPAY" },
          },
        });
      }
      return true;
    });
    if (!transitioned) {
      return { RspCode: "02", Message: "Order already confirmed" };
    }
  } else {
    await releasePendingVnpayOrder(payment.id, "FAILED", verification.params);
  }

  return { RspCode: "00", Message: "Confirm success" };
}

async function releasePendingVnpayOrder(
  paymentId: string,
  status: "FAILED" | "EXPIRED",
  rawResponse: Record<string, string> = {},
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer_order: {
          include: {
            subOrders: { include: { products: true } },
          },
        },
      },
    });

    if (!payment || payment.status !== "PENDING") return false;

    const transition = await tx.payment.updateMany({
      where: {
        id: payment.id,
        provider: "VNPAY",
        method: "VNPAY",
        status: "PENDING",
      },
      data: { status, rawResponse },
    });
    if (transition.count !== 1) return false;

    for (const subOrder of payment.customer_order.subOrders) {
      for (const product of subOrder.products) {
        await tx.product.update({
          where: { id: product.productId },
          data: { inStock: { increment: product.quantity } },
        });
      }
    }

    await tx.subOrder.updateMany({
      where: { parentOrderId: payment.orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: `VNPay payment ${status.toLowerCase()}`,
      },
    });
    await tx.customer_order.update({
      where: { id: payment.orderId },
      data: { status: "canceled" },
    });
    const voucherUsages = await tx.voucherUsage.findMany({
      where: { orderId: payment.orderId },
      select: { voucherId: true },
    });
    for (const voucherId of [...new Set(voucherUsages.map((usage) => usage.voucherId))]) {
      await tx.voucher.updateMany({
        where: { id: voucherId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
    await tx.voucherUsage.deleteMany({ where: { orderId: payment.orderId } });

    if (payment.customer_order.buyerId) {
      await tx.notification.create({
        data: {
          userId: payment.customer_order.buyerId,
          title: status === "EXPIRED" ? "VNPay payment expired" : "VNPay payment failed",
          message: `Order #${payment.orderId} was cancelled and reserved stock was released.`,
          type: "PAYMENT_STATUS",
          priority: "NORMAL",
          metadata: { orderId: payment.orderId, paymentMethod: "VNPAY" },
        },
      });
    }

    return true;
  });
}

export async function expirePendingVnpayPayments() {
  const expired = await prisma.payment.findMany({
    where: {
      provider: "VNPAY",
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    select: { id: true },
    take: 100,
  });

  let released = 0;
  for (const payment of expired) {
    if (await releasePendingVnpayOrder(payment.id, "EXPIRED")) released += 1;
  }
  return released;
}

export async function getVnpayReturnStatus(searchParams: URLSearchParams) {
  const verification = verifyVnpayParams(searchParams);
  if (!verification.valid) {
    return { valid: false, status: "INVALID", orderId: null, amount: 0 };
  }

  const payment = await prisma.payment.findUnique({
    where: { transactionRef: verification.params.vnp_TxnRef },
    select: { orderId: true, amount: true, status: true },
  });

  return {
    valid: true,
    status: payment?.status || "PENDING",
    orderId: payment?.orderId || null,
    amount: payment?.amount || 0,
  };
}
