/**
 * Merchant Controller
 * 
 * Handles seller/vendor management operations:
 * - CRUD operations for merchant accounts
 * - Merchant profile management
 * - Products associated with merchants
 * 
 * Merchants are the sellers/vendors in the marketplace who list
 * and sell products to customers.
 * 
 * @module controllers/merchant
 */

const prisma = require("../utills/db");

/**
 * GET /api/merchants
 * 
 * Retrieves all merchants in the system
 * Includes associated products for each merchant
 * Used for merchant listing and directory pages
 * 
 * @param {Request} request - Express request object
 * @param {Response} response - Express response object
 */
async function getAllMerchants(request, response) {
  try {
    const merchants = await prisma.merchant.findMany({
      include: {
        products: true, // Include all products for each merchant
      },
    });
    return response.json(merchants);
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return response.status(500).json({ error: "Error fetching merchants" });
  }
}

/**
 * GET /api/merchants/:id
 * 
 * Retrieves a single merchant by ID
 * Includes their products for the merchant store page
 * 
 * @param {Request} request - Express request with merchant ID
 * @param {Response} response - Express response object
 */
async function getMerchantById(request, response) {
  try {
    const { id } = request.params;
    const merchant = await prisma.merchant.findUnique({
      where: {
        id: id,
      },
      include: {
        products: true,
      },
    });

    if (!merchant) {
      return response.status(404).json({ error: "Merchant not found" });
    }

    return response.json(merchant);
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return response.status(500).json({ error: "Error fetching merchant" });
  }
}

/**
 * POST /api/merchants
 * 
 * Creates a new merchant/seller account
 * 
 * Request Body:
 * - name: Merchant business name (required)
 * - email: Contact email (optional)
 * - phone: Contact phone (optional)
 * - address: Business address (optional)
 * - description: Business description (optional)
 * - status: Merchant status (default: "ACTIVE")
 * 
 * @param {Request} request - Express request with merchant data
 * @param {Response} response - Express response object
 */
async function createMerchant(request, response) {
  try {
    const { name, email, phone, address, description, status } = request.body;

    const merchant = await prisma.merchant.create({
      data: {
        name,
        email,
        phone,
        address,
        description,
        status: status || "ACTIVE",
      },
    });

    return response.status(201).json(merchant);
  } catch (error) {
    console.error("Error creating merchant:", error);
    return response.status(500).json({ error: "Error creating merchant" });
  }
}

/**
 * PUT /api/merchants/:id
 * 
 * Updates an existing merchant's information
 * Can update any field including name, contact info, status
 * 
 * @param {Request} request - Express request with merchant ID and update data
 * @param {Response} response - Express response object
 */
async function updateMerchant(request, response) {
  try {
    const { id } = request.params;
    const { name, email, phone, address, description, status } = request.body;

    const existingMerchant = await prisma.merchant.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingMerchant) {
      return response.status(404).json({ error: "Merchant not found" });
    }

    const merchant = await prisma.merchant.update({
      where: {
        id: id,
      },
      data: {
        name,
        email,
        phone,
        address,
        description,
        status,
      },
    });

    return response.json(merchant);
  } catch (error) {
    console.error("Error updating merchant:", error);
    return response.status(500).json({ error: "Error updating merchant" });
  }
}

/**
 * DELETE /api/merchants/:id
 * 
 * Deletes a merchant from the system
 * Cannot delete merchants that have products listed
 * to maintain product data integrity
 * 
 * @param {Request} request - Express request with merchant ID
 * @param {Response} response - Express response object
 */
async function deleteMerchant(request, response) {
  try {
    const { id } = request.params;
    
    // Check if merchant has products before deletion
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!merchant) {
      return response.status(404).json({ error: "Merchant not found" });
    }

    if (merchant.products.length > 0) {
      return response.status(400).json({
        error: "Cannot delete merchant with existing products",
      });
    }

    await prisma.merchant.delete({
      where: {
        id: id,
      },
    });

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting merchant:", error);
    return response.status(500).json({ error: "Error deleting merchant" });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
};