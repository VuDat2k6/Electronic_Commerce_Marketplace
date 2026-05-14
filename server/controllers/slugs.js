const prisma = require("../utills/db"); // ✅ Use shared connection

async function getProductBySlug(request, response) {
  const { slug } = request.params;

  // Validate slug to prevent injection
  if (!slug || typeof slug !== 'string' || slug.length > 200) {
    return response.status(400).json({ error: "Invalid slug" });
  }

  // Use findUnique instead of findMany for better performance
  const product = await prisma.product.findUnique({
    where: { slug: slug },
    include: {
      category: true
    }
  });

  if (!product) {
    return response.status(404).json({ error: "Product not found" });
  }
  return response.status(200).json(product);
}

/**
 * GET /api/slugs/bulk?slugs=slug1,slug2,slug3
 *
 * Fetches multiple products by slugs in a single query
 * Optimized for wishlist page to avoid N+1 API calls
 *
 * @param {Request} request - Express request with comma-separated slugs query param
 * @param {Response} response - Express response with array of products
 */
async function getProductsBySlugs(request, response) {
  const { slugs } = request.query;

  if (!slugs || typeof slugs !== 'string') {
    return response.status(400).json({ error: "Slugs parameter is required" });
  }

  // Parse and validate slugs
  const slugArray = slugs
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length <= 200)
    .slice(0, 50); // Limit to 50 slugs for performance

  if (slugArray.length === 0) {
    return response.json({ products: [], count: 0 });
  }

  // Fetch all products in a single query
  const products = await prisma.product.findMany({
    where: {
      slug: { in: slugArray }
    },
    include: {
      category: { select: { id: true, name: true } }
    }
  });

  return response.json({
    products,
    count: products.length
  });
}

module.exports = { getProductBySlug, getProductsBySlugs };
