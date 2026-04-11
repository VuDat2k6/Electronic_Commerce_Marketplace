const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { asyncHandler, AppError } = require("../utills/errorHandler");

const createOrderProduct = asyncHandler(async (request, response) => {
  const { subOrderId, productId, quantity } = request.body;
  
  // 验证必填字段
  if (!subOrderId) {
    throw new AppError("SubOrder ID is required", 400);
  }
  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }
  if (!quantity || quantity <= 0) {
    throw new AppError("Valid quantity is required", 400);
  }

  // 验证 SubOrder 是否存在
  const existingSubOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId }
  });

  if (!existingSubOrder) {
    throw new AppError("SubOrder not found", 404);
  }

  // 验证产品是否存在
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  // 获取商户信息用于快照
  const merchant = await prisma.merchant.findUnique({
    where: { id: existingProduct.merchantId }
  });

  // 创建订单产品记录（带快照）
  const orderProduct = await prisma.subOrderProduct.create({
    data: {
      subOrderId: subOrderId,
      productId: productId,
      quantity: parseInt(quantity),
      productNameSnapshot: existingProduct.title,
      productImageSnapshot: existingProduct.mainImage,
      unitPriceSnapshot: existingProduct.price,
      merchantIdSnapshot: existingProduct.merchantId,
      merchantNameSnapshot: merchant ? merchant.name : 'Unknown'
    }
  });

  return response.status(201).json(orderProduct);
});

const updateProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { quantity } = request.body;

  if (!id) {
    throw new AppError("Order product ID is required", 400);
  }

  const existingOrder = await prisma.subOrderProduct.findUnique({
    where: {
      id: id
    }
  });

  if (!existingOrder) {
    throw new AppError("Order product not found", 404);
  }

  // 验证数量
  if (quantity !== undefined && quantity <= 0) {
    throw new AppError("Quantity must be greater than 0", 400);
  }

  const updatedOrder = await prisma.subOrderProduct.update({
    where: {
      id: existingOrder.id
    },
    data: {
      quantity: quantity !== undefined ? quantity : existingOrder.quantity
    }
  });

  return response.json(updatedOrder);
});

const deleteProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Order product ID is required", 400);
  }

  const existingOrder = await prisma.subOrderProduct.findUnique({
    where: { id }
  });

  if (!existingOrder) {
    throw new AppError("Order product not found", 404);
  }

  await prisma.subOrderProduct.delete({
    where: { id }
  });
  
  return response.status(204).send();
});

const getProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("SubOrder ID is required", 400);
  }

  const subOrder = await prisma.subOrder.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true
        }
      }
    }
  });
  
  if (!subOrder) {
    throw new AppError("SubOrder not found", 404);
  }
  
  return response.status(200).json(subOrder.products);
});

const getAllProductOrders = asyncHandler(async (request, response) => {
  const subOrders = await prisma.subOrder.findMany({
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              mainImage: true,
              price: true,
              slug: true
            }
          }
        }
      },
      parentOrder: {
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
          dateTime: true,
          status: true,
          total: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return response.json(subOrders);
});

module.exports = { 
  createOrderProduct, 
  updateProductOrder, 
  deleteProductOrder, 
  getProductOrder,
  getAllProductOrders
};