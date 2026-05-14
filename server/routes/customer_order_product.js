const express = require('express');

const router = express.Router();

const {
    createOrderProduct,
    bulkCreateOrderProducts,
    updateProductOrder,
    deleteProductOrder,
    getProductOrder,
    getAllProductOrders
  } = require('../controllers/customer_order_product');

  router.route('/')
  .get(getAllProductOrders)
  .post(createOrderProduct);

  // Bulk create order items - optimized endpoint to avoid N+1 queries
  router.route('/bulk')
  .post(bulkCreateOrderProducts);

  router.route('/:id')
  .get(getProductOrder)
  .put(updateProductOrder)
  .delete(deleteProductOrder);


  module.exports = router;