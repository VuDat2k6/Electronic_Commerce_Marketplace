const express = require("express");
const router = express.Router();
const {
  createVoucher,
  getVouchers,
  validateVoucher,
  applyVoucher,
  updateVoucher,
  deleteVoucher,
} = require("../controllers/voucher");

// GET /api/vouchers - 获取优惠券列表
router.get("/", getVouchers);

// POST /api/vouchers - 创建优惠券（管理员）
router.post("/", createVoucher);

// POST /api/vouchers/validate - 验证优惠券
router.post("/validate", validateVoucher);

// POST /api/vouchers/apply - 应用优惠券
router.post("/apply", applyVoucher);

// PUT /api/vouchers/:id - 更新优惠券
router.put("/:id", updateVoucher);

// DELETE /api/vouchers/:id - 删除优惠券（软删除）
router.delete("/:id", deleteVoucher);

module.exports = router;
