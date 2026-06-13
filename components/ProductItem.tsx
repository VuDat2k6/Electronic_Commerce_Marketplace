// ProductItem - Premium UX with full functionality
"use client";

import { Star, ShoppingCart, Heart, X, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useProductStore } from '@/app/_zustand/store';
import { useWishlistStore } from '@/app/_zustand/wishlistStore';
import { useSession } from 'next-auth/react';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number;
  mainImage: string;
  rating?: number;
  reviews?: number;
  inStock?: number;
  badge?: string;
  description?: string;
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
  index?: number;
}

export function ProductItem({ product, index = 0 }: ProductItemProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  // Store connections
  const { addToCart } = useProductStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { data: session, status } = useSession();
  const router = useRouter();
  const actionsDisabled = !isInteractive || status === 'loading';

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  // Check if product is in wishlist
  const isWishlisted = isInteractive ? isInWishlist(product.id) : false;

  // Calculate discount
  const originalPrice = product.originalPrice || (product.price > 500000 ? product.price * 1.15 : undefined);
  const discount = originalPrice
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + '₫';
  };

  // Show badges
  const showHotBadge = product.badge === 'HOT' || (product.inStock && product.inStock < 10);
  const showNewBadge = product.badge === 'NEW' && !showHotBadge;

  // Handle add to cart
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      toast.error('Please login to add to cart');
      router.push(`/login?callbackUrl=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }

    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.mainImage,
      slug: product.slug,
      amount: 1,
      sellerId: product.sellerId || product.merchantId,
      sellerName: product.seller?.shopName || product.merchant?.name,
    });

    toast.success(`${product.title} added to cart!`, {
      duration: 3000,
      position: 'bottom-right',
      style: {
        background: 'linear-gradient(to right, #9333ea, #ec4899)',
        color: 'white',
        borderRadius: '12px',
        padding: '12px 16px',
      },
    });
  }, [product, addToCart, router, session?.user]);

  // Handle wishlist toggle
  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      toast.error('Please login to add to wishlist');
      router.push(`/login?callbackUrl=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist', {
        duration: 2000,
        position: 'bottom-right',
      });
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.mainImage,
        slug: product.slug,
        sellerId: product.sellerId || product.merchantId,
        sellerName: product.seller?.shopName || product.merchant?.name,
      });
      toast.success(`${product.title} added to wishlist!`, {
        duration: 2000,
        position: 'bottom-right',
        style: {
          background: '#22c55e',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px',
        },
      });
    }
  }, [product, isWishlisted, addToWishlist, removeFromWishlist, router, session?.user]);

  // Handle quick view
  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
    setQuantity(1);
  }, []);

  // Handle quantity change
  const incrementQuantity = () => setQuantity(q => Math.min(q + 1, product.inStock || 99));
  const decrementQuantity = () => setQuantity(q => Math.max(q - 1, 1));

  return (
    <>
      <motion.div
        className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group relative"
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        layout
      >
        <Link href={`/product/${product.slug}`} className="block">
          {/* Image section */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
            {/* Skeleton loader */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}

            <Image
              src={product.mainImage || "/product_placeholder.jpg"}
              alt={product.title}
              fill
              className={`object-cover transition-all duration-500 group-hover:scale-110 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsImageLoaded(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />

            {/* Badges */}
            {showHotBadge && (
              <motion.span
                className="absolute left-3 top-14 z-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                HOT
              </motion.span>
            )}

            {showNewBadge && (
              <motion.span
                className="absolute left-3 top-14 z-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                NEW
              </motion.span>
            )}

            {discount > 0 && (
              <motion.span
                className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                -{discount}%
              </motion.span>
            )}

            {/* Wishlist button */}
            <motion.button
              disabled={actionsDisabled}
              className={`absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all duration-200 ${
                isWishlisted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } disabled:cursor-wait`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlist}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600 hover:text-red-500'
                }`}
              />
            </motion.button>

            {/* Quick view overlay */}
            <motion.div
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20"
            >
              <motion.button
                disabled={actionsDisabled}
                className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold shadow-xl disabled:cursor-wait disabled:opacity-60"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleQuickView}
                aria-label="Quick view"
              >
                Quick View
              </motion.button>
            </motion.div>
          </div>
        </Link>

        {/* Content section */}
        <div className="p-5">
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 min-h-[3rem] group-hover:text-purple-600 transition-colors">
              {product.title}
            </h3>
          </Link>

          {/* Rating */}
          {product.rating !== undefined && product.rating > 0 && (
            <div className="flex items-center gap-2 mb-3" role="img" aria-label={`Rating: ${product.rating} out of 5 stars`}>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.05 + i * 0.02 }}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                ({product.reviews || product.rating})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatPrice(product.price)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <motion.button
            disabled={actionsDisabled}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg transition-all duration-300 disabled:cursor-wait disabled:opacity-60"
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(147, 51, 234, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            aria-label={`Add ${product.title} to cart`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Add to Cart</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {isQuickViewOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsQuickViewOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                onClick={() => setIsQuickViewOpen(false)}
                aria-label="Close quick view"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
                {/* Product Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={product.mainImage || "/product_placeholder.jpg"}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                  {/* Badges */}
                  <div className="flex gap-2 mb-4">
                    {showHotBadge && (
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        HOT
                      </span>
                    )}
                    {showNewBadge && (
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        NEW
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.title}
                  </h2>

                  {/* Rating */}
                  {product.rating !== undefined && product.rating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {product.rating} ({product.reviews || 0} reviews)
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatPrice(product.price)}
                    </span>
                    {originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-gray-600 mb-6 line-clamp-3">
                      {product.description}
                    </p>
                  )}

                  {/* Quantity selector */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        className="p-2 hover:bg-gray-100 transition-colors"
                        onClick={decrementQuantity}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold">{quantity}</span>
                      <button
                        className="p-2 hover:bg-gray-100 transition-colors"
                        onClick={incrementQuantity}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-auto">
                    <motion.button
                      disabled={actionsDisabled}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg disabled:cursor-wait disabled:opacity-60"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!session?.user) {
                          toast.error('Please login to add to cart');
                          router.push(`/login?callbackUrl=${encodeURIComponent(`/product/${product.slug}`)}`);
                          return;
                        }
                        for (let i = 0; i < quantity; i++) {
                          addToCart({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            image: product.mainImage,
                            slug: product.slug,
                            amount: 1,
                            sellerId: product.sellerId || product.merchantId,
                            sellerName: product.seller?.shopName || product.merchant?.name,
                          });
                        }
                        toast.success(`${quantity}x ${product.title} added to cart!`, {
                          duration: 3000,
                          position: 'bottom-right',
                        });
                        setIsQuickViewOpen(false);
                      }}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </motion.button>

                    <motion.button
                      disabled={actionsDisabled}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isWishlisted
                          ? 'border-red-500 bg-red-50 text-red-500'
                          : 'border-gray-300 hover:border-red-500 hover:bg-red-50'
                      } disabled:cursor-wait disabled:opacity-60`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWishlist}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ProductItem;
