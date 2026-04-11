import { NextResponse } from "next/server";
import { getMerchantShop } from "../../../../server/services/order.service";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    const { merchant, products } = await getMerchantShop(merchantId);
    return NextResponse.json({ merchant, products }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load shop";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
