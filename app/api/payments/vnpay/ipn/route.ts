import { NextResponse } from "next/server";
import { processVnpayIpn } from "@/lib/vnpay";

export async function GET(request: Request) {
  try {
    const result = await processVnpayIpn(new URL(request.url).searchParams);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ RspCode: "99", Message: "Unknown error" });
  }
}
