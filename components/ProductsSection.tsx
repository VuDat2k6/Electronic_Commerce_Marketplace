// ProductsSection - Enhanced with staggered animations
"use client";

import React from "react";
import { motion } from "framer-motion";
import ProductItem from "./ProductItem";
import Heading from "./Heading";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  mainImage: string;
  rating?: number;
  inStock?: number;
}

interface ProductsSectionProps {
  products?: Product[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const linkVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      delay: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const ProductsSection = ({ products = [] }: ProductsSectionProps) => {
  const hasProducts = products.length > 0;

  return (
    <div className="py-16 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={headingVariants}>
            <Heading title="FEATURED PRODUCTS" />
          </motion.div>
          <motion.div variants={linkVariants}>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors group"
            >
              View All
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Products Grid */}
        {hasProducts ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {products.map((product, index) => (
              <ProductItem
                key={product.id}
                product={product}
                color="black"
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4" />
              </svg>
            </div>
            <p className="text-gray-500">No products available.</p>
            <p className="text-sm text-gray-400 mt-1">Check back later!</p>
          </motion.div>
        )}

        {/* View All Button */}
        {hasProducts && (
          <motion.div
            className="text-center mt-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={buttonVariants}>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                View All Products
                <motion.div
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductsSection;
