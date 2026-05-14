// ProductItem - Enhanced with smooth animations
"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useMemo, useState, useCallback } from "react";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { sanitize } from "@/lib/sanitize";
import { useProductStore } from "@/app/_zustand/store";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import toast from "react-hot-toast";

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  mainImage: string;
  rating?: number;
  inStock?: number;
  seller?: {
    shopName?: string;
  };
  merchant?: {
    name?: string;
  };
  merchantId?: string;
  sellerId?: string;
}

interface ProductItemProps {
  product: Product;
  color: string;
  index?: number;
}

const cardVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const ProductItem = memo(({ product, color, index = 0 }: ProductItemProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const addToCart = useProductStore((state) => state.addToCart);
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();

  const isInWishlist = wishlist.some((item) => item.id === product.id);
  const isOutOfStock = !product.inStock || product.inStock <= 0;

  const sellerInfo = useMemo(() => ({
    name: product.seller?.shopName || product.merchant?.name,
    id: product.sellerId || product.merchantId,
  }), [product.seller?.shopName, product.merchant?.name, product.sellerId, product.merchantId]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    setIsAdding(true);
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.mainImage,
      amount: 1,
      merchantId: sellerInfo.id,
      merchantName: sellerInfo.name,
      slug: product.slug,
    });
    toast.success("Added to cart!");
    setTimeout(() => setIsAdding(false), 500);
  }, [isOutOfStock, product, sellerInfo, addToCart]);

  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.mainImage,
        slug: product.slug,
      });
      toast.success("Added to wishlist!");
    }
  }, [isInWishlist, product, addToWishlist, removeFromWishlist]);

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-2xl hover:border-purple-200 transition-shadow duration-300 overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="block relative">
        <motion.div
          className="relative aspect-square overflow-hidden bg-gray-100"
          animate={{ scale: isHovered ? 1.02 : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Image
            src={product.mainImage || "/product_placeholder.jpg"}
            width={0}
            height={300}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-auto h-[300px] object-cover transition-transform duration-500 group-hover:scale-110"
            alt={sanitize(product.title) || "Product image"}
            unoptimized
          />
          
          {/* Wishlist Button */}
          <motion.button
            onClick={handleToggleWishlist}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className={`absolute top-3 right-3 p-2.5 rounded-full shadow-sm transition-all z-10 ${
              isInWishlist
                ? "bg-pink-500 text-white hover:bg-pink-600"
                : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-pink-500 hover:bg-white"
            }`}
          >
            <Heart className={`w-5 h-5 transition-transform duration-300 ${isInWishlist ? "scale-110 fill-current" : ""}`} />
          </motion.button>

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gray-900/40 flex items-center justify-center"
            >
              <span className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow-lg">
                Out of stock
              </span>
            </motion.div>
          )}

          {/* Sale Badge (if discount exists) */}
          {!isOutOfStock && product.inStock && product.inStock < 10 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-xs font-semibold rounded-md shadow-sm"
            >
              Only {product.inStock} left
            </motion.div>
          )}

          {/* Quick Add Button - Shows on Hover */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered && !isOutOfStock ? 1 : 0, y: isHovered && !isOutOfStock ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="absolute bottom-3 left-3 right-3 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-medium rounded-xl shadow-lg hover:from-purple-700 hover:to-cyan-600 transition-all disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {isAdding ? "Adding..." : "Quick Add"}
            </span>
          </motion.button>
        </motion.div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Seller */}
        {sellerInfo.name && sellerInfo.id && (
          <Link
            href={`/seller/${sellerInfo.id}`}
            className="inline-flex items-center gap-1.5 mb-2 text-xs text-gray-500 hover:text-purple-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>by {sellerInfo.name}</span>
          </Link>
        )}

        {/* Title */}
        <Link href={`/product/${product.slug}`}>
          <h3 className={`font-semibold line-clamp-2 hover:text-purple-600 transition-colors duration-300 ${
            color === "black" ? "text-gray-800" : "text-white"
          }`}>
            {sanitize(product.title)}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating !== undefined && product.rating > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + i * 0.05 }}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(product.rating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-200"
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.rating})</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price & Button */}
        <div className="mt-4 space-y-3">
          <p className={`text-xl font-bold ${
            color === "black" ? "text-purple-600" : "text-white"
          }`}>
            {formatPrice(product.price)}
          </p>
          
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={isOutOfStock || isAdding}
            onClick={handleAddToCart}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-medium rounded-xl hover:from-purple-700 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            {isAdding ? (
              <span className="flex items-center gap-2">
                <motion.svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </motion.svg>
                Adding...
              </span>
            ) : isOutOfStock ? (
              "Out of stock"
            ) : (
              "Add to Cart"
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

ProductItem.displayName = "ProductItem";

export default ProductItem;
