import { NextResponse } from "next/server";
import { getVnpayReturnStatus } from "@/lib/vnpay";

export async function GET(request: Request) {
  try {
    const result = await getVnpayReturnStatus(new URL(request.url).searchParams);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, status: "ERROR", orderId: null, amount: 0 },
      { status: 400 },
    );
  }
}
