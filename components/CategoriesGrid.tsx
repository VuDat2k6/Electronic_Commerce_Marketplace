"use client";

import { Camera, Gamepad2, Headphones, Laptop, Monitor, Mouse, Printer, Smartphone, Tablet, Watch } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const categories = [
  { id: "smartphones", name: "Smartphones", icon: Smartphone, color: "from-blue-500 to-cyan-500", href: "/shop?category=smartphones" },
  { id: "laptops", name: "Laptops", icon: Laptop, color: "from-violet-500 to-purple-600", href: "/shop?category=laptops" },
  { id: "tablets", name: "Tablets", icon: Tablet, color: "from-sky-500 to-blue-600", href: "/shop?category=tablets" },
  { id: "audio", name: "Audio", icon: Headphones, color: "from-pink-500 to-rose-600", href: "/shop?category=audio" },
  { id: "smart-watches", name: "Smart Watches", icon: Watch, color: "from-orange-500 to-amber-500", href: "/shop?category=smart-watches" },
  { id: "gaming", name: "Gaming", icon: Gamepad2, color: "from-indigo-500 to-blue-500", href: "/shop?category=gaming" },
  { id: "cameras", name: "Cameras", icon: Camera, color: "from-red-500 to-pink-600", href: "/shop?category=cameras" },
  { id: "accessories", name: "Accessories", icon: Mouse, color: "from-emerald-500 to-teal-500", href: "/shop?category=accessories" },
  { id: "computers", name: "PCs & Monitors", icon: Monitor, color: "from-green-500 to-lime-500", href: "/shop?category=computers" },
  { id: "printers", name: "Printers", icon: Printer, color: "from-slate-500 to-gray-700", href: "/shop?category=printers" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function CategoriesGrid() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-3 text-center text-4xl font-extrabold">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              SHOP BY CATEGORY
            </span>
          </h2>
          <motion.div
            className="mx-auto mb-12 h-1.5 w-32 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500"
            initial={{ width: 0 }}
            whileInView={{ width: 128 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </motion.div>
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-5"
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
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0], transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-md transition-all hover:shadow-2xl sm:p-6"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 transition-opacity group-hover:opacity-10`}
                  initial={false}
                />
                <Link href={category.href} className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
                  <motion.div
                    className={`rounded-2xl bg-gradient-to-br ${category.color} p-4 shadow-lg sm:p-5`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                  </motion.div>
                  <span className="text-center text-xs font-semibold text-gray-800 sm:text-sm">{category.name}</span>
                </Link>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-transparent transition-colors group-hover:border-purple-400"
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
