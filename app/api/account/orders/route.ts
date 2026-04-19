import { NextResponse } from "next/server";
import { listCustomerOrders } from "@/server/services/order.service";

function resolveCustomerId(request: Request): string {
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

export async function GET(request: Request) {
  try {
    const customerId = resolveCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    const result = await listCustomerOrders(customerId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
