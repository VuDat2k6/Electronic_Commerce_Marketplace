// server/routes/adminSellers.js
const express = require('express');
const router = express.Router();
const {
  getAllSellers,
  getSellerById,
  approveSeller,
  suspendSeller,
  deleteSeller,
} = require('../controllers/adminSellers');

router.get('/', getAllSellers);
router.get('/:id', getSellerById);
router.patch('/:id/approve', approveSeller);
router.patch('/:id/suspend', suspendSeller);
router.delete('/:id', deleteSeller);

module.exports = router;
