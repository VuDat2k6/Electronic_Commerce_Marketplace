// server/routes/sellerVoucher.js
const express = require('express');
const router = express.Router();
const {
  getSellerVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} = require('../controllers/sellerVoucher');
const { authenticate, requireSellerOrAdmin, requireActiveSeller } = require('../middleware/auth');

router.use(authenticate, requireSellerOrAdmin, requireActiveSeller);

router.get('/', getSellerVouchers);
router.post('/', createVoucher);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);

module.exports = router;
