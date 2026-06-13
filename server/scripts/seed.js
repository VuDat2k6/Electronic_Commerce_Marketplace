const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const now = new Date();
const password = (value) => bcrypt.hashSync(value, 12);

const categories = [
  ["cat-smartphones", "Smartphones"],
  ["cat-laptops", "Laptops"],
  ["cat-tablets", "Tablets"],
  ["cat-audio", "Audio"],
  ["cat-smart-watches", "Smart Watches"],
  ["cat-gaming", "Gaming"],
  ["cat-cameras", "Cameras"],
  ["cat-accessories", "Accessories"],
  ["cat-computers", "Computers"],
  ["cat-printers", "Printers"],
];

const activeSellers = [
  {
    id: "seller-electronics-hub",
    email: "seller@tfdtronic.com",
    password: password("seller123"),
    shopName: "TFDTRONIC Electronics Hub",
    shopDescription: "Flagship phones, laptops, gaming gear, and premium audio devices.",
    shopPhone: "+84 901 222 108",
    shopAddress: "12 Nguyen Hue, District 1, Ho Chi Minh City",
  },
  {
    id: "seller-gadget-pro",
    email: "gadget.seller@tfdtronic.com",
    password: password("password"),
    shopName: "Gadget Pro Store",
    shopDescription: "Creator gear, tablets, accessories, and compact productivity devices.",
    shopPhone: "+84 902 883 441",
    shopAddress: "88 Ly Thuong Kiet, Hanoi",
  },
  {
    id: "seller-mobile-world",
    email: "mobile.seller@tfdtronic.com",
    password: password("password"),
    shopName: "Mobile World Select",
    shopDescription: "Smartphones, wearables, earbuds, and everyday mobile accessories.",
    shopPhone: "+84 903 612 700",
    shopAddress: "44 Bach Dang, Da Nang",
  },
  {
    id: "seller-gaming-zone",
    email: "gaming.seller@tfdtronic.com",
    password: password("password"),
    shopName: "Gaming Zone Vietnam",
    shopDescription: "Consoles, gaming laptops, controllers, and streaming equipment.",
    shopPhone: "+84 904 114 992",
    shopAddress: "19 Le Loi, Hue",
  },
  {
    id: "seller-camera-house",
    email: "camera.seller@tfdtronic.com",
    password: password("password"),
    shopName: "Camera House Studio",
    shopDescription: "Mirrorless cameras, creator audio, lenses, storage, and studio accessories.",
    shopPhone: "+84 905 776 120",
    shopAddress: "52 Tran Hung Dao, Nha Trang",
  },
];

const buyers = [
  ["buyer-001", "buyer@tfdtronic.com", "buyer123"],
  ["buyer-002", "anna.buyer@tfdtronic.com", "password"],
  ["buyer-003", "minh.buyer@tfdtronic.com", "password"],
  ["buyer-004", "linh.buyer@tfdtronic.com", "password"],
  ["buyer-005", "quan.buyer@tfdtronic.com", "password"],
  ["buyer-become-seller", "become.seller.test@tfdtronic.com", "password"],
];

const users = [
  {
    id: "user-admin",
    email: "admin@tfdtronic.com",
    password: password("admin123"),
    role: "admin",
    shopName: "TFDTRONIC Platform",
    shopStatus: "ACTIVE",
  },
  ...activeSellers.map((seller) => ({
    ...seller,
    role: "seller",
    shopStatus: "ACTIVE",
    shopApprovedAt: now,
    shopCreatedAt: now,
  })),
  {
    id: "seller-pending-tech",
    email: "pending.seller@tfdtronic.com",
    password: password("password"),
    role: "seller",
    shopName: "Pending Tech Supply",
    shopDescription: "Electronics seller awaiting admin approval.",
    shopPhone: "+84 906 221 988",
    shopAddress: "Pending Review, Ho Chi Minh City",
    shopStatus: "PENDING",
    shopCreatedAt: now,
  },
  ...buyers.map(([id, email, rawPassword]) => ({
    id,
    email,
    password: password(rawPassword),
    role: "buyer",
    shopStatus: "PENDING",
    shopName: null,
    shopDescription: null,
    shopPhone: null,
    shopAddress: null,
    shopApprovedAt: null,
    shopCreatedAt: null,
  })),
];

const imagePool = [
  "/images/products/iphone-15-pro-max.jpg",
  "/images/products/galaxy-s24-ultra.jpg",
  "/images/products/xiaomi-14-pro.jpg",
  "/images/products/pixel-8-pro.jpg",
  "/images/products/macbook-pro-16.jpg",
  "/images/products/macbook-air-15.jpg",
  "/images/products/dell-xps-15.jpg",
  "/images/products/asus-rog-zephyrus.jpg",
  "/images/products/ipad-pro.jpg",
  "/images/products/galaxy-tab-s9.jpg",
  "/images/products/sony-wh-1000xm5.jpg",
  "/images/products/airpods-pro.jpg",
  "/images/products/galaxy-buds2-pro.jpg",
  "/images/products/jbl-charge-5.jpg",
  "/images/products/apple-watch-ultra.jpg",
  "/images/products/galaxy-watch-6.jpg",
  "/images/products/garmin-fenix.jpg",
  "/images/products/playstation-5.jpg",
  "/images/products/xbox-series-x.jpg",
  "/images/products/nintendo-switch.jpg",
  "/images/products/sony-a7-iv.jpg",
  "/images/products/canon-eos-r6.jpg",
  "/images/products/anker-powerbank.jpg",
  "/images/products/magic-keyboard.jpg",
];

const productTemplates = [
  ["iPhone 15 Pro Max 256GB Natural Titanium", "iphone-15-pro-max-256gb-natural-titanium", 32990000, "Apple", "cat-smartphones"],
  ["Samsung Galaxy S24 Ultra 512GB Titanium Black", "samsung-galaxy-s24-ultra-512gb-titanium-black", 28990000, "Samsung", "cat-smartphones"],
  ["Xiaomi 14 Pro 512GB Leica Edition", "xiaomi-14-pro-512gb", 18990000, "Xiaomi", "cat-smartphones"],
  ["Google Pixel 8 Pro 256GB Obsidian", "google-pixel-8-pro-256gb", 22990000, "Google", "cat-smartphones"],
  ["MacBook Pro 16 M3 Pro 512GB Space Black", "macbook-pro-16-m3-pro-512gb-space-black", 62990000, "Apple", "cat-laptops"],
  ["MacBook Air 15 M3 256GB Midnight", "macbook-air-15-m3-256gb", 36990000, "Apple", "cat-laptops"],
  ["Dell XPS 15 OLED Core i7 RTX 4060", "dell-xps-15-9530-i7-32gb-rtx-4060", 44990000, "Dell", "cat-laptops"],
  ["ASUS ROG Zephyrus G14 Ryzen 9 RTX 4070", "asus-rog-zephyrus-g14-2024", 52990000, "ASUS", "cat-gaming"],
  ["iPad Pro 12.9 M4 256GB Space Black", "ipad-pro-12-9-m4-256gb-space-black", 32990000, "Apple", "cat-tablets"],
  ["Samsung Galaxy Tab S9 Ultra 256GB", "samsung-galaxy-tab-s9-ultra-256gb", 27990000, "Samsung", "cat-tablets"],
  ["Sony WH-1000XM5 Wireless Noise Cancelling Headphones", "sony-wh-1000xm5-wireless-headphones", 8990000, "Sony", "cat-audio"],
  ["AirPods Pro 2 USB-C with MagSafe Case", "airpods-pro-2nd-generation-usb-c", 6490000, "Apple", "cat-audio"],
  ["Samsung Galaxy Buds2 Pro Graphite", "samsung-buds-2-pro-graphite", 4990000, "Samsung", "cat-audio"],
  ["JBL Charge 5 Portable Bluetooth Speaker", "jbl-charge-5-bluetooth-speaker", 3990000, "JBL", "cat-audio"],
  ["Apple Watch Ultra 2 49mm Titanium", "apple-watch-ultra-2-49mm", 23990000, "Apple", "cat-smart-watches"],
  ["Samsung Galaxy Watch 6 Classic 47mm", "samsung-galaxy-watch-6-classic-47mm", 8990000, "Samsung", "cat-smart-watches"],
  ["Garmin Fenix 7X Pro Solar", "garmin-fenix-7x-pro-solar", 27990000, "Garmin", "cat-smart-watches"],
  ["PlayStation 5 Slim Digital Edition", "playstation-5-slim-digital-edition", 12990000, "Sony", "cat-gaming"],
  ["Xbox Series X 1TB Console", "xbox-series-x-1tb", 13990000, "Microsoft", "cat-gaming"],
  ["Nintendo Switch OLED White", "nintendo-switch-oled-white", 8990000, "Nintendo", "cat-gaming"],
  ["Sony Alpha A7 IV Mirrorless Camera Body", "sony-alpha-a7-iv-body", 64990000, "Sony", "cat-cameras"],
  ["Canon EOS R6 Mark II Mirrorless", "canon-eos-r6-mark-ii", 62990000, "Canon", "cat-cameras"],
  ["Anker 737 Power Bank 24,000mAh 140W", "anker-737-powerbank-24000mah", 2990000, "Anker", "cat-accessories"],
  ["Apple Magic Keyboard with Touch ID", "apple-magic-keyboard-with-touch-id", 4490000, "Apple", "cat-accessories"],
];

const legacyProductIdsBySlug = {
  "iphone-15-pro-max-256gb-natural-titanium": "prod-iphone-15-pro-max",
  "samsung-galaxy-s24-ultra-512gb-titanium-black": "prod-galaxy-s24-ultra",
  "xiaomi-14-pro-512gb": "prod-xiaomi-14-pro",
  "google-pixel-8-pro-256gb": "prod-pixel-8-pro",
  "macbook-pro-16-m3-pro-512gb-space-black": "prod-macbook-pro-16",
  "macbook-air-15-m3-256gb": "prod-macbook-air-15",
  "dell-xps-15-9530-i7-32gb-rtx-4060": "prod-dell-xps-15",
  "asus-rog-zephyrus-g14-2024": "prod-rog-zephyrus-g14",
  "ipad-pro-12-9-m4-256gb-space-black": "prod-ipad-pro",
  "samsung-galaxy-tab-s9-ultra-256gb": "prod-galaxy-tab-s9",
  "sony-wh-1000xm5-wireless-headphones": "prod-sony-wh1000xm5",
  "airpods-pro-2nd-generation-usb-c": "prod-airpods-pro-usbc",
  "samsung-buds-2-pro-graphite": "prod-galaxy-buds2-pro",
  "jbl-charge-5-bluetooth-speaker": "prod-jbl-charge-5",
  "apple-watch-ultra-2-49mm": "prod-apple-watch-ultra",
  "samsung-galaxy-watch-6-classic-47mm": "prod-galaxy-watch-6",
  "garmin-fenix-7x-pro-solar": "prod-garmin-fenix",
  "playstation-5-slim-digital-edition": "prod-playstation-5-slim",
  "xbox-series-x-1tb": "prod-xbox-series-x",
  "nintendo-switch-oled-white": "prod-nintendo-switch-oled",
  "sony-alpha-a7-iv-body": "prod-sony-a7-iv",
  "canon-eos-r6-mark-ii": "prod-canon-r6-ii",
  "anker-737-powerbank-24000mah": "prod-anker-737",
  "apple-magic-keyboard-with-touch-id": "prod-magic-keyboard",
};

function makeProducts() {
  const products = [];
  activeSellers.forEach((seller, sellerIndex) => {
    for (let itemIndex = 0; itemIndex < 10; itemIndex += 1) {
      const template = productTemplates[(sellerIndex * 10 + itemIndex) % productTemplates.length];
      const [title, baseSlug, price, manufacturer, categoryId] = template;
      const isFirstSeller = sellerIndex === 0;
      const id = isFirstSeller && legacyProductIdsBySlug[baseSlug]
        ? legacyProductIdsBySlug[baseSlug]
        : `prod-${seller.id.replace("seller-", "")}-${itemIndex + 1}`;
      const slug = isFirstSeller && itemIndex < 10 ? baseSlug : `${baseSlug}-${seller.id.replace("seller-", "")}`;
      const stock = itemIndex === 9 ? 0 : 8 + sellerIndex * 6 + itemIndex * 5;
      const rating = itemIndex % 5 === 0 ? 4 : 5;

      products.push({
        id,
        title: isFirstSeller ? title : `${title} - ${seller.shopName}`,
        slug,
        price: price + sellerIndex * 220000 + itemIndex * 50000,
        rating,
        description: `${title} from ${seller.shopName}. Verified electronics listing with realistic price and stock.`,
        mainImage: imagePool[(sellerIndex * 10 + itemIndex) % imagePool.length],
        manufacturer,
        inStock: stock,
        categoryId,
        sellerId: seller.id,
      });
    }
  });
  return products;
}

const products = makeProducts();

const reviewComments = [
  "Product arrived well packed and matched the listing details.",
  "Good value for the price, stable performance, and clear seller communication.",
  "Fast delivery, accurate stock information, and reliable checkout experience.",
  "Premium finish and useful product details before purchase.",
];

async function cleanupSeededDashboardData() {
  await prisma.review.deleteMany({ where: { id: { startsWith: "seed-review-" } } });
  await prisma.payment.deleteMany({ where: { id: { startsWith: "seed-payment-" } } });
  await prisma.order_item.deleteMany({ where: { id: { startsWith: "seed-order-item-" } } });
  await prisma.subOrderProduct.deleteMany({ where: { id: { startsWith: "seed-suborder-product-" } } });
  await prisma.subOrder.deleteMany({ where: { id: { startsWith: "seed-suborder-" } } });
  await prisma.customer_order.deleteMany({ where: { id: { startsWith: "seed-order-" } } });
}

async function seedUsers() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }

  await prisma.user.updateMany({
    where: {
      email: { in: ["style.seller@tfdtronic.com"] },
    },
    data: {
      role: "buyer",
      shopStatus: "PENDING",
      shopName: null,
      shopDescription: null,
      shopPhone: null,
      shopAddress: null,
      shopApprovedAt: null,
      shopCreatedAt: null,
    },
  });
}

async function seedCategories() {
  const categoryIdMap = new Map();
  for (const [id, name] of categories) {
    const category = await prisma.category.upsert({
      where: { name },
      update: { name },
      create: { id, name },
    });
    categoryIdMap.set(id, category.id);
  }
  return categoryIdMap;
}

async function seedProducts(categoryIdMap) {
  await prisma.product.updateMany({
    where: { id: { notIn: products.map((product) => product.id) } },
    data: {
      status: "ARCHIVED",
      mainImage: "/product_placeholder.jpg",
    },
  });

  await prisma.product.updateMany({
    where: { mainImage: { startsWith: "https://images.unsplash.com/" } },
    data: { mainImage: "/product_placeholder.jpg" },
  });

  for (const product of products) {
    const data = {
      ...product,
      categoryId: categoryIdMap.get(product.categoryId) || product.categoryId,
      status: "PUBLISHED",
    };

    await prisma.product.upsert({
      where: { id: product.id },
      update: data,
      create: data,
    });
  }
}

async function seedOrdersAndReviews() {
  const buyerIds = buyers.slice(0, 5).map(([id]) => id);
  let orderIndex = 0;

  for (const seller of activeSellers) {
    const sellerProducts = products.filter((product) => product.sellerId === seller.id).slice(0, 5);

    for (let localOrderIndex = 0; localOrderIndex < 3; localOrderIndex += 1) {
      orderIndex += 1;
      const buyerId = buyerIds[(orderIndex - 1) % buyerIds.length];
      const productA = sellerProducts[localOrderIndex % sellerProducts.length];
      const productB = sellerProducts[(localOrderIndex + 1) % sellerProducts.length];
      const lineItems = [
        { product: productA, quantity: 1 + (localOrderIndex % 2) },
        { product: productB, quantity: 1 },
      ];
      const subtotal = lineItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const shippingTotal = 50000;
      const total = subtotal + shippingTotal;
      const status = localOrderIndex === 0 ? "PENDING" : localOrderIndex === 1 ? "SHIPPED" : "DELIVERED";
      const parentStatus = status === "DELIVERED" ? "delivered" : "processing";
      const orderId = `seed-order-${orderIndex}`;
      const subOrderId = `seed-suborder-${orderIndex}`;

      await prisma.customer_order.create({
        data: {
          id: orderId,
          buyerId,
          name: `Buyer ${buyerId.slice(-3)}`,
          lastname: "Test",
          phone: `090${String(orderIndex).padStart(7, "0")}`,
          email: `${buyerId}@orders.tfdtronic.test`,
          company: "",
          address: `${orderIndex} Test Street`,
          apartment: "",
          postalCode: "700000",
          city: "Ho Chi Minh City",
          country: "Vietnam",
          orderNotice: "Seeded order for dashboard testing.",
          status: parentStatus,
          total,
          dateTime: new Date(Date.now() - orderIndex * 86400000),
        },
      });

      await prisma.payment.create({
        data: {
          id: `seed-payment-${orderIndex}`,
          orderId,
          method: orderIndex % 2 === 0 ? "BANK_TRANSFER" : "COD",
          status: status === "DELIVERED" ? "COMPLETED" : "PENDING",
          amount: total,
          paidAt: status === "DELIVERED" ? new Date(Date.now() - orderIndex * 82000000) : null,
        },
      });

      await prisma.subOrder.create({
        data: {
          id: subOrderId,
          parentOrderId: orderId,
          merchantId: seller.id,
          status,
          subTotal: subtotal,
          shippingTotal,
          trackingNumber: status === "PENDING" ? null : `TFD${String(orderIndex).padStart(8, "0")}`,
          shippingProvider: status === "PENDING" ? null : "TFD Express",
          shippedAt: status !== "PENDING" ? new Date(Date.now() - orderIndex * 72000000) : null,
          deliveredAt: status === "DELIVERED" ? new Date(Date.now() - orderIndex * 64000000) : null,
          confirmedAt: new Date(Date.now() - orderIndex * 86000000),
        },
      });

      for (let itemIndex = 0; itemIndex < lineItems.length; itemIndex += 1) {
        const item = lineItems[itemIndex];
        await prisma.order_item.create({
          data: {
            id: `seed-order-item-${orderIndex}-${itemIndex + 1}`,
            orderId,
            productId: item.product.id,
            sellerId: seller.id,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          },
        });

        await prisma.subOrderProduct.create({
          data: {
            id: `seed-suborder-product-${orderIndex}-${itemIndex + 1}`,
            subOrderId,
            productId: item.product.id,
            quantity: item.quantity,
            productNameSnapshot: item.product.title,
            productImageSnapshot: item.product.mainImage,
            unitPriceSnapshot: item.product.price,
            merchantIdSnapshot: seller.id,
            merchantNameSnapshot: seller.shopName,
          },
        });

        if (status === "DELIVERED") {
          await prisma.review.create({
            data: {
              id: `seed-review-${orderIndex}-${itemIndex + 1}`,
              rating: itemIndex === 0 ? 5 : 4,
              comment: reviewComments[(orderIndex + itemIndex) % reviewComments.length],
              productId: item.product.id,
              userId: buyerId,
              merchantId: seller.id,
              orderId,
              status: "PUBLISHED",
            },
          });
        }
      }
    }
  }

  for (const product of products.slice(0, 20)) {
    for (let index = 0; index < 2; index += 1) {
      await prisma.review.upsert({
        where: { id: `seed-review-catalog-${product.id}-${index + 1}` },
        update: {
          rating: index === 0 ? 5 : 4,
          comment: reviewComments[index],
          status: "PUBLISHED",
        },
        create: {
          id: `seed-review-catalog-${product.id}-${index + 1}`,
          rating: index === 0 ? 5 : 4,
          comment: reviewComments[index],
          productId: product.id,
          userId: buyerIds[index % buyerIds.length],
          merchantId: product.sellerId,
          status: "PUBLISHED",
        },
      });
    }
  }
}

async function main() {
  console.log("Seeding expanded electronics marketplace dashboard data...");

  await cleanupSeededDashboardData();
  await seedUsers();
  const categoryIdMap = await seedCategories();
  await seedProducts(categoryIdMap);
  await seedOrdersAndReviews();

  console.log(`Seeded ${users.length} users, ${activeSellers.length} active sellers, ${buyers.length} buyers, ${categories.length} categories, and ${products.length} products.`);
  console.log("Dashboard test accounts:");
  console.log("  Admin: admin@tfdtronic.com / admin123");
  console.log("  Active seller: seller@tfdtronic.com / seller123");
  console.log("  Other sellers: gadget.seller@tfdtronic.com, mobile.seller@tfdtronic.com, gaming.seller@tfdtronic.com, camera.seller@tfdtronic.com / password");
  console.log("  Buyer: buyer@tfdtronic.com / buyer123");
  console.log("  Become seller test buyer: become.seller.test@tfdtronic.com / password");
  console.log("  Pending seller for admin approval: pending.seller@tfdtronic.com / password");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
