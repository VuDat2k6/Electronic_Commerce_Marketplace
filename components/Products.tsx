"use client";

import React from "react";
import Link from "next/link";
import ProductItem from "./ProductItem";
import { Package, Search, SlidersHorizontal } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  mainImage: string;
  rating?: number;
  inStock?: number;
  seller?: { shopName?: string };
  merchant?: { name?: string };
  merchantId?: string;
  sellerId?: string;
}

interface ProductsProps {
  products: Product[];
  isLoading?: boolean;
}

const ProductsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded w-1/3 mt-4" />
          <div className="h-10 bg-gray-200 rounded w-full mt-2" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ filtered = false }: { filtered?: boolean }) => (
  <div className="text-center py-16 px-4">
    <div className="w-24 h-24 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
      {filtered ? (
        <SlidersHorizontal className="w-12 h-12 text-purple-400" />
      ) : (
        <Package className="w-12 h-12 text-purple-400" />
      )}
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      {filtered ? "No products found" : "No products available"}
    </h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      {filtered
        ? "No products match your filters. Try adjusting your search criteria."
        : "Check back later to discover the latest products from our stores."}
    </p>
    {filtered && (
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        View All Products
      </Link>
    )}
  </div>
);

const Products = ({ products, isLoading = false }: ProductsProps) => {
  if (isLoading) {
    return <ProductsSkeleton />;
  }

  if (!products || products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductItem key={product.id} product={product} color="black" />
      ))}
    </div>
  );
};

export default Products;
