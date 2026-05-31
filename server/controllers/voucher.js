/**
 * Voucher Controller
 * 
 * Handles discount coupon/voucher management:
 * - Creating vouchers with various discount types
 * - Validating vouchers during checkout
 * - Applying discounts to orders
 * - Managing voucher lifecycle (update, delete)
 * - Business rules validation (expiry, limits, minimum order)
 * 
 * Vouchers can be:
 * - FIXED: Fixed amount discount (e.g., $10 off)
 * - PERCENTAGE: Percentage discount (e.g., 20% off)
 * - Platform-wide: Valid for all products
 * - Merchant-specific: Only valid for specific merchant's products
 * 
 * @module controllers/voucher
 */

const prisma = require("../utils/db");

// ============================================================
// CREATE VOUCHER
// Creates a new discount voucher with validation
// ============================================================

/**
 * POST /api/vouchers
 * 
 * Creates a new voucher/coupon
 * Only admins can create vouchers
 * 
 * Request Body:
 * - code: Unique voucher code (required)
 * - title: Display title (required)
 * - description: Voucher description (optional)
 * - discountType: FIXED or PERCENTAGE (required)
 * - discountValue: Discount amount (required)
 * - merchantId: Merchant ID for merchant-specific vouchers (optional)
 * - minOrderValue: Minimum order amount to use voucher (optional)
 * - maxDiscount: Maximum discount for percentage vouchers (optional)
 * - usageLimit: Total number of uses allowed (optional)
 * - perUserLimit: Uses per user (default: 1)
 * - startsAt: Start date (default: now)
 * - expiresAt: Expiry date (required)
 * - isActive: Active status (default: true)
 * 
 * @param {Request} request - Express request with voucher data
 * @param {Response} response - Express response object
 */
async function createVoucher(request, response) {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      merchantId,
      minOrderValue,
      maxDiscount,
      usageLimit,
      perUserLimit,
      startsAt,
      expiresAt,
      isActive,
    } = request.body;

    // Validate required fields
    if (!code || !title || !discountType || discountValue === undefined || discountValue === null || !expiresAt) {
      return response.status(400).json({
        error: "Validation failed",
        details: "code, title, discountType, discountValue, and expiresAt are required",
      });
    }

    // Validate discount type enum
    if (!["FIXED", "PERCENTAGE"].includes(discountType)) {
      return response.status(400).json({
        error: "Validation failed",
        details: "discountType must be FIXED or PERCENTAGE",
      });
    }

    // Validate discount value is positive
    if (Number(discountValue) <= 0) {
      return response.status(400).json({
        error: "Validation failed",
        details: "discountValue must be greater than 0",
      });
    }

    // Validate percentage value is between 1-100
    if (discountType === "PERCENTAGE" && (Number(discountValue) < 1 || Number(discountValue) > 100)) {
      return response.status(400).json({
        error: "Validation failed",
        details: "For PERCENTAGE type, discountValue must be between 1 and 100",
      });
    }

    const parsedStartsAt = startsAt ? new Date(startsAt) : new Date();
    const parsedExpiresAt = new Date(expiresAt);

    // Validate date values
    if (Number.isNaN(parsedStartsAt.getTime()) || Number.isNaN(parsedExpiresAt.getTime())) {
      return response.status(400).json({
        error: "Validation failed",
        details: "startsAt and expiresAt must be valid dates",
      });
    }

    if (parsedStartsAt >= parsedExpiresAt) {
      return response.status(400).json({
        error: "Validation failed",
        details: "expiresAt must be after startsAt",
      });
    }

    // Check for duplicate voucher code
    const existing = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return response.status(409).json({
        error: "Duplicate voucher code",
        details: "A voucher with this code already exists",
      });
    }

    // Validate merchant exists for merchant-specific vouchers
    if (merchantId) {
      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
      if (!merchant) {
        return response.status(404).json({ error: "Merchant not found" });
      }
    }

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        title,
        description: description || null,
        discountType,
        discountValue: parseInt(discountValue),
        merchantId: merchantId || null,
        minOrderValue: minOrderValue ? parseInt(minOrderValue) : null,
        maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
        startsAt: parsedStartsAt,
        expiresAt: parsedExpiresAt,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return response.status(201).json(voucher);
  } catch (error) {
    console.error("Error creating voucher:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// GET VOUCHERS
// Retrieves vouchers with optional filtering
// ============================================================

/**
 * GET /api/vouchers
 * 
 * Retrieves vouchers with optional filtering by merchant
 * 
 * Query Parameters:
 * - merchantId: Filter by merchant (optional)
 * - isActive: Filter by active status (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * 
 * @param {Request} request - Express request with query params
 * @param {Response} response - Express response with vouchers
 */
async function getVouchers(request, response) {
  try {
    const merchantId = request.query.merchantId;
    const isActive = request.query.isActive;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build filter: platform-wide OR merchant-specific vouchers
    let where;
    if (merchantId) {
      where = {
        OR: [
          { merchantId: null }, // Platform-wide vouchers
          { merchantId: merchantId }, // Merchant's own vouchers
        ],
      };
    } else {
      where = {};
    }
    
    // Add active status filter if provided
    if (isActive !== undefined) where.isActive = isActive === "true";

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          merchant: merchantId ? { select: { id: true, name: true } } : false,
        },
      }),
      prisma.voucher.count({ where }),
    ]);

    return response.json(vouchers);
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// VALIDATE VOUCHER
// Checks if a voucher is valid without applying it
// ============================================================

/**
 * POST /api/vouchers/validate
 * 
 * Validates a voucher without applying it
 * Used to show discount info before checkout
 * 
 * Request Body:
 * - code: Voucher code
 * - orderTotal: Current order total
 * - cartItems: Cart items for merchant-specific voucher validation
 * 
 * @param {Request} request - Express request with voucher code
 * @param {Response} response - Express response with validation result
 */
async function validateVoucher(request, response) {
  try {
    const { code, orderTotal, cartItems } = request.body;

    if (!code) {
      return response.status(400).json({ error: "Code is required" });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
      include: { merchant: { select: { id: true, name: true } } },
    });

    if (!voucher) {
      return response.status(404).json({ error: "Voucher not found" });
    }

    // Validate against business rules
    const validationResult = await validateVoucherBusiness(voucher, orderTotal, cartItems);

    return response.json(validationResult);
  } catch (error) {
    console.error("Error validating voucher:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// APPLY VOUCHER
// Applies voucher discount to an order
// ============================================================

/**
 * POST /api/vouchers/apply
 * 
 * Applies a voucher to an order and calculates discount
 * Validates voucher before applying
 * 
 * Request Body:
 * - code: Voucher code
 * - userId: User ID (for per-user limit tracking)
 * - orderTotal: Current order total
 * - cartItems: Cart items for merchant-specific validation
 * 
 * @param {Request} request - Express request with voucher data
 * @param {Response} response - Express response with discount info
 */
async function applyVoucher(request, response) {
  try {
    const { code, userId, orderTotal, cartItems } = request.body;

    if (!code) {
      return response.status(400).json({ error: "Code is required" });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
      include: { merchant: { select: { id: true, name: true } } },
    });

    if (!voucher) {
      return response.status(404).json({ error: "Voucher not found" });
    }

    // Validate voucher against business rules
    const validation = await validateVoucherBusiness(voucher, orderTotal, cartItems);

    if (!validation.valid) {
      return response.status(400).json({
        error: "Voucher validation failed",
        details: validation.errors,
      });
    }

    // Return discount information
    return response.json({
      valid: true,
      voucher: {
        code: voucher.code,
        title: voucher.title,
        discountType: voucher.discountType,
        discount: validation.discount,
        description: voucher.description,
        merchantName: voucher.merchant?.name || "Platform-wide",
      },
      newTotal: Math.max(0, (orderTotal || 0) - validation.discount),
    });
  } catch (error) {
    console.error("Error applying voucher:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// UPDATE VOUCHER
// Updates voucher properties
// ============================================================

/**
 * PUT /api/vouchers/:id
 * 
 * Updates an existing voucher's properties
 * Cannot update usedCount or code through API
 * 
 * @param {Request} request - Express request with voucher ID and update data
 * @param {Response} response - Express response with updated voucher
 */
async function updateVoucher(request, response) {
  try {
    const { id } = request.params;
    const updateData = request.body;

    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) {
      return response.status(404).json({ error: "Voucher not found" });
    }

    // Prevent modification of usedCount (for security)
    delete updateData.usedCount;
    // Prevent modification of code through API
    delete updateData.code;

    const updated = await prisma.voucher.update({
      where: { id },
      data: updateData,
    });

    return response.json(updated);
  } catch (error) {
    console.error("Error updating voucher:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// DELETE VOUCHER (SOFT DELETE)
// Deactivates a voucher instead of deleting
// ============================================================

/**
 * DELETE /api/vouchers/:id
 * 
 * Soft deletes a voucher by setting isActive to false
 * Voucher remains in database for historical records
 * 
 * @param {Request} request - Express request with voucher ID
 * @param {Response} response - Express response object
 */
async function deleteVoucher(request, response) {
  try {
    const { id } = request.params;

    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) {
      return response.status(404).json({ error: "Voucher not found" });
    }

    // Soft delete: set isActive to false
    await prisma.voucher.update({
      where: { id },
      data: { isActive: false },
    });

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting voucher:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// HELPER: VOUCHER BUSINESS VALIDATION
// Validates voucher against all business rules
// ============================================================

/**
 * Validates a voucher against business rules
 * Checks: active status, expiry, usage limits, minimum order, merchant restriction
 * 
 * @param {Object} voucher - Voucher object from database
 * @param {number} orderTotal - Current order total
 * @param {Array} cartItems - Cart items to check merchant restriction
 * @returns {Object} Validation result with errors and calculated discount
 */
async function validateVoucherBusiness(voucher, orderTotal, cartItems) {
  const errors = [];
  let discount = 0;
  const normalizedOrderTotal = Number(orderTotal || 0);
  let eligibleTotal = normalizedOrderTotal;

  // Check if voucher is active
  if (!voucher.isActive) {
    errors.push("This voucher is no longer active");
  }

  // Check if voucher has not started yet
  if (voucher.startsAt && new Date() < voucher.startsAt) {
    errors.push("This voucher is not active yet");
  }

  // Check if voucher has expired
  if (new Date() > voucher.expiresAt) {
    errors.push("This voucher has expired");
  }

  // Check usage limit
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    errors.push("This voucher has reached its usage limit");
  }

  // Check minimum order value
  if (!voucher.merchantId && voucher.minOrderValue && eligibleTotal < voucher.minOrderValue) {
    errors.push(`Minimum order value of ${voucher.minOrderValue.toLocaleString('vi-VN')}₫ required`);
  }

  // Check merchant restriction for cart items
  if (voucher.merchantId && cartItems) {
    eligibleTotal = cartItems
      .filter((item) => (item.merchantId || item.sellerId) === voucher.merchantId)
      .reduce((sum, item) => {
        const quantity = Number(item.quantity || item.amount || 0);
        const unitPrice = Number(item.unitPrice || item.price || 0);
        return sum + quantity * unitPrice;
      }, 0);

    if (eligibleTotal <= 0) {
      errors.push(`This voucher only applies to products from ${voucher.merchant?.name || "the merchant"}`);
    }
  }

  if (voucher.merchantId && voucher.minOrderValue && eligibleTotal < voucher.minOrderValue) {
    errors.push(`Minimum order value of ${voucher.minOrderValue.toLocaleString("vi-VN")} VND required`);
  }

  // Calculate discount if no errors
  if (errors.length === 0) {
    if (voucher.discountType === "FIXED") {
      // Fixed amount discount
      discount = voucher.discountValue;
    } else if (voucher.discountType === "PERCENTAGE") {
      // Percentage discount
      discount = Math.floor(eligibleTotal * (voucher.discountValue / 100));
      // Apply max discount cap if set
      if (voucher.maxDiscount) {
        discount = Math.min(discount, voucher.maxDiscount);
      }
    }

    // Discount cannot exceed order total
    discount = Math.min(discount, eligibleTotal);
  }

  return {
    valid: errors.length === 0,
    errors,
    discount,
  };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createVoucher,
  getVouchers,
  validateVoucher,
  applyVoucher,
  updateVoucher,
  deleteVoucher,
};
