const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Seed the database with default categories, users, and products.
 *
 * Ensures four categories, three test users (admin, seller, buyer) with predefined metadata, and eight sample products exist by inserting or updating records as needed for initial development or testing.
 */
async function main() {
  console.log("Seeding database...");

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-camera" },
      update: {},
      create: { id: "cat-camera", name: "Cameras" },
    }),
    prisma.category.upsert({
      where: { id: "cat-security" },
      update: {},
      create: { id: "cat-security", name: "Security Systems" },
    }),
    prisma.category.upsert({
      where: { id: "cat-smart" },
      update: {},
      create: { id: "cat-smart", name: "Smart Home" },
    }),
    prisma.category.upsert({
      where: { id: "cat-audio" },
      update: {},
      create: { id: "cat-audio", name: "Audio Equipment" },
    }),
  ]);
  console.log("Created categories:", categories.length);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@tfdtronic.com" },
    update: {},
    create: {
      id: "user-admin",
      email: "admin@tfdtronic.com",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      role: "admin",
      shopName: "TFDTRONIC HQ",
    },
  });
  console.log("Created admin:", admin.email);

  // Create Seller User
  const seller = await prisma.user.upsert({
    where: { email: "seller@tfdtronic.com" },
    update: {},
    create: {
      id: "user-seller",
      email: "seller@tfdtronic.com",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      role: "seller",
      shopName: "TechGadget Store",
      shopDescription: "Your trusted source for electronic gadgets",
      shopPhone: "1234567890",
      shopAddress: "123 Tech Street, Silicon Valley",
      shopStatus: "ACTIVE",
    },
  });
  console.log("Created seller:", seller.email);

  // Create Buyer User
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@tfdtronic.com" },
    update: {},
    create: {
      id: "user-buyer",
      email: "buyer@tfdtronic.com",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      role: "buyer",
    },
  });
  console.log("Created buyer:", buyer.email);

  // Create Products
  const products = [
    {
      id: "prod-1",
      title: "IP Camera 4K Ultra HD Wireless Security Camera",
      slug: "ip-camera-4k-wireless",
      price: 299900,
      rating: 5,
      description: "Advanced 4K Ultra HD wireless security camera with night vision, two-way audio, and smart motion detection.",
      mainImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
      manufacturer: "SecureView",
      inStock: 50,
      categoryId: "cat-camera",
      sellerId: "user-seller",
    },
    {
      id: "prod-2",
      title: "Smart Door Lock with Fingerprint & App Control",
      slug: "smart-door-lock-fingerprint",
      price: 199900,
      rating: 4,
      description: "Keyless entry smart door lock with fingerprint scanner, keypad, and mobile app control.",
      mainImage: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500",
      manufacturer: "LockPro",
      inStock: 30,
      categoryId: "cat-security",
      sellerId: "user-seller",
    },
    {
      id: "prod-3",
      title: "Wireless Smart Doorbell Camera",
      slug: "smart-doorbell-camera",
      price: 149900,
      rating: 4,
      description: "Video doorbell with 1080p HD, motion alerts, night vision, and two-way talk.",
      mainImage: "https://images.unsplash.com/photo-1558002038-bb0f7a5d5a69?w=500",
      manufacturer: "DoorSafe",
      inStock: 45,
      categoryId: "cat-security",
      sellerId: "user-seller",
    },
    {
      id: "prod-4",
      title: "Smart Home Security System - 8 Piece Kit",
      slug: "smart-home-security-kit",
      price: 499900,
      rating: 5,
      description: "Complete home security system with hub, sensors, cameras, and 24/7 monitoring.",
      mainImage: "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=500",
      manufacturer: "SecureHome",
      inStock: 20,
      categoryId: "cat-smart",
      sellerId: "user-seller",
    },
    {
      id: "prod-5",
      title: "Wireless Bluetooth Speaker with Deep Bass",
      slug: "bluetooth-speaker-deep-bass",
      price: 89900,
      rating: 4,
      description: "Portable wireless speaker with 360-degree sound, 12-hour battery, and waterproof design.",
      mainImage: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
      manufacturer: "SoundMax",
      inStock: 100,
      categoryId: "cat-audio",
      sellerId: "user-seller",
    },
    {
      id: "prod-6",
      title: "Noise Cancelling Wireless Headphones",
      slug: "noise-cancelling-headphones",
      price: 249900,
      rating: 5,
      description: "Premium over-ear headphones with active noise cancellation, 30-hour battery life.",
      mainImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      manufacturer: "AudioPure",
      inStock: 60,
      categoryId: "cat-audio",
      sellerId: "user-seller",
    },
    {
      id: "prod-7",
      title: "PTZ Security Camera - 30x Optical Zoom",
      slug: "ptz-camera-30x-zoom",
      price: 599900,
      rating: 4,
      description: "Professional PTZ dome camera with 30x optical zoom, night vision up to 500ft.",
      mainImage: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=500",
      manufacturer: "ProCam",
      inStock: 15,
      categoryId: "cat-camera",
      sellerId: "user-seller",
    },
    {
      id: "prod-8",
      title: "Smart Smoke & CO Detector",
      slug: "smart-smoke-detector",
      price: 79900,
      rating: 3,
      description: "WiFi connected smoke and carbon monoxide detector with smartphone alerts.",
      mainImage: "https://images.unsplash.com/photo-1585670083004-5c2b5b90c5b4?w=500",
      manufacturer: "SafeAlert",
      inStock: 0,
      categoryId: "cat-smart",
      sellerId: "user-seller",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }
  console.log("Created products:", products.length);

  console.log("\n✅ Seeding completed!");
  console.log("\nTest accounts:");
  console.log("  Admin: admin@tfdtronic.com / password");
  console.log("  Seller: seller@tfdtronic.com / password");
  console.log("  Buyer: buyer@tfdtronic.com / password");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
