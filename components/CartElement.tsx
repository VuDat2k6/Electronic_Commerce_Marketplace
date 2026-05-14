// CartElement - Enhanced with smooth animations
"use client";
import Link from 'next/link';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCartShopping } from 'react-icons/fa6';
import { useProductStore } from "@/app/_zustand/store";

const CartElement = () => {
  const { allQuantity } = useProductStore();
  
  return (
    <Link href="/cart" className="relative group">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <FaCartShopping className="text-2xl text-black group-hover:text-purple-600 transition-colors duration-300" />
        
        {/* Cart Badge with Animation */}
        <AnimatePresence>
          {allQuantity > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-full flex justify-center items-center shadow-lg"
            >
              {allQuantity > 99 ? "99+" : allQuantity}
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
        Cart ({allQuantity})
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
      </motion.div>
    </Link>
  );
};

export default CartElement;
