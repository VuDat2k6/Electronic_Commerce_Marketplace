/**
 * Customer Orders Controller
 * 
 * Handles customer order management with proper security:
 * - Creating new orders during checkout (server-side price calculation)
 * - Updating order status and information
 * - Deleting orders
 * - Listing orders with pagination
 * 
 * Security measures:
 * - Total is calculated server-side from product prices
 * - No PII logging in production
 * - Input validation on all fields
 * 
 * @module controllers/customer_orders
 */

const prisma = require("../utils/db");
const { validateOrderData, ValidationError } = require('../utils/validation');
const { createOrderUpdateNotification } = require('../utils/notificationHelpers');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate order total from products in the database
 * NEVER trust client-provided prices
 */
async function calculateOrderTotal(productIds, quantities) {
  let total = 0;
  
  for (let i = 0; i < productIds.length; i++) {
    const product = await prisma.product.findUnique({
      where: { id: productIds[i] },
      select: { price: true, inStock: true }
    });
    
    if (!product) {
      throw new ValidationError(`Product not found: ${productIds[i]}`, 'items');
    }
    
    const quantity = parseInt(quantities[i]) || 1;
    total += product.price * quantity;
  }
  
  return total;
}

/**
 * Sanitize response data to prevent PII leakage in logs
 */
function sanitizeForLogging(data) {
  if (!data) return {};
  return {
    // Only log non-sensitive metadata
    keys: Object.keys(data),
    count: Array.isArray(data) ? data.length : undefined
  };
}

// ============================================================
// CONTROLLER FUNCTIONS
// ============================================================

/**
 * POST /api/orders
 * 
 * Creates a new customer order
 * Prices are ALWAYS calculated server-side from product database
 * 
 * @param {Request} request - Express request with order data
 * @param {Response} response - Express response object
 */
async function createCustomerOrder(request, response) {
  try {
    // Validate request body structure
    if (!request.body || typeof request.body !== 'object') {
      return response.status(400).json({ 
        error: "Invalid request body",
        details: "Request body must be a valid JSON object"
      });
    }

    // Server-side validation using validation utility
    const validation = validateOrderData(request.body);
    
    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors
      });
    }

    const validatedData = validation.validatedData;

    // Calculate total server-side from products (NOT from client)
    // Client should send items array, not total
    const items = request.body.items || [];
    
    if (items.length === 0) {
      return response.status(400).json({
        error: "Invalid order",
        details: [{ field: 'items', message: 'Order must contain at least one item' }]
      });
    }

    // Calculate total from database prices
    const productIds = items.map(item => item.productId || item.id);
    const quantities = items.map(item => item.quantity || 1);
    
    let serverTotal;
    try {
      serverTotal = await calculateOrderTotal(productIds, quantities);
    } catch (calcError) {
      if (calcError instanceof ValidationError) {
        return response.status(400).json({
          error: "Invalid order",
          details: [{ field: calcError.field, message: calcError.message }]
        });
      }
      throw calcError;
    }

    // Validate minimum order amount
    if (serverTotal < 1) { // Minimum 1 cent
      return response.status(400).json({
        error: "Invalid order total",
        details: [{ field: 'total', message: 'Order total must be at least $0.01' }]
      });
    }

    // Duplicate detection: prevent rapid duplicate orders
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const duplicateOrder = await prisma.customer_order.findFirst({
      where: {
        email: validatedData.email,
        total: serverTotal,
        dateTime: { gte: oneMinuteAgo }
      }
    });

    if (duplicateOrder) {
      return response.status(409).json({
        error: "Duplicate order detected",
        details: "An identical order was just created. Please wait a moment."
      });
    }

    // Get buyer ID if user is authenticated
    let buyerId = null;
    if (request.body.userId) {
      const user = await prisma.user.findUnique({
        where: { id: request.body.userId }
      });
      if (user) buyerId = user.id;
    }

    // Create order in database with server-calculated total
    const order = await prisma.$transaction(async (tx) => {
      // Create the main order
      const newOrder = await tx.customer_order.create({
        data: {
          buyerId,
          name: validatedData.name,
          lastname: validatedData.lastname,
          phone: validatedData.phone,
          email: validatedData.email,
          company: validatedData.company,
          adress: validatedData.adress,
          apartment: validatedData.apartment,
          postalCode: validatedData.postalCode,
          city: validatedData.city,
          country: validatedData.country,
          orderNotice: validatedData.orderNotice,
          status: 'processing',
          total: serverTotal, // Use server-calculated total
          dateTime: new Date()
        }
      });

      // Create order items and decrement stock atomically
      for (let i = 0; i < items.length; i++) {
        const productId = productIds[i];
        const quantity = quantities[i];
        
        // Get product price from DB
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { price: true, sellerId: true }
        });

        // Create order item
        await tx.order_item.create({
          data: {
            orderId: newOrder.id,
            productId,
            sellerId: product.sellerId,
            quantity,
            priceAtPurchase: product.price // Use DB price, not client price
          }
        });

        // Decrement stock with atomic update
        await tx.product.update({
          where: { id: productId },
          data: { inStock: { decrement: quantity } }
        }).catch(() => {
          // Product might not exist or stock update failed
          console.warn(`Failed to decrement stock for product ${productId}`);
        });
      }

      return newOrder;
    });

    // Send order notification asynchronously (don't fail order creation)
    if (buyerId) {
      createOrderUpdateNotification(
        buyerId,
        'confirmed',
        order.id,
        serverTotal
      ).catch(err => {
        console.warn('Failed to send order notification:', err.message);
      });
    }

    return response.status(201).json({
      id: order.id,
      message: "Order created successfully",
      orderNumber: order.id,
      total: serverTotal
    });

  } catch (error) {
    console.error("Error creating order:", error.message);
    
    if (error.code === 'P2002') {
      return response.status(409).json({ 
        error: "Order conflict",
        details: "An order with this information already exists"
      });
    }

    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: error.field, message: error.message }]
      });
    }

    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to create order. Please try again later."
    });
  }
}

/**
 * PUT /api/orders/:id
 * 
 * Updates an existing order (admin only)
 * 
 * @param {Request} request - Express request with order ID and update data
 * @param {Response} response - Express response object
 */
async function updateCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({ error: "Invalid order ID" });
    }

    if (!request.body || typeof request.body !== 'object') {
      return response.status(400).json({ error: "Invalid request body" });
    }

    const existingOrder = await prisma.customer_order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return response.status(404).json({ error: "Order not found" });
    }

    // Build update data - only update allowed fields
    const updateData = {};
    
    if (request.body.status) {
      updateData.status = request.body.status;
    }
    if (request.body.orderNotice !== undefined) {
      updateData.orderNotice = request.body.orderNotice;
    }

    const updatedOrder = await prisma.customer_order.update({
      where: { id: existingOrder.id },
      data: updateData
    });

    // Notify on status change
    if (existingOrder.status !== updateData.status && existingOrder.buyerId) {
      createOrderUpdateNotification(
        existingOrder.buyerId,
        updateData.status,
        updatedOrder.id,
        updatedOrder.total
      ).catch(() => {});
    }

    return response.status(200).json(updatedOrder);
    
  } catch (error) {
    console.error("Error updating order:", error.message);
    
    if (error.code === 'P2025') {
      return response.status(404).json({ error: "Order not found" });
    }

    return response.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /api/orders/:id
 * 
 * Deletes an order (admin only)
 * 
 * @param {Request} request - Express request with order ID
 * @param {Response} response - Express response object
 */
async function deleteCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({ error: "Invalid order ID" });
    }

    const existingOrder = await prisma.customer_order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return response.status(404).json({ error: "Order not found" });
    }

    await prisma.customer_order.delete({ where: { id } });

    return response.status(204).send();
    
  } catch (error) {
    console.error("Error deleting order:", error.message);
    
    if (error.code === 'P2025') {
      return response.status(404).json({ error: "Order not found" });
    }

    return response.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/orders/:id
 * 
 * Retrieves a single order by ID
 * 
 * @param {Request} request - Express request with order ID
 * @param {Response} response - Express response object
 */
async function getCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({ error: "Invalid order ID" });
    }

    const order = await prisma.customer_order.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lastname: true,
        phone: true,
        email: true,
        company: true,
        adress: true,
        apartment: true,
        postalCode: true,
        city: true,
        country: true,
        orderNotice: true,
        status: true,
        total: true,
        dateTime: true,
        buyerId: true,
        items: {
          select: {
            id: true,
            productId: true,
            sellerId: true,
            quantity: true,
            priceAtPurchase: true
          }
        }
      }
    });
    
    if (!order) {
      return response.status(404).json({ error: "Order not found" });
    }
    
    return response.status(200).json(order);
    
  } catch (error) {
    console.error("Error fetching order:", error.message);
    return response.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/orders
 * 
 * List all orders with pagination (admin only)
 * 
 * @param {Request} request - Express request with pagination params
 * @param {Response} response - Express response object
 */
async function getAllOrders(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = Math.min(parseInt(request.query.limit) || 50, 100);
    
    if (page < 1 || limit < 1) {
      return response.status(400).json({
        error: "Invalid pagination parameters"
      });
    }

    const offset = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.customer_order.findMany({
        skip: offset,
        take: limit,
        orderBy: { dateTime: 'desc' },
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          status: true,
          total: true,
          dateTime: true,
          buyerId: true,
          _count: { select: { items: true } }
        }
      }),
      prisma.customer_order.count()
    ]);

    return response.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return response.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createCustomerOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getCustomerOrder,
  getAllOrders,
};
