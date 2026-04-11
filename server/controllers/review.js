const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================
// 创建评价
// ============================================
async function createReview(request, response) {
  try {
    const { rating, comment, productId, userId, orderId } = request.body;

    // 校验必填字段
    if (!rating || rating < 1 || rating > 5) {
      return response.status(400).json({
        error: "Validation failed",
        details: "Rating must be between 1 and 5",
      });
    }
    if (!productId) {
      return response.status(400).json({
        error: "Validation failed",
        details: "Product ID is required",
      });
    }
    if (!userId) {
      return response.status(400).json({
        error: "Validation failed",
        details: "User ID is required",
      });
    }

    // 查找商品，获取商户ID
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, merchantId: true, title: true },
    });

    if (!product) {
      return response.status(404).json({ error: "Product not found" });
    }

    // 检查用户是否已评价过该商品（同一订单）
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId,
        orderId: orderId || undefined,
      },
    });

    if (existingReview) {
      return response.status(409).json({
        error: "Review already exists",
        details: "You have already reviewed this product for this order",
      });
    }

    // 创建评价
    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: comment || null,
        productId,
        userId,
        merchantId: product.merchantId,
        orderId: orderId || null,
        status: "PUBLISHED",
      },
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, title: true, slug: true } },
      },
    });

    // 更新产品的平均评分
    await recalculateProductRating(productId);

    return response.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// 获取商品的所有评价
// ============================================
async function getProductReviews(request, response) {
  try {
    const { productId } = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {
      productId,
      status: "PUBLISHED",
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    // 计算平均评分
    const stats = await getProductReviewStats(productId);

    return response.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// 获取商户的所有评价
// ============================================
async function getMerchantReviews(request, response) {
  try {
    const { merchantId } = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {
      merchantId,
      status: "PUBLISHED",
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true } },
          product: { select: { id: true, title: true, slug: true, mainImage: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return response.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching merchant reviews:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// 获取用户的所有评价
// ============================================
async function getUserReviews(request, response) {
  try {
    const { userId } = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, title: true, slug: true, mainImage: true } },
          merchant: { select: { id: true, name: true } },
        },
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    return response.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// 删除评价（软删除）
// ============================================
async function deleteReview(request, response) {
  try {
    const { id } = request.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return response.status(404).json({ error: "Review not found" });
    }

    await prisma.review.update({
      where: { id },
      data: { status: "HIDDEN" },
    });

    // 重新计算产品评分
    await recalculateProductRating(review.productId);

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting review:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// 辅助函数：重新计算产品评分
// ============================================
async function recalculateProductRating(productId) {
  const result = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const avgRating = result._avg.rating ? Math.round(result._avg.rating) : 0;
  const reviewCount = result._count.rating || 0;

  await prisma.product.update({
    where: { id: productId },
    data: { rating: avgRating },
  });

  return { avgRating, reviewCount };
}

// ============================================
// 辅助函数：获取产品评价统计
// ============================================
async function getProductReviewStats(productId) {
  const result = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  });

  // 获取各星级分布
  const distribution = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: "PUBLISHED" },
    _count: { rating: true },
  });

  const distMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((d) => {
    distMap[d.rating] = d._count.rating;
  });

  return {
    averageRating: result._avg.rating ? Number(result._avg.rating.toFixed(1)) : 0,
    totalReviews: result._count,
    distribution: distMap,
  };
}

module.exports = {
  createReview,
  getProductReviews,
  getMerchantReviews,
  getUserReviews,
  deleteReview,
  getProductReviewStats,
};
