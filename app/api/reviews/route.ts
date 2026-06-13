import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/utils/db";

export const dynamic = 'force-dynamic';

// POST: Create a new review
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating) {
      return NextResponse.json(
        { error: "Product ID and rating are required" },
        { status: 400 }
      );
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // Verify if the user has purchased this product
    const orderItem = await prisma.subOrderProduct.findFirst({
      where: {
        productId: productId,
        subOrder: {
          parentOrder: {
            buyerId: userId,
            status: {
              not: "canceled",
            },
          },
        },
      },
    });

    if (!orderItem) {
      console.log("Returning 403: You must purchase this product before reviewing it.");
      return NextResponse.json(
        { error: "You must purchase this product before reviewing it." },
        { status: 403 }
      );
    }

    // Check if the user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: productId,
        userId: userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 400 }
      );
    }

    // Get the product to find merchantId
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId: productId,
        userId: userId,
        merchantId: product.sellerId,
        rating: parsedRating,
        comment: comment || null,
        status: "PUBLISHED",
      },
    });

    // Update Product average rating
    const aggregates = await prisma.review.aggregate({
      where: { productId: productId },
      _avg: { rating: true },
    });

    if (aggregates._avg.rating) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          rating: Math.round(aggregates._avg.rating),
        },
      });
    }

    return NextResponse.json({ message: "Review created successfully", review }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review", details: error.message },
      { status: 500 }
    );
  }
}

// GET: Fetch reviews
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const merchantId = searchParams.get("merchantId");

    const where: any = { status: "PUBLISHED" };
    if (productId) where.productId = productId;
    if (merchantId) where.merchantId = merchantId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        product: {
          select: {
            title: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats
    let averageRating = 0;
    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

    if (reviews.length > 0) {
      let totalRating = 0;
      reviews.forEach(r => {
        totalRating += r.rating;
        distribution[r.rating.toString()] += 1;
      });
      averageRating = totalRating / reviews.length;
    }

    const responseData = {
      reviews: reviews,
      pagination: {
        total: reviews.length,
      },
      stats: {
        averageRating,
        totalReviews: reviews.length,
        distribution,
      }
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
