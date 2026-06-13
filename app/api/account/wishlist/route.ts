import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type WishlistPayloadItem = {
  id?: string;
  productId?: string;
};

async function requireUserId() {
  const session = await getServerSession(authOptions) as any;
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return String(userId);
}

function toWishlistItem(row: any) {
  const product = row.product;
  const seller = product.seller;

  return {
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.mainImage,
    slug: product.slug,
    sellerId: product.sellerId,
    sellerName: seller?.shopName || seller?.email || "Seller",
    stockAvailabillity: product.inStock,
  };
}

async function listWishlistItems(userId: string) {
  const rows = await prisma.wishlist.findMany({
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
    orderBy: { id: "desc" },
  });

  return rows.map(toWishlistItem);
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await listWishlistItems(userId);
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load wishlist";
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
    const rawItems = Array.isArray(body?.items) ? body.items as WishlistPayloadItem[] : [];
    const productIds = Array.from(
      new Set(
        rawItems
          .slice(0, 200)
          .map((item) => String(item.productId || item.id || ""))
          .filter(Boolean)
      )
    );
    const products = productIds.length
      ? await prisma.product.findMany({
          where: {
            id: { in: productIds },
            status: "PUBLISHED",
          },
          select: { id: true },
        })
      : [];
    const validProductIds = new Set(products.map((product) => product.id));
    const data = productIds
      .filter((productId) => validProductIds.has(productId))
      .map((productId) => ({
        userId,
        productId,
      }));

    await prisma.$transaction([
      prisma.wishlist.deleteMany({ where: { userId } }),
      ...(data.length
        ? [
            prisma.wishlist.createMany({
              data,
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    const items = await listWishlistItems(userId);
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save wishlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.wishlist.deleteMany({ where: { userId } });
    return NextResponse.json(
      { items: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to clear wishlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
