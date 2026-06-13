import { NextResponse } from "next/server";
import { expirePendingVnpayPayments } from "@/lib/vnpay";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const released = await expirePendingVnpayPayments();
  return NextResponse.json({ released });
}
