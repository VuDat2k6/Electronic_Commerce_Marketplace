// server/utills/migrateData.js
// Chạy MỘT LẦN để chuyển data cũ sang schema mới
// Chạy: node server/utills/migrateData.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Bat dau migration data...');

  try {
    // 1. Chuyển Merchant thành User có role="seller"
    // (Nếu có dữ liệu merchant)
    const merchantCount = await prisma.merchant.count();
    if (merchantCount > 0) {
      console.log(`Tìm thấy ${merchantCount} merchants...`);
      const merchants = await prisma.merchant.findMany({ include: { products: true } });

      for (const merchant of merchants) {
        try {
          // Kiểm tra user đã tồn tại trước khi tạo mới
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                ...(merchant.email ? [{ email: merchant.email }] : []),
                ...(merchant.name ? [{ shopName: merchant.name }] : [])
              ]
            }
          });

          let sellerUserId;

          if (existingUser) {
            sellerUserId = existingUser.id;
          } else {
            // Tạo user mới cho merchant
            const newUser = await prisma.user.create({
              data: {
                email: merchant.email || `seller_${merchant.id}@placeholder.com`,
                role: 'seller',
                shopName: merchant.name,
                shopDescription: merchant.description,
                shopPhone: merchant.phone,
                shopAddress: merchant.address,
                shopStatus: merchant.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
                shopApprovedAt: merchant.status === 'ACTIVE' ? merchant.createdAt : null,
                shopCreatedAt: merchant.createdAt,
              }
            });

            sellerUserId = newUser.id;
          }

          // Cập nhật tất cả sản phẩm của merchant này -> sellerId mới
          await prisma.product.updateMany({
            where: { merchantId: merchant.id },
            data: { sellerId: sellerUserId }
          });

          console.log(`Da migrate merchant "${merchant.name}" -> User ${sellerUserId}`);
        } catch (err) {
          console.error(`Loi khi migrate merchant ${merchant.name}:`, err.message);
        }
      }
    }

    // 2. Chuyển SubOrderProduct -> Order_item
    const subOrderProductCount = await prisma.subOrderProduct.count();
    if (subOrderProductCount > 0) {
      console.log(`Tìm thấy ${subOrderProductCount} subOrderProducts...`);
      const subOrderProducts = await prisma.subOrderProduct.findMany({
        include: {
          subOrder: { include: { merchant: true } },
          product: true
        }
      });

      for (const sop of subOrderProducts) {
        try {
          // Tìm sellerId từ product hoặc subOrder
          let sellerId = sop.product?.sellerId;
          if (!sellerId && sop.subOrder?.merchant?.id) {
            // Thử tìm user có shopName = merchant.name
            const sellerUser = await prisma.user.findFirst({
              where: { shopName: sop.subOrder.merchant.name }
            });
            sellerId = sellerUser?.id;
          }

          if (sellerId) {
            // Kiểm tra order_item đã tồn tại trước khi tạo
            const existingOrderItem = await prisma.order_item.findFirst({
              where: {
                orderId: sop.subOrder.parentOrderId,
                productId: sop.productId,
                sellerId: sellerId,
              }
            });

            if (!existingOrderItem) {
              await prisma.order_item.create({
                data: {
                  orderId: sop.subOrder.parentOrderId,
                  productId: sop.productId,
                  sellerId: sellerId,
                  quantity: sop.quantity,
                  priceAtPurchase: sop.unitPriceSnapshot,
                }
              });
            }
          }
        } catch (err) {
          console.error(`Loi khi migrate subOrderProduct ${sop.id}:`, err.message);
        }
      }
      console.log(`Da migrate ${subOrderProducts.length} order items`);
    }

    console.log('Migration hoan tat!');
  } catch (error) {
    console.error('Migration loi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();