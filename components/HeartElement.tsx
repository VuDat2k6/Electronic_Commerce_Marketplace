// HeartElement - Enhanced with smooth animations
"use client";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import Link from "next/link";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart } from "react-icons/fa6";

const HeartElement = ({wishQuantity}: {wishQuantity: number}) => {
  return (
    <Link href="/wishlist" className="relative group">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <FaHeart className="text-2xl text-black group-hover:text-pink-500 transition-colors duration-300" />
        
        {/* Wishlist Badge with Animation */}
        <AnimatePresence>
          {wishQuantity > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs font-bold rounded-full flex justify-center items-center shadow-lg"
            >
              {wishQuantity > 99 ? "99+" : wishQuantity}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Hover Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none"
      >
        Wishlist ({wishQuantity})
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
      </motion.div>
    </Link>
  );
};

export default HeartElement;
