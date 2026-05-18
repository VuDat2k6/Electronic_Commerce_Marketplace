// CategoryMenu - Modern design with gradient icons
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { categoryMenuList } from "@/lib/utils";
import { motion } from "framer-motion";

const CategoryMenu = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl lg:text-4xl font-extrabold text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            SHOP BY CATEGORY
          </span>
        </motion.h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {categoryMenuList.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className="group flex flex-col items-center gap-3 p-6 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 rounded-2xl border border-gray-100 hover:border-purple-200 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 rounded-xl transition-all">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600 text-center transition-colors">
                  {item.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryMenu;
