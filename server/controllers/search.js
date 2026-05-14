const prisma = require("../utills/db");

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