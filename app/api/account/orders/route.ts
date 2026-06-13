import { NextResponse } from "next/server";
import { listCustomerOrders } from "@/server/services/order.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    const customerId = session?.user?.id;

    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await listCustomerOrders(customerId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
