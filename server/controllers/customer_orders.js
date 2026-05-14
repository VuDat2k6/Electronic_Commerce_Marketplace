/**
 * Customer Orders Controller
 * 
 * Handles customer order management:
 * - Creating new orders during checkout
 * - Updating order status and information
 * - Deleting orders
 * - Listing orders with pagination
 * - Sending order notifications to customers
 * 
 * Orders are created when customers complete checkout and contain
 * all order details including shipping information and totals.
 * 
 * @module controllers/customer_orders
 */

const prisma = require("../utills/db");
const { validateOrderData, ValidationError } = require('../utills/validation');
const { createOrderUpdateNotification } = require('../utills/notificationHelpers');

/**
 * POST /api/orders
 * 
 * Creates a new customer order
 * Validates order data, creates order record, and sends notification
 * 
 * Request Body:
 * - name, lastname: Customer name
 * - email: Contact email
 * - phone: Contact phone
 * - company: Company name (optional)
 * - adress, apartment, city, country, postalCode: Shipping address
 * - orderNotice: Special instructions (optional)
 * - total: Order total amount
 * - userId: Logged-in user ID (optional)
 * 
 * @param {Request} request - Express request with order data
 * @param {Response} response - Express response object
 */
async function createCustomerOrder(request, response) {
  try {
    console.log("=== ORDER CREATION REQUEST ===");
    console.log("Request body:", JSON.stringify(request.body, null, 2));
    
    // Validate request body structure
    if (!request.body || typeof request.body !== 'object') {
      console.log("Invalid request body");
      return response.status(400).json({ 
        error: "Invalid request body",
        details: "Request body must be a valid JSON object"
      });
    }

    // Server-side validation using validation utility
    const validation = validateOrderData(request.body);
    console.log("Validation result:", validation);
    
    if (!validation.isValid) {
      console.log("Validation failed:", validation.errors);
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors
      });
    }

    const validatedData = validation.validatedData;
    console.log("Validation passed, validated data:", validatedData);

    // Business logic validation: minimum order amount
    if (validatedData.total < 0.01) {
      console.log("Invalid total amount");
      return response.status(400).json({
        error: "Invalid order total",
        details: [{ field: 'total', message: 'Order total must be at least $0.01' }]
      });
    }

    // Duplicate detection: prevent rapid duplicate orders
    // Checks for same email, amount, within last 1 minute
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const duplicateOrder = await prisma.customer_order.findFirst({
      where: {
        email: validatedData.email,
        total: validatedData.total,
        dateTime: {
          gte: oneMinuteAgo
        }
      }
    });

    if (duplicateOrder) {
      console.log("Duplicate order detected");
      return response.status(409).json({
        error: "Duplicate order detected",
        details: "An identical order was just created. Please wait a moment."
      });
    }

    console.log("Creating order in database...");
    
    // Create order record in database
    const corder = await prisma.customer_order.create({
      data: {
        name: validatedData.name,
        lastname: validatedData.lastname,
        phone: validatedData.phone,
        email: validatedData.email,
        company: validatedData.company,
        adress: validatedData.adress,
        apartment: validatedData.apartment,
        postalCode: validatedData.postalCode,
        status: validatedData.status,
        city: validatedData.city,
        country: validatedData.country,
        orderNotice: validatedData.orderNotice,
        total: validatedData.total,
        dateTime: new Date()
      },
    });

    console.log("Order created successfully:", corder);

    // Send order confirmation notification to registered users
    try {
      let user = null;
      
      // First, try to find user by provided userId (logged-in users)
      if (request.body.userId) {
        user = await prisma.user.findUnique({
          where: { id: request.body.userId }
        });
      }
      
      // Fallback: search by email if no userId or user not found
      if (!user) {
        user = await prisma.user.findUnique({
          where: { email: validatedData.email }
        });
      }
      
      // Create notification if user account exists
      if (user) {
        await createOrderUpdateNotification(
          user.id,
          'confirmed',
          corder.id,
          validatedData.total
        );
        console.log("Order notification sent to user:", user.email);
      }
    } catch (notificationError) {
      // Don't fail order creation if notification fails
      console.error("Failed to create order notification:", notificationError);
    }

    console.log("Order created: ID", corder.id);

    // Return success response with order ID
    const responseData = {
      id: corder.id,
      message: "Order created successfully",
      orderNumber: corder.id
    };
    
    return response.status(201).json(responseData);

  } catch (error) {
    console.error("Error creating order:", error);
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return response.status(409).json({ 
        error: "Order conflict",
        details: "An order with this information already exists"
      });
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: error.field, message: error.message }]
      });
    }

    // Generic server error
    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to create order. Please try again later."
    });
  }
}

/**
 * PUT /api/orders/:id
 * 
 * Updates an existing order
 * Can update order details and status
 * Sends notification when status changes
 * 
 * @param {Request} request - Express request with order ID and update data
 * @param {Response} response - Express response object
 */
async function updateCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    // Validate ID format
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID"
      });
    }

    // Validate request body
    if (!request.body || typeof request.body !== 'object') {
      return response.status(400).json({ 
        error: "Invalid request body"
      });
    }

    // Validate update data
    const validation = validateOrderData(request.body);
    
    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors
      });
    }

    const validatedData = validation.validatedData;

    // Check if order exists
    const existingOrder = await prisma.customer_order.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingOrder) {
      return response.status(404).json({ 
        error: "Order not found"
      });
    }

    // Update order in database
    const updatedOrder = await prisma.customer_order.update({
      where: {
        id: existingOrder.id,
      },
      data: {
        name: validatedData.name,
        lastname: validatedData.lastname,
        phone: validatedData.phone,
        email: validatedData.email,
        company: validatedData.company,
        adress: validatedData.adress,
        apartment: validatedData.apartment,
        postalCode: validatedData.postalCode,
        status: validatedData.status,
        city: validatedData.city,
        country: validatedData.country,
        orderNotice: validatedData.orderNotice,
        total: validatedData.total,
      },
    });

    // Send notification if order status changed
    if (existingOrder.status !== validatedData.status) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: validatedData.email }
        });
        
        if (user) {
          await createOrderUpdateNotification(
            user.id,
            validatedData.status,
            updatedOrder.id,
            validatedData.total
          );
        }
      } catch (notificationError) {
        console.error("Failed to create status update notification:", notificationError);
      }
    }

    console.log("Order updated:", updatedOrder.id);

    return response.status(200).json(updatedOrder);
    
  } catch (error) {
    console.error("Error updating order:", error);
    
    // Handle Prisma record not found
    if (error.code === 'P2025') {
      return response.status(404).json({ 
        error: "Order not found"
      });
    }

    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: error.field, message: error.message }]
      });
    }

    return response.status(500).json({ 
      error: "Internal server error"
    });
  }
}

/**
 * DELETE /api/orders/:id
 * 
 * Deletes an order from the system
 * Order must exist before deletion
 * 
 * @param {Request} request - Express request with order ID
 * @param {Response} response - Express response object
 */
async function deleteCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID"
      });
    }

    // Check if order exists
    const existingOrder = await prisma.customer_order.findUnique({
      where: { id: id },
    });

    if (!existingOrder) {
      return response.status(404).json({ 
        error: "Order not found"
      });
    }

    // Delete order
    await prisma.customer_order.delete({
      where: {
        id: id,
      },
    });

    console.log("Order deleted:", id);
    return response.status(204).send();
    
  } catch (error) {
    console.error("Error deleting order:", error);
    
    if (error.code === 'P2025') {
      return response.status(404).json({ 
        error: "Order not found"
      });
    }

    return response.status(500).json({ 
      error: "Internal server error"
    });
  }
}

/**
 * Retrieve a single customer order by ID for order detail pages.
 *
 * Validates the path `id`; responds with 400 if `id` is missing/invalid,
 * 404 if the order does not exist, 200 with the selected order fields (including nested item fields) on success, or 500 on unexpected errors.
 */
async function getCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID"
      });
    }

    const order = await prisma.customer_order.findUnique({
      where: {
        id: id,
      },
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
            priceAtPurchase: true,
          }
        }
      }
    });
    
    if (!order) {
      return response.status(404).json({ 
        error: "Order not found"
      });
    }
    
    return response.status(200).json(order);
    
  } catch (error) {
    console.error("Error fetching order:", error);
    return response.status(500).json({ 
      error: "Internal server error"
    });
  }
}

/**
 * List customer orders with pagination and per-order item counts.
 *
 * Accepts optional `page` and `limit` query parameters (defaults: page=1, limit=50).
 * Validates that `page >= 1` and `1 <= limit <= 100`, returns a 400 response for invalid pagination.
 * Orders are returned newest-first (by `dateTime`) and each order includes a count of its `items`.
 * Responds with pagination metadata: `page`, `limit`, `total`, and `totalPages`.
 * Returns a 500 response on unexpected server errors.
 */
async function getAllOrders(request, response) {
  try {
    // Parse pagination parameters
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Validate pagination to prevent abuse
    if (page < 1 || limit < 1 || limit > 100) {
      return response.status(400).json({
        error: "Invalid pagination parameters",
        details: "Page must be >= 1, limit must be between 1 and 100"
      });
    }

    // Fetch orders and total count in parallel
    const [orders, totalCount] = await Promise.all([
      prisma.customer_order.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          dateTime: 'desc' // Newest orders first
        },
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
          _count: {
            select: { items: true }
          }
        }
      }),
      prisma.customer_order.count()
    ]);

    // Return orders with pagination metadata
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
    console.error("Error fetching orders:", error);
    return response.status(500).json({ 
      error: "Internal server error"
    });
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
