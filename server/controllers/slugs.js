const prisma = require("../utils/db"); /**
 * Handle a request for a product identified by its slug and return the product including its category.
 *
 * Validates the `slug` route parameter (must be a string of length ≤ 200). Responds with 400 and `{ error: "Invalid slug" }` for invalid input, 404 and `{ error: "Product not found" }` if no matching product exists, or 200 with the product object (including its `category`) on success.
 */

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
 * Fetch products for a comma-separated list of slugs and respond with matching products and a count.
 *
 * Expects a `slugs` query parameter (string). If missing or not a string, responds with HTTP 400 and `{ error: "Slugs parameter is required" }`.
 * Parses `slugs` by splitting on commas, trimming entries, discarding empty values and entries longer than 200 characters, and limits to at most 50 slugs.
 * If no valid slugs remain, responds with `{ products: [], count: 0 }`. Otherwise queries for all matching products and responds with `{ products, count }`.
 * Each returned product includes its `category` with `id` and `name`.
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
