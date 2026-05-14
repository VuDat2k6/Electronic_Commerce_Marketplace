// ProductsSection - Premium UX with skeleton loading
"use client";

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductItem } from "./ProductItem";
import Link from 'next/link';

const mockProducts = [
  {
    id: '1',
    slug: 'iphone-15-pro-max-256gb',
    title: 'iPhone 15 Pro Max 256GB',
    price: 29990000,
    originalPrice: 34990000,
    rating: 4.8,
    reviews: 1250,
    mainImage: 'https://picsum.photos/seed/iphone15/500/500',
    badge: 'HOT',
  },
  {
    id: '2',
    slug: 'samsung-galaxy-s24-ultra-512gb',
    title: 'Samsung Galaxy S24 Ultra 512GB',
    price: 27990000,
    originalPrice: 31990000,
    rating: 4.7,
    reviews: 980,
    mainImage: 'https://picsum.photos/seed/samsung24/500/500',
  },
  {
    id: '3',
    slug: 'macbook-pro-14-m3-pro',
    title: 'MacBook Pro 14" M3 Pro',
    price: 52990000,
    originalPrice: 57990000,
    rating: 4.9,
    reviews: 567,
    mainImage: 'https://picsum.photos/seed/macbook14/500/500',
    badge: 'NEW',
  },
  {
    id: '4',
    slug: 'dell-xps-15-9530',
    title: 'Dell XPS 15 9530',
    price: 42990000,
    rating: 4.6,
    reviews: 423,
    mainImage: 'https://picsum.photos/seed/dellxps/500/500',
  },
  {
    id: '5',
    slug: 'sony-wh-1000xm5',
    title: 'Sony WH-1000XM5',
    price: 8990000,
    originalPrice: 10990000,
    rating: 4.8,
    reviews: 2340,
    mainImage: 'https://picsum.photos/seed/sonywh1000/500/500',
  },
  {
    id: '6',
    slug: 'airpods-pro-usb-c',
    title: 'AirPods Pro USB-C',
    price: 6490000,
    originalPrice: 7490000,
    rating: 4.7,
    reviews: 1890,
    mainImage: 'https://picsum.photos/seed/airpodspro/500/500',
    badge: 'HOT',
  },
  {
    id: '7',
    slug: 'apple-watch-series-9',
    title: 'Apple Watch Series 9',
    price: 10990000,
    originalPrice: 12990000,
    rating: 4.8,
    reviews: 1456,
    mainImage: 'https://picsum.photos/seed/applewatch9/500/500',
  },
  {
    id: '8',
    slug: 'galaxy-watch-6-classic',
    title: 'Galaxy Watch 6 Classic',
    price: 8990000,
    rating: 4.6,
    reviews: 890,
    mainImage: 'https://picsum.photos/seed/galaxywatch6/500/500',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Skeleton loader component
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />

      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />

        {/* Rating skeleton */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>

        {/* Price skeleton */}
        <div className="flex items-baseline gap-2">
          <div className="h-8 bg-gray-200 rounded w-28" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>

        {/* Button skeleton */}
        <div className="h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl mt-2" />
      </div>
    </div>
  );
}

interface ProductsSectionProps {
  products?: Array<{
    id: string;
    slug: string;
    title: string;
    price: number;
    originalPrice?: number;
    mainImage: string;
    rating?: number;
    reviews?: number;
    inStock?: number;
    badge?: string;
    description?: string;
    sellerId?: string;
    merchantId?: string;
  }>;
  isLoading?: boolean;
  title?: string;
  link?: string;
  linkText?: string;
}

export function FeaturedProducts() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                FEATURED PRODUCTS
              </span>
            </h2>
            <motion.div
              className="h-1.5 w-64 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 256 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </motion.div>

          <Link href="/shop/smart-phones">
            <motion.button
              className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-2 group bg-purple-50 hover:bg-purple-100 px-6 py-3 rounded-full transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              View All
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {mockProducts.map((product, index) => (
            <motion.div key={product.id} variants={item}>
              <ProductItem product={product} index={index} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function ProductsSection({
  products = [],
  isLoading = false,
  title = "FEATURED PRODUCTS",
  link = "/shop/smart-phones",
  linkText = "View All"
}: ProductsSectionProps) {
  const displayProducts = products.length > 0 ? products : mockProducts;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            <motion.div
              className="h-1.5 w-64 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 256 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </motion.div>

          <Link href={link}>
            <motion.button
              className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-2 group bg-purple-50 hover:bg-purple-100 px-6 py-3 rounded-full transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {linkText}
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </Link>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {displayProducts.map((product: any, index: number) => (
              <motion.div key={product.id || index} variants={item}>
                <ProductItem product={product} index={index} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default ProductsSection;
