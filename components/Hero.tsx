// Hero component - Enhanced with smooth animations
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-cyan-500">
      {/* Atmospheric background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            className="space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm"
            >
              <motion.span
                className="w-2 h-2 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span>TFDTRONIC - New Technology 2026</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
            >
              Electronic Devices
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300">
                Authentic Products
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg text-purple-100 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Explore our collection of high-tech electronic devices at competitive prices. 
              Official warranty and fast nationwide delivery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors shadow-lg hover:shadow-xl"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Shop Now
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/become-seller"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  Become a Seller
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right: Visual */}
          <div className="hidden lg:block relative">
            <div className="relative w-full aspect-square">
              <motion.div
                className="absolute top-1/4 right-0 bg-white rounded-2xl p-4 shadow-2xl"
                initial={{ opacity: 0, rotate: 3, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 3, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ rotate: 0, scale: 1.05 }}
                style={{ transition: "all 0.3s ease" }}
              >
                <div className="w-48 h-48 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-xl flex items-center justify-center">
                  <svg className="w-20 h-20 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-gray-800">Camera IP 4K</p>
                  <p className="text-purple-600 font-bold">$2,990.00</p>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-1/4 left-0 bg-white rounded-2xl p-4 shadow-2xl"
                initial={{ opacity: 0, rotate: -3, scale: 0.8 }}
                animate={{ opacity: 1, rotate: -3, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                whileHover={{ rotate: 0, scale: 1.05 }}
                style={{ transition: "all 0.3s ease" }}
              >
                <div className="w-40 h-40 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-gray-800">Smart Lock</p>
                  <p className="text-purple-600 font-bold">$4,500.00</p>
                </div>
              </motion.div>

              {/* Floating decoration */}
              <motion.div
                className="absolute top-1/3 left-1/4 w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full opacity-20 blur-xl"
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full opacity-20 blur-xl"
                animate={{
                  y: [0, 15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z" fill="#f9fafb"/>
        </svg>
      </motion.div>
    </section>
  );
};

export default Hero;
