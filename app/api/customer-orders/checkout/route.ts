import { NextResponse } from "next/server";
import { createCustomerOrder } from "../../../../server/services/order.service";

interface CheckoutRequestBody {
  customerId?: string;
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
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    sellerId?: string;
  }>;
  voucherCodes?: string[];
}

function resolveCustomerId(request: Request, bodyCustomerId?: string): string {
  if (bodyCustomerId && bodyCustomerId.trim()) {
    return bodyCustomerId.trim();
  }

  const headerCustomerId = request.headers.get("x-customer-id");
  if (headerCustomerId && headerCustomerId.trim()) {
    return headerCustomerId.trim();
  }

  const fallbackCustomerId = process.env.NEXT_PUBLIC_DEV_CUSTOMER_ID;
  if (fallbackCustomerId && fallbackCustomerId.trim()) {
    return fallbackCustomerId.trim();
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required" },
        { status: 400 }
      );
    }

    const order = await createCustomerOrder({
      customerId: resolveCustomerId(request, body.customerId),
      name: body.name,
      lastname: body.lastname,
      phone: body.phone,
      email: body.email,
      company: body.company,
      adress: body.adress,
      apartment: body.apartment,
      postalCode: body.postalCode,
      city: body.city,
      country: body.country,
      orderNotice: body.orderNotice,
      items: body.items,
      voucherCodes: body.voucherCodes,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
