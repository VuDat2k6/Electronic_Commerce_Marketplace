import { NextResponse } from "next/server";
import { createCustomerOrder } from "../../../../server/services/order.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { assertVnpayConfigured, createVnpayPaymentUrl } from "@/lib/vnpay";

interface CheckoutRequestBody {
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
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    sellerId?: string;
  }>;
  voucherCodes?: string[];
  paymentMethod?: "COD" | "BANK_TRANSFER" | "CARD" | "VNPAY";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    if (body.paymentMethod === "VNPAY") {
      assertVnpayConfigured();
    }
    const session = await getServerSession(authOptions) as any;
    const customerId = session?.user?.id?.trim();

    if (!customerId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required" },
        { status: 400 }
      );
    }

    const order = await createCustomerOrder({
      customerId,
      idempotencyKey: request.headers.get("idempotency-key")?.trim() || undefined,
      name: body.name,
      lastname: body.lastname,
      phone: body.phone,
      email: body.email,
      company: body.company,
      address: body.address,
      apartment: body.apartment,
      postalCode: body.postalCode,
      city: body.city,
      country: body.country,
      orderNotice: body.orderNotice,
      items: body.items,
      voucherCodes: body.voucherCodes,
      paymentMethod: body.paymentMethod,
    });

    const paymentUrl =
      body.paymentMethod === "VNPAY"
        ? await createVnpayPaymentUrl({
            transactionRef: order.paymentTransactionRef || order.paymentId,
            orderId: order.orderId,
            amount: order.total,
            ipAddress:
              request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              request.headers.get("x-real-ip") ||
              "127.0.0.1",
          })
        : null;

    return NextResponse.json({ order, paymentUrl }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
