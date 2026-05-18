"use client";

import { Star, ShoppingCart, Heart, X, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, memo, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useProductStore } from '@/app/_zustand/store';
import { useWishlistStore } from '@/app/_zustand/wishlistStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

function ProductItemComponent({ product, index = 0 }: ProductItemProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Store connections with specific selectors
  const addToCart = useProductStore((state) => state.addToCart);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  // Check if product is in wishlist
  const isWishlisted = isInWishlist(product.id);

  // Memoized calculations
  const originalPrice = useMemo(() => {
    return product.originalPrice || (product.price > 500000 ? product.price * 1.15 : undefined);
  }, [product.originalPrice, product.price]);

  const discount = useMemo(() => {
    return originalPrice
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0;
  }, [originalPrice, product.price]);

  const showHotBadge = product.badge === 'HOT' || (product.inStock && product.inStock < 10);

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + '₫';
  };

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.mainImage,
      slug: product.slug,
      amount: 1,
      sellerId: product.sellerId || product.merchantId,
    });

    toast.success(`${product.title} added to cart!`);
  }, [product, addToCart]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.mainImage,
        slug: product.slug,
      });
      toast.success('Added to wishlist');
    }
  }, [product, isWishlisted, addToWishlist, removeFromWishlist]);

  // Quick View Logic
  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  return (
    <>
      <Link href={`/product/${product.slug}`} className="block h-full">
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border h-full flex flex-col">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {/* Image */}
            <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <Image
                src={product.mainImage}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
            
            {/* Skeleton */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* Badges */}
            {showHotBadge && (
              <Badge className="absolute top-2 left-2 bg-destructive">
                HOT
              </Badge>
            )}

            {discount > 0 && (
              <Badge className="absolute top-2 right-2 bg-green-600">
                -{discount}%
              </Badge>
            )}

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-lg"
                  onClick={handleWishlist}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-lg"
                  onClick={handleAddToCart}
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="secondary"
                className="w-full mt-2 shadow-lg opacity-90 hover:opacity-100"
                onClick={handleQuickView}
              >
                Quick View
              </Button>
            </div>
          </div>

          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
              {product.title}
            </h3>

            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < (product.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">({product.reviews || 0})</span>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <span className="font-bold text-lg">{formatPrice(product.price)}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>

      {/* Quick View Modal */}
      <AnimatePresence>
        {isQuickViewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsQuickViewOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh]"
            >
              <button
                onClick={() => setIsQuickViewOpen(false)}
                className="absolute right-4 top-4 z-20 p-2 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full md:w-1/2 relative bg-gray-50 aspect-square md:aspect-auto md:min-h-[400px]">
                <Image
                  src={product.mainImage}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
                <div className="mb-4 flex flex-wrap gap-2">
                  {showHotBadge && <Badge variant="destructive">HOT</Badge>}
                  {discount > 0 && <Badge className="bg-green-600">SALE {discount}%</Badge>}
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  {product.title}
                </h2>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{product.rating || 0}</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-500">{product.reviews || 0} reviews</span>
                  {product.inStock && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-green-600 font-medium">{product.inStock} in stock</span>
                    </>
                  )}
                </div>

                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
                  {originalPrice && (
                    <span className="text-lg text-gray-400 line-through mb-1">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-8 line-clamp-4 leading-relaxed">
                  {product.description || "A premium electronic product from TFDTRONIC. Quality assured."}
                </p>

                <div className="mt-auto flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-white rounded-md transition-colors text-gray-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-white rounded-md transition-colors text-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <Button 
                      className="flex-1"
                      onClick={(e) => {
                        for(let i=0; i<quantity; i++) handleAddToCart(e);
                        setIsQuickViewOpen(false);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleWishlist}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export const ProductItem = memo(ProductItemComponent);
export default ProductItem;
