import { NextResponse } from "next/server";
import { createCustomerOrder } from "../../../../server/services/order.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

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
  paymentMethod?: "COD" | "BANK_TRANSFER" | "CARD";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
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

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
