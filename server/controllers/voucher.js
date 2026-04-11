const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ============================================
// 创建优惠券（仅管理员）
// ============================================
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

    // 校验必填字段
    if (!code || !title || !discountType || !discountValue || !expiresAt) {
      return response.status(400).json({
        error: "Validation failed",
        details: "code, title, discountType, discountValue, and expiresAt are required",
      });
    }

    if (!["FIXED", "PERCENTAGE"].includes(discountType)) {
      return response.status(400).json({
        error: "Validation failed",
        details: "discountType must be FIXED or PERCENTAGE",
      });
    }

    if (discountType === "PERCENTAGE" && (discountValue < 1 || discountValue > 100)) {
      return response.status(400).json({
        error: "Validation failed",
        details: "For PERCENTAGE type, discountValue must be between 1 and 100",
      });
    }

    // 检查优惠券码是否已存在
    const existing = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return response.status(409).json({
        error: "Duplicate voucher code",
        details: "A voucher with this code already exists",
      });
    }

    // 如果是商户专属券，校验商户存在
    if (merchantId) {
      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
      if (!merchant) {
        return response.status(404).json({ error: "Merchant not found" });
      }
    }

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
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: new Date(expiresAt),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return response.status(201).json(voucher);
  } catch (error) {
    console.error("Error creating voucher:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// 获取优惠券列表
// ============================================
async function getVouchers(request, response) {
  try {
    const merchantId = request.query.merchantId;
    const isActive = request.query.isActive;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get platform-wide vouchers (merchantId = null) OR merchant-specific vouchers
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

// ============================================
// 验证优惠券（结账时使用）
// ============================================
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

    const validationResult = await validateVoucherBusiness(voucher, orderTotal, cartItems);

    return response.json(validationResult);
  } catch (error) {
    console.error("Error validating voucher:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// 应用优惠券（结账时实际扣减）
// ============================================
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

    const validation = await validateVoucherBusiness(voucher, orderTotal, cartItems);

    if (!validation.valid) {
      return response.status(400).json({
        error: "Voucher validation failed",
        details: validation.errors,
      });
    }

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

// ============================================
// 更新优惠券
// ============================================
async function updateVoucher(request, response) {
  try {
    const { id } = request.params;
    const updateData = request.body;

    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) {
      return response.status(404).json({ error: "Voucher not found" });
    }

    // 不允许通过 API 修改 usedCount 和 code
    delete updateData.usedCount;
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

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

// ============================================
// 删除优惠券（软删除）
// ============================================
async function deleteVoucher(request, response) {
  try {
    const { id } = request.params;

    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) {
      return response.status(404).json({ error: "Voucher not found" });
    }

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

// ============================================
// 辅助函数：优惠券业务校验
// ============================================
async function validateVoucherBusiness(voucher, orderTotal, cartItems) {
  const errors = [];
  let discount = 0;

  if (!voucher.isActive) {
    errors.push("This voucher is no longer active");
  }

  if (new Date() > voucher.expiresAt) {
    errors.push("This voucher has expired");
  }

  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    errors.push("This voucher has reached its usage limit");
  }

  if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
    errors.push(`Minimum order value is ${voucher.minOrderValue / 100} required`);
  }

  // 商户专属券：检查购物车中是否有该商户的商品
  if (voucher.merchantId && cartItems) {
    const merchantItems = cartItems.filter(
      (item) => item.merchantId === voucher.merchantId
    );
    if (merchantItems.length === 0) {
      errors.push(`This voucher only applies to products from ${voucher.merchant?.name || "the merchant"}`);
    }
  }

  if (errors.length === 0) {
    // 计算折扣
    if (voucher.discountType === "FIXED") {
      discount = voucher.discountValue;
    } else if (voucher.discountType === "PERCENTAGE") {
      discount = Math.floor((orderTotal || 0) * (voucher.discountValue / 100));
      if (voucher.maxDiscount) {
        discount = Math.min(discount, voucher.maxDiscount);
      }
    }

    // 折扣不能超过订单总额
    discount = Math.min(discount, orderTotal || 0);
  }

  return {
    valid: errors.length === 0,
    errors,
    discount,
  };
}

module.exports = {
  createVoucher,
  getVouchers,
  validateVoucher,
  applyVoucher,
  updateVoucher,
  deleteVoucher,
};
