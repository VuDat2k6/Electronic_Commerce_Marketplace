// CategoriesGrid - Exactly matching the zip file design
"use client";

import { Smartphone, Tablet, Mouse, Camera, Watch, Laptop, Monitor, Printer, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from "next/link";

const categories = [
  { id: 'phones', name: 'Smart Phones', icon: Smartphone, color: 'from-blue-400 to-blue-600', href: '/shop/smart-phones' },
  { id: 'tablets', name: 'Tablets', icon: Tablet, color: 'from-purple-400 to-purple-600', href: '/shop/tablets' },
  { id: 'mouses', name: 'Mouses', icon: Mouse, color: 'from-pink-400 to-pink-600', href: '/shop/mouses' },
  { id: 'cameras', name: 'Cameras', icon: Camera, color: 'from-red-400 to-red-600', href: '/shop/cameras' },
  { id: 'watches', name: 'Smart Watches', icon: Watch, color: 'from-orange-400 to-orange-600', href: '/shop/watches' },
  { id: 'laptops', name: 'Laptops', icon: Laptop, color: 'from-yellow-400 to-yellow-600', href: '/shop/laptops' },
  { id: 'pcs', name: 'PCs', icon: Monitor, color: 'from-green-400 to-green-600', href: '/shop/computers' },
  { id: 'printers', name: 'Printers', icon: Printer, color: 'from-teal-400 to-teal-600', href: '/shop/printers' },
  { id: 'earbuds', name: 'Earbuds', icon: Headphones, color: 'from-cyan-400 to-cyan-600', href: '/shop/earbuds' },
  { id: 'headphones', name: 'Head Phones', icon: Headphones, color: 'from-indigo-400 to-indigo-600', href: '/shop/headphones' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function CategoriesGrid() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-extrabold text-center mb-3">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              DANH MỤC SẢN PHẨM
            </span>
          </h2>
          <motion.div
            className="w-32 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 mx-auto rounded-full mb-12"
            initial={{ width: 0 }}
            whileInView={{ width: 128 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                variants={item}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all group relative overflow-hidden"
              >
                {/* Animated background gradient */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                  initial={false}
                />

                <Link href={category.href} className="flex flex-col items-center gap-3 relative z-10">
                  <motion.div
                    className={`bg-gradient-to-br ${category.color} p-5 rounded-2xl shadow-lg`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <span className="text-sm font-semibold text-gray-800 text-center">
                    {category.name}
                  </span>
                </Link>

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 border-2 border-transparent group-hover:border-purple-400 rounded-2xl transition-colors"
                  initial={false}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default CategoriesGrid;
