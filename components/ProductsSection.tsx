// ProductsSection - Premium UX with skeleton loading
"use client";

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductItem } from "./ProductItem";
import Link from 'next/link';
import { products, Product } from '@/lib/demo-data';

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
  // Get first 8 featured products from demo data
  const featuredProducts = products.slice(0, 8);

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

          <Link href="/shop">
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
          {featuredProducts.map((product, index) => (
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
  products: customProducts,
  isLoading = false,
  title = "FEATURED PRODUCTS",
  link = "/shop",
  linkText = "View All"
}: ProductsSectionProps) {
  const displayProducts = customProducts && customProducts.length > 0 
    ? customProducts 
    : products.slice(0, 8);

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
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
