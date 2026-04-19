const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Bắt đầu seed database...");

  // Tạo tài khoản admin mặc định
  const adminEmail = "admin@tfdtronic.com";
  const adminPassword = "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 14);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("⚠️  Admin đã tồn tại, cập nhật role...");
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "admin" },
    });
    console.log("✅ Admin đã được cập nhật!");
  } else {
    await prisma.user.create({
      data: {
        id: "admin-" + Date.now(),
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("✅ Admin đã được tạo!");
  }

  // Tạo một số categories mẫu
  const categories = [
    { id: "cat-laptops", name: "Laptops" },
    { id: "cat-phones", name: "Phones" },
    { id: "cat-tablets", name: "Tablets" },
    { id: "cat-accessories", name: "Accessories" },
    { id: "cat-cameras", name: "Cameras" },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: cat.name },
    });
    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`✅ Category "${cat.name}" đã được tạo`);
    }
  }

  // Tạo một seller mẫu để test
  const sellerEmail = "seller@tfdtronic.com";
  const sellerPassword = "seller123";
  const hashedSellerPassword = await bcrypt.hash(sellerPassword, 14);

  const existingSeller = await prisma.user.findUnique({
    where: { email: sellerEmail },
  });

  if (!existingSeller) {
    await prisma.user.create({
      data: {
        id: "seller-" + Date.now(),
        email: sellerEmail,
        password: hashedSellerPassword,
        role: "seller",
        shopName: "TFDTRONIC Official Store",
        shopDescription: "Cửa hàng chính thức của TFDTRONIC",
        shopPhone: "0123456789",
        shopAddress: "123 Electronics Street, Tech City",
        shopStatus: "ACTIVE",
        shopApprovedAt: new Date(),
        shopCreatedAt: new Date(),
      },
    });
    console.log("✅ Seller mẫu đã được tạo!");
  }

  // Tạo một buyer mẫu để test
  const buyerEmail = "buyer@tfdtronic.com";
  const buyerPassword = "buyer123";
  const hashedBuyerPassword = await bcrypt.hash(buyerPassword, 14);

  const existingBuyer = await prisma.user.findUnique({
    where: { email: buyerEmail },
  });

  if (!existingBuyer) {
    await prisma.user.create({
      data: {
        id: "buyer-" + Date.now(),
        email: buyerEmail,
        password: hashedBuyerPassword,
        role: "buyer",
      },
    });
    console.log("✅ Buyer mẫu đã được tạo!");
  }

  console.log("\n📋 Thông tin đăng nhập:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:  " + adminEmail + " / " + adminPassword);
  console.log("Seller: " + sellerEmail + " / " + sellerPassword);
  console.log("Buyer:  " + buyerEmail + " / " + buyerPassword);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Hoàn tất!");
  });
