// WishItem - Clean, modern design
"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import { useState } from "react";

interface WishItemProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug?: string;
  stockAvailabillity?: number;
  onRemove?: () => void;
}

export default function WishItem({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
  onRemove,
}: WishItemProps) {
  const [isAdding, setIsAdding] = useState(false);
  const addToCart = useProductStore((state) => state.addToCart);
  const isOutOfStock = !stockAvailabillity || stockAvailabillity <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    addToCart({
      id,
      title,
      price,
      image,
      amount: 1,
      slug,
    });
    toast.success("Added to cart!");
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <Link href={`/product/${slug || id}`} className="flex-shrink-0">
        <Image
          width={80}
          height={80}
          src={image || "/product_placeholder.jpg"}
          alt={title || "Product"}
          className="w-20 h-20 rounded-xl object-cover"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/product/${slug || id}`}>
          <h3 className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2">{title}</h3>
        </Link>
        <p className="font-bold text-gray-900 mt-1">{(price || 0).toLocaleString('vi-VN')}₫</p>
        <p className={`text-xs mt-1 ${isOutOfStock ? "text-red-500" : "text-green-600"}`}>
          {isOutOfStock ? "Out of stock" : "In stock"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <ShoppingCart className="w-4 h-4" />
          {isAdding ? "Adding..." : "Add"}
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
