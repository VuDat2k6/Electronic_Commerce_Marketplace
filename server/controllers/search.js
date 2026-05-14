const prisma = require("../utills/db");

/**
 * Search published products by a user-supplied query across title, description, and manufacturer.
 *
 * Validates and sanitizes `request.query.query` (must be a string, trimmed, truncated to 200 characters,
 * and at least 2 characters long), queries up to 50 published products matching the sanitized query,
 * and responds with a JSON object containing `products`, `count`, and the sanitized `query`.
 *
 * Responds with HTTP 400 when the query is missing or shorter than 2 characters, and with HTTP 500 on server errors.
 *
 * @param {import('express').Request} request - Express request; reads `request.query.query` for the search term.
 * @param {import('express').Response} response - Express response used to send JSON results or error responses.
 */
async function searchProducts(request, response) {
    try {
        const { query } = request.query;

        if (!query || typeof query !== 'string') {
            return response.status(400).json({ error: "Query parameter is required" });
        }

        // Sanitize and limit query length
        const searchQuery = query.trim().substring(0, 200);

        if (searchQuery.length < 2) {
            return response.status(400).json({ error: "Query must be at least 2 characters" });
        }

        // MySQL doesn't support mode: 'insensitive', so we use LIKE with uppercase comparison
        const products = await prisma.product.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    {
                        title: {
                            contains: searchQuery,
                        }
                    },
                    {
                        description: {
                            contains: searchQuery,
                        }
                    },
                    {
                        manufacturer: {
                            contains: searchQuery,
                        }
                    }
                ]
            },
            include: {
                category: { select: { id: true, name: true } }
            },
            take: 50 // Limit results for performance
        });

        return response.json({
            products,
            count: products.length,
            query: searchQuery
        });
    } catch (error) {
        console.error("Error searching products:", error);
        return response.status(500).json({ error: "Error searching products" });
    }
}

module.exports = { searchProducts };