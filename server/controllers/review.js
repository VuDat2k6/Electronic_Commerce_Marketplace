/**
 * Review Controller
 * 
 * Handles product review and rating management:
 * - Creating reviews for purchased products
 * - Fetching reviews by product, merchant, or user
 * - Deleting/hiding reviews (soft delete)
 * - Calculating and updating product average ratings
 * - Review statistics and distribution
 * 
 * Reviews help customers make informed purchase decisions
 * and provide feedback to merchants about their products.
 * 
 * @module controllers/review
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================================
// CREATE REVIEW
// Creates a new product review after validation
// ============================================================

/**
 * POST /api/reviews
 * 
 * Creates a new review for a product
 * Validates rating, prevents duplicate reviews, updates product rating
 * 
 * Request Body:
 * - rating: 1-5 star rating (required)
 * - comment: Review text (optional)
 * - productId: Product ID (required)
 * - userId: User ID (required)
 * - orderId: Associated order ID (optional)
 * 
 * @param {Request} request - Express request with review data
 * @param {Response} response - Express response object
 */
async function createReview(request, response) {
  try {
    const { rating, comment, productId, userId, orderId } = request.body;

    // Validate rating is between 1 and 5
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

    // Find product to get merchant ID for the review
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, merchantId: true, title: true },
    });

    if (!product) {
      return response.status(404).json({ error: "Product not found" });
    }

    // Check if user has already reviewed this product for the same order
    // Prevents spam reviews
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

    // Create the review
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

    // Update the product's average rating
    await recalculateProductRating(productId);

    return response.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// GET PRODUCT REVIEWS
// Retrieves all reviews for a specific product with pagination
// ============================================================

/**
 * GET /api/reviews/product/:productId
 * 
 * Retrieves all published reviews for a product
 * Includes pagination and review statistics
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * 
 * @param {Request} request - Express request with product ID
 * @param {Response} response - Express response with reviews and stats
 */
async function getProductReviews(request, response) {
  try {
    const { productId } = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Only get published reviews
    const where = {
      productId,
      status: "PUBLISHED",
    };

    // Fetch reviews and total count in parallel
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

    // Get review statistics (average rating, distribution)
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

// ============================================================
// GET MERCHANT REVIEWS
// Retrieves all reviews for a specific merchant's products
// ============================================================

/**
 * GET /api/reviews/merchant/:merchantId
 * 
 * Retrieves all published reviews for products from a merchant
 * Used on merchant profile pages
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * 
 * @param {Request} request - Express request with merchant ID
 * @param {Response} response - Express response with reviews
 */
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

// ============================================================
// GET USER REVIEWS
// Retrieves all reviews created by a specific user
// ============================================================

/**
 * GET /api/reviews/user/:userId
 * 
 * Retrieves all reviews created by a user
 * Used on user's profile/account page
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * 
 * @param {Request} request - Express request with user ID
 * @param {Response} response - Express response with reviews
 */
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

// ============================================================
// DELETE REVIEW (SOFT DELETE)
// Hides a review instead of permanently deleting it
// ============================================================

/**
 * DELETE /api/reviews/:id
 * 
 * Soft deletes a review by changing status to HIDDEN
 * Recalculates product rating after hiding
 * 
 * @param {Request} request - Express request with review ID
 * @param {Response} response - Express response object
 */
async function deleteReview(request, response) {
  try {
    const { id } = request.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return response.status(404).json({ error: "Review not found" });
    }

    // Soft delete: change status to HIDDEN instead of deleting
    await prisma.review.update({
      where: { id },
      data: { status: "HIDDEN" },
    });

    // Recalculate product rating after hiding review
    await recalculateProductRating(review.productId);

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting review:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// HELPER: RECALCULATE PRODUCT RATING
// Updates a product's average rating based on all published reviews
// ============================================================

/**
 * Recalculates and updates a product's average rating
 * Called after creating or deleting a review
 * 
 * @param {string} productId - The product ID to update
 * @returns {Object} New average rating and review count
 */
async function recalculateProductRating(productId) {
  // Calculate average rating from all published reviews
  const result = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Round to nearest integer for product rating
  const avgRating = result._avg.rating ? Math.round(result._avg.rating) : 0;
  const reviewCount = result._count.rating || 0;

  // Update product with new average rating
  await prisma.product.update({
    where: { id: productId },
    data: { rating: avgRating },
  });

  return { avgRating, reviewCount };
}

// ============================================================
// HELPER: GET PRODUCT REVIEW STATISTICS
// Returns detailed statistics about reviews for a product
// ============================================================

/**
 * Gets detailed statistics about reviews for a product
 * Includes average rating, total count, and star distribution
 * 
 * @param {string} productId - The product ID
 * @returns {Object} Review statistics
 */
async function getProductReviewStats(productId) {
  // Calculate aggregate statistics
  const result = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  });

  // Get distribution of ratings (how many 1-star, 2-star, etc.)
  const distribution = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: "PUBLISHED" },
    _count: { rating: true },
  });

  // Convert to map format { 1: count, 2: count, ... }
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

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createReview,
  getProductReviews,
  getMerchantReviews,
  getUserReviews,
  deleteReview,
  getProductReviewStats,
};
