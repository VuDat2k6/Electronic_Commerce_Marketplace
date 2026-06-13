import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { cancelCustomerOrder } from "@/server/services/order.service";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

function getStatusCode(message: string) {
  if (message === "Order not found") return 404;
  if (
    message.includes("12 hours") ||
    message.includes("fulfillment") ||
    message.includes("closed") ||
    message.includes("Paid orders")
  ) {
    return 409;
  }
  return 400;
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    const customerId = session?.user?.id;

    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await context.params;
    const result = await cancelCustomerOrder(orderId, customerId);

    return NextResponse.json({ order: result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel order";
    return NextResponse.json({ error: message }, { status: getStatusCode(message) });
  }
}
