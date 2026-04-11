const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Smart Phones" },
      update: {},
      create: { id: "cat-smart-phones", name: "Smart Phones" },
    }),
    prisma.category.upsert({
      where: { name: "Laptops" },
      update: {},
      create: { id: "cat-laptops", name: "Laptops" },
    }),
    prisma.category.upsert({
      where: { name: "Tablets" },
      update: {},
      create: { id: "cat-tablets", name: "Tablets" },
    }),
    prisma.category.upsert({
      where: { name: "Cameras" },
      update: {},
      create: { id: "cat-cameras", name: "Cameras" },
    }),
    prisma.category.upsert({
      where: { name: "Smart Watches" },
      update: {},
      create: { id: "cat-smart-watches", name: "Smart Watches" },
    }),
    prisma.category.upsert({
      where: { name: "PCs" },
      update: {},
      create: { id: "cat-pcs", name: "PCs" },
    }),
    prisma.category.upsert({
      where: { name: "Printers" },
      update: {},
      create: { id: "cat-printers", name: "Printers" },
    }),
    prisma.category.upsert({
      where: { name: "Earbuds" },
      update: {},
      create: { id: "cat-earbuds", name: "Earbuds" },
    }),
    prisma.category.upsert({
      where: { name: "Head Phones" },
      update: {},
      create: { id: "cat-head-phones", name: "Head Phones" },
    }),
    prisma.category.upsert({
      where: { name: "Mouses" },
      update: {},
      create: { id: "cat-mouses", name: "Mouses" },
    }),
  ]);

  console.log("Created categories:", categories.length);

  // Create Merchant
  const merchant = await prisma.merchant.upsert({
    where: { id: "merchant-tech-store" },
    update: {},
    create: {
      id: "merchant-tech-store",
      name: "Tech Store",
      description: "Your trusted electronics store",
      email: "contact@techstore.com",
      phone: "+1234567890",
      address: "123 Tech Street, Silicon Valley",
      status: "ACTIVE",
      shippingFee: 999,
    },
  });

  console.log("Created merchant:", merchant.name);

  // Products with high-quality downloaded images from Unsplash
  // Price stored in CENTS (99900 = $999.00)
  const products = [
    {
      id: "prod-iphone-15",
      slug: "iphone-15-pro",
      title: "iPhone 15 Pro",
      mainImage: "/iphone-15-pro.jpg",
      price: 99900, // $999.00
      rating: 5,
      description: "Latest iPhone with A17 Pro chip",
      manufacturer: "Apple",
      inStock: 50,
      status: "PUBLISHED",
      categoryId: "cat-smart-phones",
      merchantId: "merchant-tech-store",
    },
    {
      id: "prod-samsung-s24",
      slug: "samsung-s24-ultra",
      title: "Samsung Galaxy S24 Ultra",
      mainImage: "/samsung-s24.jpg",
      price: 119900, // $1199.00
      rating: 5,
      description: "Premium Android smartphone with AI features",
      manufacturer: "Samsung",
      inStock: 30,
      status: "PUBLISHED",
      categoryId: "cat-smart-phones",
      merchantId: "merchant-tech-store",
    },
    {
      id: "prod-macbook-pro",
      slug: "macbook-pro-m3",
      title: "MacBook Pro 14-inch M3",
      mainImage: "/macbook-pro.jpg",
      price: 199900, // $1999.00
      rating: 5,
      description: "Powerful laptop with M3 chip",
      manufacturer: "Apple",
      inStock: 20,
      status: "PUBLISHED",
      categoryId: "cat-laptops",
      merchantId: "merchant-tech-store",
    },
    {
      id: "prod-ipad-pro",
      slug: "ipad-pro-12-9",
      title: "iPad Pro 12.9-inch",
      mainImage: "/ipad-pro.jpg",
      price: 109900, // $1099.00
      rating: 4,
      description: "Powerful tablet for professionals",
      manufacturer: "Apple",
      inStock: 40,
      status: "PUBLISHED",
      categoryId: "cat-tablets",
      merchantId: "merchant-tech-store",
    },
    {
      id: "prod-airpods-pro",
      slug: "airpods-pro-2",
      title: "AirPods Pro 2nd Gen",
      mainImage: "/airpods-pro.jpg",
      price: 24900, // $249.00
      rating: 5,
      description: "Premium wireless earbuds with ANC",
      manufacturer: "Apple",
      inStock: 100,
      status: "PUBLISHED",
      categoryId: "cat-earbuds",
      merchantId: "merchant-tech-store",
    },
    {
      id: "prod-apple-watch",
      slug: "apple-watch-ultra-2",
      title: "Apple Watch Ultra 2",
      mainImage: "/apple-watch.jpg",
      price: 79900, // $799.00
      rating: 5,
      description: "Advanced smartwatch for athletes",
      manufacturer: "Apple",
      inStock: 35,
      status: "PUBLISHED",
      categoryId: "cat-smart-watches",
      merchantId: "merchant-tech-store",
    },
    {
      id: "prod-sony-wh1000xm5",
      slug: "sony-wh-1000xm5",
      title: "Sony WH-1000XM5",
      mainImage: "/sony-headphones.jpg",
      price: 34900, // $349.00
      rating: 5,
      description: "Industry-leading noise cancelling headphones",
      manufacturer: "Sony",
      inStock: 60,
      status: "PUBLISHED",
      categoryId: "cat-head-phones",
      merchantId: "merchant-tech-store",
    },
    {
      id: "prod-logitech-mx",
      slug: "logitech-mx-master-3",
      title: "Logitech MX Master 3",
      mainImage: "/logitech-mouse.jpg",
      price: 9900, // $99.00
      rating: 5,
      description: "Premium wireless mouse",
      manufacturer: "Logitech",
      inStock: 80,
      status: "PUBLISHED",
      categoryId: "cat-mouses",
      merchantId: "merchant-tech-store",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log("Created products:", products.length);

  // Link user to merchant (if user exists)
  const user = await prisma.user.findFirst();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {},
    });
    console.log("User found:", user.email);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
