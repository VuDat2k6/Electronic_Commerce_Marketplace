"use client";

import { memo } from 'react';
import { Smartphone, Tablet, Mouse, Camera, Watch, Laptop, Monitor, Printer, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

const categories = [
  { id: 'phones', name: 'Smart Phones', icon: Smartphone, color: 'text-blue-600', href: '/shop/smart-phones' },
  { id: 'tablets', name: 'Tablets', icon: Tablet, color: 'text-purple-600', href: '/shop/tablets' },
  { id: 'mouses', name: 'Mouses', icon: Mouse, color: 'text-pink-600', href: '/shop/mouses' },
  { id: 'cameras', name: 'Cameras', icon: Camera, color: 'text-red-600', href: '/shop/cameras' },
  { id: 'watches', name: 'Smart Watches', icon: Watch, color: 'text-orange-600', href: '/shop/watches' },
  { id: 'laptops', name: 'Laptops', icon: Laptop, color: 'text-yellow-600', href: '/shop/laptops' },
  { id: 'pcs', name: 'PCs', icon: Monitor, color: 'text-green-600', href: '/shop/computers' },
  { id: 'printers', name: 'Printers', icon: Printer, color: 'text-teal-600', href: '/shop/printers' },
  { id: 'earbuds', name: 'Earbuds', icon: Headphones, color: 'text-cyan-600', href: '/shop/earbuds' },
  { id: 'headphones', name: 'Head Phones', icon: Headphones, color: 'text-indigo-600', href: '/shop/headphones' },
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

export const CategoriesGrid = memo(() => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              DANH MỤC SẢN PHẨM
            </span>
          </h2>
          <motion.div
            className="w-32 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 mx-auto rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: 128 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div key={category.id} variants={item}>
                <Link href={category.href} className="group block h-full">
                  <Card className="h-full p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border bg-card">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`${category.color} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
});

CategoriesGrid.displayName = 'CategoriesGrid';
export default CategoriesGrid;
