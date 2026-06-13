import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type CartPayloadItem = {
  id?: string;
  productId?: string;
  amount?: number;
  quantity?: number;
};

async function requireUserId() {
  const session = await getServerSession(authOptions) as any;
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return String(userId);
}

function toCartItem(row: any) {
  const product = row.product;
  const seller = product.seller;

  return {
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.mainImage,
    slug: product.slug,
    amount: row.quantity,
    sellerId: product.sellerId,
    sellerName: seller?.shopName || seller?.email || "Seller",
    maxStock: product.inStock,
  };
}

async function listCartItems(userId: string) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          seller: {
            select: {
              email: true,
              shopName: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map(toCartItem);
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await listCartItems(userId);
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawItems = Array.isArray(body?.items) ? body.items as CartPayloadItem[] : [];
    const quantityByProductId = new Map<string, number>();

    for (const item of rawItems.slice(0, 100)) {
      const productId = String(item.productId || item.id || "");
      const quantity = Math.floor(Number(item.quantity ?? item.amount ?? 0));

      if (!productId || quantity <= 0) continue;
      quantityByProductId.set(
        productId,
        Math.min(99, (quantityByProductId.get(productId) || 0) + quantity)
      );
    }

    const productIds = Array.from(quantityByProductId.keys());
    const products = productIds.length
      ? await prisma.product.findMany({
          where: {
            id: { in: productIds },
            status: "PUBLISHED",
          },
          select: {
            id: true,
            inStock: true,
          },
        })
      : [];
    const validProducts = new Map(products.map((product) => [product.id, product]));
    const data = productIds.flatMap((productId) => {
      const product = validProducts.get(productId);
      if (!product) return [];

      const requestedQuantity = quantityByProductId.get(productId) || 1;
      const quantity = Math.max(1, Math.min(requestedQuantity, Math.max(product.inStock, 1)));

      return {
        userId,
        productId,
        quantity,
      };
    });

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { userId } }),
      ...(data.length
        ? [
            prisma.cartItem.createMany({
              data,
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    const items = await listCartItems(userId);
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.cartItem.deleteMany({ where: { userId } });
    return NextResponse.json(
      { items: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to clear cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
