// Incentives - Exactly matching the zip file design
"use client";

import { Package, Headphones, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Package,
    title: 'Free Shipping',
    description: 'Our shipping is completely free and that is completely good for our customers.',
    color: 'from-blue-500 to-cyan-500',
    delay: 0,
  },
  {
    icon: Headphones,
    title: '24/7 Customer Support',
    description: 'Our support is working all day and night to answer any question you have.',
    color: 'from-purple-500 to-pink-500',
    delay: 0.2,
  },
  {
    icon: ShoppingCart,
    title: 'Fast Shopping Cart',
    description: 'We have super fast shopping experience and you will enjoy it.',
    color: 'from-orange-500 to-red-500',
    delay: 0.4,
  },
];

export function Incentives() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 via-purple-50 to-white relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.h2
          className="text-4xl font-extrabold text-center mb-4"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Why Shop With Us
        </motion.h2>

        <motion.p
          className="text-center text-gray-600 mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Experience the best online shopping with our amazing features
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="text-center group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: feature.delay }}
              >
                <motion.div
                  className="relative inline-block mb-6"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Animated ring */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-full blur-xl opacity-50`}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />

                  {/* Icon container */}
                  <div className={`relative w-24 h-24 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center shadow-2xl`}>
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                </motion.div>

                <motion.h3
                  className="text-2xl font-bold mb-4 group-hover:text-purple-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  {feature.title}
                </motion.h3>

                <motion.p
                  className="text-gray-600 leading-relaxed max-w-sm mx-auto"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: feature.delay + 0.2 }}
                >
                  {feature.description}
                </motion.p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Incentives;
