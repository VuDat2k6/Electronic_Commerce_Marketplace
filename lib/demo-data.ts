/**
 * Demo Data for TFDTRONIC Electronics Store
 * 
 * Chứa dữ liệu mẫu cho:
 * - Products (sản phẩm điện tử)
 * - Categories (danh mục)
 * - Hero slides (slides trang chủ)
 * - Collections (bộ sưu tập)
 * 
 * Tất cả hình ảnh được lưu local trong /public/images/
 * để đảm bảo performance và reliability
 */

// ============================================
// IMAGE CONFIG
// ============================================

const IMG = {
  products: '/images/products/',
  hero: '/images/hero/',
  categories: '/images/categories/',
};

// ============================================
// CATEGORIES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
  icon: string;
}

export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Smartphones',
    slug: 'smartphones',
    image: `${IMG.categories}smartphones.jpg`,
    productCount: 156,
    icon: '📱',
  },
  {
    id: 'cat-2',
    name: 'Laptops',
    slug: 'laptops',
    image: `${IMG.categories}laptops.jpg`,
    productCount: 89,
    icon: '💻',
  },
  {
    id: 'cat-3',
    name: 'Tablets',
    slug: 'tablets',
    image: `${IMG.categories}tablets.jpg`,
    productCount: 67,
    icon: '📲',
  },
  {
    id: 'cat-4',
    name: 'Audio',
    slug: 'audio',
    image: `${IMG.categories}audio.jpg`,
    productCount: 234,
    icon: '🎧',
  },
  {
    id: 'cat-5',
    name: 'Smart Watches',
    slug: 'smart-watches',
    image: `${IMG.categories}smart-watches.jpg`,
    productCount: 112,
    icon: '⌚',
  },
  {
    id: 'cat-6',
    name: 'Gaming',
    slug: 'gaming',
    image: `${IMG.categories}gaming.jpg`,
    productCount: 178,
    icon: '🎮',
  },
  {
    id: 'cat-7',
    name: 'Cameras',
    slug: 'cameras',
    image: `${IMG.categories}cameras.jpg`,
    productCount: 94,
    icon: '📷',
  },
  {
    id: 'cat-8',
    name: 'Accessories',
    slug: 'accessories',
    image: `${IMG.categories}accessories.jpg`,
    productCount: 312,
    icon: '🔌',
  },
];

// ============================================
// PRODUCTS
// ============================================

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number; // VNĐ
  originalPrice?: number;
  mainImage: string;
  images: string[];
  category: string;
  categorySlug: string;
  rating: number;
  reviews: number;
  inStock: number;
  badge?: 'HOT' | 'NEW' | 'SALE' | 'BEST';
  description: string;
  features: string[];
  seller: {
    id: string;
    name: string;
    rating: number;
  };
}

export const products: Product[] = [
  // SMARTPHONES
  {
    id: 'prod-001',
    slug: 'iphone-15-pro-max-256gb-natural-titanium',
    title: 'iPhone 15 Pro Max 256GB - Natural Titanium',
    price: 32990000,
    originalPrice: 34990000,
    mainImage: `${IMG.products}iphone-15-pro-max.jpg`,
    images: [
      `${IMG.products}iphone-15-pro-max.jpg`,
    ],
    category: 'Smartphones',
    categorySlug: 'smartphones',
    rating: 4.9,
    reviews: 2456,
    inStock: 45,
    badge: 'HOT',
    description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, titanium grade 5 và màn hình Super Retina XDR 6.7 inch.',
    features: ['A17 Pro Chip', '48MP Camera', 'Titanium Body', 'USB-C', 'Action Button'],
    seller: { id: 'sel-001', name: 'Apple Authorized Store', rating: 4.9 },
  },
  {
    id: 'prod-002',
    slug: 'samsung-galaxy-s24-ultra-512gb-titanium-black',
    title: 'Samsung Galaxy S24 Ultra 512GB - Titanium Black',
    price: 28990000,
    originalPrice: 32990000,
    mainImage: `${IMG.products}galaxy-s24-ultra.jpg`,
    images: [
      `${IMG.products}galaxy-s24-ultra.jpg`,
    ],
    category: 'Smartphones',
    categorySlug: 'smartphones',
    rating: 4.8,
    reviews: 1890,
    inStock: 32,
    badge: 'SALE',
    description: 'Samsung Galaxy S24 Ultra với S Pen tích hợp, camera 200MP và AI Galaxy mới nhất.',
    features: ['Snapdragon 8 Gen 3', '200MP Camera', 'S Pen', 'AI Features', '5000mAh'],
    seller: { id: 'sel-002', name: 'Samsung Official Store', rating: 4.8 },
  },
  {
    id: 'prod-003',
    slug: 'xiaomi-14-pro-512gb',
    title: 'Xiaomi 14 Pro 512GB',
    price: 18990000,
    originalPrice: 21990000,
    mainImage: `${IMG.products}xiaomi-14-pro.jpg`,
    images: [
      `${IMG.products}xiaomi-14-pro.jpg`,
    ],
    category: 'Smartphones',
    categorySlug: 'smartphones',
    rating: 4.7,
    reviews: 876,
    inStock: 28,
    badge: 'NEW',
    description: 'Xiaomi 14 Pro với Leica optics, Snapdragon 8 Gen 3 và sạc nhanh 120W.',
    features: ['Leica Camera', 'Snapdragon 8 Gen 3', '120W Fast Charge', 'Amoled 6.73"', '12GB RAM'],
    seller: { id: 'sel-003', name: 'Xiaomi Vietnam', rating: 4.7 },
  },
  {
    id: 'prod-004',
    slug: 'google-pixel-8-pro-256gb',
    title: 'Google Pixel 8 Pro 256GB - Obsidian',
    price: 22990000,
    mainImage: `${IMG.products}pixel-8-pro.jpg`,
    images: [
      `${IMG.products}pixel-8-pro.jpg`,
    ],
    category: 'Smartphones',
    categorySlug: 'smartphones',
    rating: 4.8,
    reviews: 543,
    inStock: 15,
    badge: 'NEW',
    description: 'Google Pixel 8 Pro với Tensor G3, AI Magic Eraser và 7 năm cập nhật.',
    features: ['Tensor G3', 'Magic Eraser', '7 Years Updates', '50MP Camera', 'Android 14'],
    seller: { id: 'sel-004', name: 'Google Store VN', rating: 4.8 },
  },

  // LAPTOPS
  {
    id: 'prod-005',
    slug: 'macbook-pro-16-m3-pro-512gb-space-black',
    title: 'MacBook Pro 16" M3 Pro 512GB - Space Black',
    price: 62990000,
    mainImage: `${IMG.products}macbook-pro-16.jpg`,
    images: [
      `${IMG.products}macbook-pro-16.jpg`,
    ],
    category: 'Laptops',
    categorySlug: 'laptops',
    rating: 4.9,
    reviews: 1567,
    inStock: 12,
    badge: 'BEST',
    description: 'MacBook Pro 16 inch với chip M3 Pro, Liquid Retina XDR và thời lượng pin lên đến 22 giờ.',
    features: ['M3 Pro Chip', '36GB RAM', 'Liquid Retina XDR', '22h Battery', '3x USB-C'],
    seller: { id: 'sel-001', name: 'Apple Authorized Store', rating: 4.9 },
  },
  {
    id: 'prod-006',
    slug: 'dell-xps-15-9530-i7-32gb-rtx-4060',
    title: 'Dell XPS 15 9530 - Intel Core i7, RTX 4060',
    price: 44990000,
    originalPrice: 49990000,
    mainImage: `${IMG.products}dell-xps-15.jpg`,
    images: [
      `${IMG.products}dell-xps-15.jpg`,
    ],
    category: 'Laptops',
    categorySlug: 'laptops',
    rating: 4.7,
    reviews: 892,
    inStock: 8,
    badge: 'SALE',
    description: 'Dell XPS 15 với màn hình 3.5K OLED, Intel Core i7 thế hệ 13 và NVIDIA RTX 4060.',
    features: ['Intel Core i7-13700H', 'RTX 4060', '3.5K OLED', '32GB RAM', '1TB SSD'],
    seller: { id: 'sel-005', name: 'Dell Official Store', rating: 4.7 },
  },
  {
    id: 'prod-007',
    slug: 'macbook-air-15-m3-256gb',
    title: 'MacBook Air 15" M3 256GB - Midnight',
    price: 36990000,
    mainImage: `${IMG.products}macbook-air-15.jpg`,
    images: [
      `${IMG.products}macbook-air-15.jpg`,
    ],
    category: 'Laptops',
    categorySlug: 'laptops',
    rating: 4.8,
    reviews: 2134,
    inStock: 25,
    badge: 'HOT',
    description: 'MacBook Air 15 inch mới nhất với chip M3, màn hình Liquid Retina và thiết kế fanless.',
    features: ['M3 Chip', 'Liquid Retina', 'Fanless Design', '18h Battery', 'Wi-Fi 6E'],
    seller: { id: 'sel-001', name: 'Apple Authorized Store', rating: 4.9 },
  },
  {
    id: 'prod-008',
    slug: 'asus-rog-zephyrus-g14-2024',
    title: 'ASUS ROG Zephyrus G14 2024 - Ryzen 9, RTX 4070',
    price: 52990000,
    originalPrice: 57990000,
    mainImage: `${IMG.products}asus-rog-zephyrus.jpg`,
    images: [
      `${IMG.products}asus-rog-zephyrus.jpg`,
    ],
    category: 'Laptops',
    categorySlug: 'laptops',
    rating: 4.8,
    reviews: 567,
    inStock: 6,
    badge: 'HOT',
    description: 'ROG Zephyrus G14 2024 - Gaming laptop mạnh mẽ, mỏng nhẹ với AMD Ryzen 9 và RTX 4070.',
    features: ['Ryzen 9 7940HS', 'RTX 4070', 'Mini LED Display', '165Hz', '32GB RAM'],
    seller: { id: 'sel-006', name: 'ASUS Store', rating: 4.8 },
  },

  // AUDIO
  {
    id: 'prod-009',
    slug: 'airpods-pro-2nd-generation-usb-c',
    title: 'AirPods Pro (2nd Gen) USB-C',
    price: 6490000,
    mainImage: `${IMG.products}airpods-pro.jpg`,
    images: [
      `${IMG.products}airpods-pro.jpg`,
    ],
    category: 'Audio',
    categorySlug: 'audio',
    rating: 4.9,
    reviews: 4567,
    inStock: 120,
    badge: 'BEST',
    description: 'AirPods Pro với USB-C, Active Noise Cancellation, Adaptive Audio và thời lượng pin 6 giờ.',
    features: ['USB-C', 'Active Noise Cancellation', 'Adaptive Audio', 'Spatial Audio', 'MagSafe'],
    seller: { id: 'sel-001', name: 'Apple Authorized Store', rating: 4.9 },
  },
  {
    id: 'prod-010',
    slug: 'sony-wh-1000xm5-wireless-headphones',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    price: 8990000,
    originalPrice: 10990000,
    mainImage: `${IMG.products}sony-wh-1000xm5.jpg`,
    images: [
      `${IMG.products}sony-wh-1000xm5.jpg`,
    ],
    category: 'Audio',
    categorySlug: 'audio',
    rating: 4.8,
    reviews: 3245,
    inStock: 45,
    badge: 'SALE',
    description: 'Tai nghe Sony cao cấp với industry-leading noise cancellation, driver 30mm và 30 giờ pin.',
    features: ['Industry-leading ANC', '30hr Battery', '30mm Driver', 'Multipoint', 'Hi-Res Audio'],
    seller: { id: 'sel-007', name: 'Sony Center VN', rating: 4.8 },
  },
  {
    id: 'prod-011',
    slug: 'samsung-buds-2-pro-graphite',
    title: 'Samsung Galaxy Buds2 Pro - Graphite',
    price: 4990000,
    originalPrice: 5990000,
    mainImage: `${IMG.products}galaxy-buds2-pro.jpg`,
    images: [
      `${IMG.products}galaxy-buds2-pro.jpg`,
    ],
    category: 'Audio',
    categorySlug: 'audio',
    rating: 4.7,
    reviews: 1876,
    inStock: 67,
    badge: 'SALE',
    description: 'Galaxy Buds2 Pro với ANC, 360 Audio, AKG sound và thiết kế nhỏ gọn.',
    features: ['ANC', '360 Audio', 'AKG Sound', 'IPX7', '5hr+8hr Battery'],
    seller: { id: 'sel-002', name: 'Samsung Official Store', rating: 4.8 },
  },
  {
    id: 'prod-012',
    slug: 'jbl-charge-5-bluetooth-speaker',
    title: 'JBL Charge 5 Bluetooth Speaker',
    price: 3990000,
    originalPrice: 4490000,
    mainImage: `${IMG.products}jbl-charge-5.jpg`,
    images: [
      `${IMG.products}jbl-charge-5.jpg`,
    ],
    category: 'Audio',
    categorySlug: 'audio',
    rating: 4.6,
    reviews: 2341,
    inStock: 89,
    badge: 'HOT',
    description: 'Loa Bluetooth JBL Charge 5 với bass mạnh, chống nước IP67 và sạc ngược cho thiết bị khác.',
    features: ['20hr Battery', 'IP67 Waterproof', 'PartyBoost', 'Powerbank Function', 'JBL Pro Sound'],
    seller: { id: 'sel-008', name: 'JBL Vietnam', rating: 4.7 },
  },

  // SMART WATCHES
  {
    id: 'prod-013',
    slug: 'apple-watch-ultra-2-49mm',
    title: 'Apple Watch Ultra 2 - 49mm Titanium',
    price: 23990000,
    mainImage: `${IMG.products}apple-watch-ultra.jpg`,
    images: [
      `${IMG.products}apple-watch-ultra.jpg`,
    ],
    category: 'Smart Watches',
    categorySlug: 'smart-watches',
    rating: 4.9,
    reviews: 1234,
    inStock: 18,
    badge: 'BEST',
    description: 'Apple Watch Ultra 2 cho athletes và adventurers với GPS chính xác, Action Button và 36 giờ pin.',
    features: ['S9 Chip', '3000 nits Display', '36hr Battery', 'Dual Frequency GPS', 'Titanium'],
    seller: { id: 'sel-001', name: 'Apple Authorized Store', rating: 4.9 },
  },
  {
    id: 'prod-014',
    slug: 'samsung-galaxy-watch-6-classic-47mm',
    title: 'Samsung Galaxy Watch 6 Classic - 47mm Black',
    price: 8990000,
    originalPrice: 9990000,
    mainImage: `${IMG.products}galaxy-watch-6.jpg`,
    images: [
      `${IMG.products}galaxy-watch-6.jpg`,
    ],
    category: 'Smart Watches',
    categorySlug: 'smart-watches',
    rating: 4.7,
    reviews: 987,
    inStock: 34,
    badge: 'SALE',
    description: 'Galaxy Watch 6 Classic với rotating bezel, health tracking toàn diện và Wear OS.',
    features: ['Rotating Bezel', 'BioActive Sensor', 'Wear OS', 'Sapphire Crystal', 'IP68'],
    seller: { id: 'sel-002', name: 'Samsung Official Store', rating: 4.8 },
  },
  {
    id: 'prod-015',
    slug: 'garmin-fenix-7x-pro-solar',
    title: 'Garmin Fenix 7X Pro Solar',
    price: 27990000,
    mainImage: `${IMG.products}garmin-fenix.jpg`,
    images: [
      `${IMG.products}garmin-fenix.jpg`,
    ],
    category: 'Smart Watches',
    categorySlug: 'smart-watches',
    rating: 4.9,
    reviews: 456,
    inStock: 5,
    badge: 'NEW',
    description: 'Garmin Fenix 7X Pro với solar charging, topo maps và training metrics chuyên nghiệp.',
    features: ['Solar Charging', 'Topo Maps', 'Multi-band GPS', 'Pulse Ox', 'Training Analysis'],
    seller: { id: 'sel-009', name: 'Garmin Store', rating: 4.9 },
  },

  // TABLETS
  {
    id: 'prod-016',
    slug: 'ipad-pro-12-9-m4-256gb-space-black',
    title: 'iPad Pro 12.9" M4 256GB - Space Black',
    price: 32990000,
    mainImage: `${IMG.products}ipad-pro.jpg`,
    images: [
      `${IMG.products}ipad-pro.jpg`,
    ],
    category: 'Tablets',
    categorySlug: 'tablets',
    rating: 4.9,
    reviews: 1567,
    inStock: 22,
    badge: 'BEST',
    description: 'iPad Pro M4 với Liquid Retina XDR, Apple Pencil Pro support và chip M4 mạnh mẽ.',
    features: ['M4 Chip', 'Liquid Retina XDR', 'Apple Pencil Pro', 'Thunderbolt', 'Face ID'],
    seller: { id: 'sel-001', name: 'Apple Authorized Store', rating: 4.9 },
  },
  {
    id: 'prod-017',
    slug: 'samsung-galaxy-tab-s9-ultra-256gb',
    title: 'Samsung Galaxy Tab S9 Ultra 256GB',
    price: 27990000,
    originalPrice: 30990000,
    mainImage: `${IMG.products}galaxy-tab-s9.jpg`,
    images: [
      `${IMG.products}galaxy-tab-s9.jpg`,
    ],
    category: 'Tablets',
    categorySlug: 'tablets',
    rating: 4.7,
    reviews: 678,
    inStock: 15,
    badge: 'SALE',
    description: 'Galaxy Tab S9 Ultra với màn hình Dynamic AMOLED 2X 14.6 inch và S Pen included.',
    features: ['Snapdragon 8 Gen 2', 'Dynamic AMOLED 2X', 'S Pen Included', 'IP68', '11200mAh'],
    seller: { id: 'sel-002', name: 'Samsung Official Store', rating: 4.8 },
  },

  // GAMING
  {
    id: 'prod-018',
    slug: 'playstation-5-slim-digital-edition',
    title: 'PlayStation 5 Slim Digital Edition',
    price: 12990000,
    mainImage: `${IMG.products}playstation-5.jpg`,
    images: [
      `${IMG.products}playstation-5.jpg`,
    ],
    category: 'Gaming',
    categorySlug: 'gaming',
    rating: 4.9,
    reviews: 3456,
    inStock: 8,
    badge: 'HOT',
    description: 'PS5 Slim Digital Edition - Console thế hệ mới với game library khổng lồ, 4K gaming.',
    features: ['4K Gaming', 'Ray Tracing', '825GB SSD', 'DualSense', 'Tempest 3D Audio'],
    seller: { id: 'sel-010', name: 'Sony Store', rating: 4.9 },
  },
  {
    id: 'prod-019',
    slug: 'xbox-series-x-1tb',
    title: 'Xbox Series X 1TB',
    price: 13990000,
    mainImage: `${IMG.products}xbox-series-x.jpg`,
    images: [
      `${IMG.products}xbox-series-x.jpg`,
    ],
    category: 'Gaming',
    categorySlug: 'gaming',
    rating: 4.8,
    reviews: 2345,
    inStock: 12,
    badge: 'BEST',
    description: 'Xbox Series X - Console mạnh nhất với 12 TFLOPS, Quick Resume và Game Pass.',
    features: ['12 TFLOPS', 'Quick Resume', 'Xbox Game Pass', '4K 120fps', '1TB NVMe'],
    seller: { id: 'sel-011', name: 'Microsoft Store', rating: 4.8 },
  },
  {
    id: 'prod-020',
    slug: 'nintendo-switch-oled-white',
    title: 'Nintendo Switch OLED - White',
    price: 8990000,
    mainImage: `${IMG.products}nintendo-switch.jpg`,
    images: [
      `${IMG.products}nintendo-switch.jpg`,
    ],
    category: 'Gaming',
    categorySlug: 'gaming',
    rating: 4.8,
    reviews: 4567,
    inStock: 25,
    badge: 'HOT',
    description: 'Nintendo Switch OLED với màn hình 7 inch OLED, stand rời và dock ethernet.',
    features: ['7" OLED Display', 'Grip Stand', 'Ethernet Port', '64GB Storage', 'Party Play'],
    seller: { id: 'sel-012', name: 'Nintendo Store', rating: 4.9 },
  },

  // CAMERAS
  {
    id: 'prod-021',
    slug: 'sony-alpha-a7-iv-body',
    title: 'Sony Alpha A7 IV Mirrorless Camera Body',
    price: 64990000,
    mainImage: `${IMG.products}sony-a7-iv.jpg`,
    images: [
      `${IMG.products}sony-a7-iv.jpg`,
    ],
    category: 'Cameras',
    categorySlug: 'cameras',
    rating: 4.9,
    reviews: 567,
    inStock: 3,
    badge: 'BEST',
    description: 'Sony A7 IV - Full-frame mirrorless với 33MP, 4K 60fps và AI-based AF.',
    features: ['33MP Full-Frame', '4K 60fps', '759 AF Points', '5-axis IBIS', 'S-Log3'],
    seller: { id: 'sel-007', name: 'Sony Center VN', rating: 4.8 },
  },
  {
    id: 'prod-022',
    slug: 'canon-eos-r6-mark-ii',
    title: 'Canon EOS R6 Mark II Mirrorless',
    price: 62990000,
    mainImage: `${IMG.products}canon-eos-r6.jpg`,
    images: [
      `${IMG.products}canon-eos-r6.jpg`,
    ],
    category: 'Cameras',
    categorySlug: 'cameras',
    rating: 4.8,
    reviews: 345,
    inStock: 4,
    badge: 'NEW',
    description: 'Canon R6 Mark II với 40fps continuous shooting, 6K RAW video và improved AF.',
    features: ['40fps Continuous', '6K RAW', 'IBIS', 'Animal Eye AF', 'CF+SD Slots'],
    seller: { id: 'sel-013', name: 'Canon Vietnam', rating: 4.8 },
  },

  // ACCESSORIES
  {
    id: 'prod-023',
    slug: 'anker-737-powerbank-24000mah',
    title: 'Anker 737 PowerBank 24,000mAh 140W',
    price: 2990000,
    mainImage: `${IMG.products}anker-powerbank.jpg`,
    images: [
      `${IMG.products}anker-powerbank.jpg`,
    ],
    category: 'Accessories',
    categorySlug: 'accessories',
    rating: 4.8,
    reviews: 1234,
    inStock: 56,
    badge: 'HOT',
    description: 'Anker GaN PowerBank với 24,000mAh, sạc laptop 140W và màn hình thông minh.',
    features: ['140W Output', '24000mAh', 'Smart Display', 'USB-C PD', 'Airline Safe'],
    seller: { id: 'sel-014', name: 'Anker Store', rating: 4.9 },
  },
  {
    id: 'prod-024',
    slug: 'apple-magic-keyboard-with-touch-id',
    title: 'Apple Magic Keyboard with Touch ID - US English',
    price: 4490000,
    mainImage: `${IMG.products}magic-keyboard.jpg`,
    images: [
      `${IMG.products}magic-keyboard.jpg`,
    ],
    category: 'Accessories',
    categorySlug: 'accessories',
    rating: 4.9,
    reviews: 2345,
    inStock: 78,
    badge: 'BEST',
    description: 'Magic Keyboard với Touch ID cho Mac - Phím cơ Apple, typing experience tuyệt vời.',
    features: ['Touch ID', 'Scissor Keys', 'Full Numeric', 'USB-C Charging', 'Aluminum'],
    seller: { id: 'sel-001', name: 'Apple Authorized Store', rating: 4.9 },
  },
];

// ============================================
// HERO SLIDES
// ============================================

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
  discount: string;
  gradient: string;
  link: string;
  cta: string;
}

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: 'New iPhone',
    subtitle: '15 Pro Series',
    description: 'Experience the power of A17 Pro chip with titanium design and the most advanced camera system ever.',
    image: `${IMG.hero}hero-iphone.jpg`,
    badge: 'NEW',
    discount: '-10%',
    gradient: 'from-purple-600 via-pink-500 to-orange-400',
    link: '/product/iphone-15-pro-max-256gb-natural-titanium',
    cta: 'Shop Now',
  },
  {
    id: 2,
    title: 'MacBook Pro',
    subtitle: 'M3 Family',
    description: 'Supercharged by M3, M3 Pro, and M3 Max. The most powerful chips ever built for a personal computer.',
    image: `${IMG.hero}hero-macbook.jpg`,
    badge: 'HOT',
    discount: '',
    gradient: 'from-blue-600 via-cyan-500 to-teal-400',
    link: '/product/macbook-pro-16-m3-pro-512gb-space-black',
    cta: 'Explore',
  },
  {
    id: 3,
    title: 'Premium',
    subtitle: 'Audio',
    description: 'Immerse yourself in crystal-clear audio with industry-leading noise cancellation.',
    image: `${IMG.hero}hero-audio.jpg`,
    badge: 'SALE',
    discount: '-25%',
    gradient: 'from-indigo-600 via-purple-500 to-pink-400',
    link: '/product/sony-wh-1000xm5-wireless-headphones',
    cta: 'Listen Now',
  },
  {
    id: 4,
    title: 'Smart',
    subtitle: 'Watches',
    description: 'Track your fitness, monitor your health, and stay connected with the latest smartwatches.',
    image: `${IMG.hero}hero-watch.jpg`,
    badge: 'BEST',
    discount: '',
    gradient: 'from-pink-600 via-rose-500 to-red-400',
    link: '/product/apple-watch-ultra-2-49mm',
    cta: 'Discover',
  },
  {
    id: 5,
    title: 'Gaming',
    subtitle: 'Consoles',
    description: 'Next-gen gaming with stunning graphics, lightning-fast load times, and immersive experiences.',
    image: `${IMG.hero}hero-gaming.jpg`,
    badge: 'HOT',
    discount: '-15%',
    gradient: 'from-orange-600 via-amber-500 to-yellow-400',
    link: '/product/playstation-5-slim-digital-edition',
    cta: 'Play Now',
  },
];

// ============================================
// COLLECTIONS
// ============================================

export interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  productCount: number;
}

export const collections: Collection[] = [
  {
    id: 'col-1',
    name: 'Apple Ecosystem',
    slug: 'apple-ecosystem',
    image: `${IMG.categories}laptops.jpg`, // Reuse category image
    description: 'Everything Apple, perfectly connected.',
    productCount: 45,
  },
  {
    id: 'col-2',
    name: 'Gaming Setup',
    slug: 'gaming-setup',
    image: `${IMG.categories}gaming.jpg`,
    description: 'Build your ultimate gaming station.',
    productCount: 78,
  },
  {
    id: 'col-3',
    name: 'Work From Home',
    slug: 'work-from-home',
    image: `${IMG.categories}laptops.jpg`,
    description: 'Tools for productivity and comfort.',
    productCount: 56,
  },
  {
    id: 'col-4',
    name: 'Creator Studio',
    slug: 'creator-studio',
    image: `${IMG.categories}cameras.jpg`,
    description: 'Professional gear for content creators.',
    productCount: 34,
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format price to Vietnamese Dong
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString('vi-VN') + '₫';
};

/**
 * Calculate discount percentage
 */
export const calculateDiscount = (original: number, current: number): number => {
  return Math.round(((original - current) / original) * 100);
};

/**
 * Get products by category
 */
export const getProductsByCategory = (categorySlug: string): Product[] => {
  return products.filter((p) => p.categorySlug === categorySlug);
};

/**
 * Get featured products (hot, new, best, sale)
 */
export const getFeaturedProducts = (): Product[] => {
  return products.filter((p) => p.badge && ['HOT', 'NEW', 'BEST', 'SALE'].includes(p.badge));
};

/**
 * Get products on sale
 */
export const getSaleProducts = (): Product[] => {
  return products.filter((p) => p.originalPrice && p.originalPrice > p.price);
};

/**
 * Search products by title
 */
export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return products.filter((p) =>
    p.title.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
};
