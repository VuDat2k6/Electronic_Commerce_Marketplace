"use client";

import { motion } from 'framer-motion';

export function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
          {/* Image skeleton */}
          <div className="relative aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />

          {/* Content skeleton */}
          <div className="p-5 space-y-3">
            {/* Title skeleton */}
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-5 bg-gray-200 rounded w-1/2" />

            {/* Rating skeleton */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="w-4 h-4 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>

            {/* Price skeleton */}
            <div className="flex items-baseline gap-2">
              <div className="h-8 bg-gray-200 rounded w-28" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>

            {/* Button skeleton */}
            <div className="h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductsLoadingSkeleton;
