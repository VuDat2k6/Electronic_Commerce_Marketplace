// ProductsSectionWrapper - Server component wrapper for ProductsSection
// Fetches data on the server and passes it to the client component

import React from "react";
import ProductsSection from "./ProductsSection";
import apiClient from "@/lib/api";

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  mainImage: string;
  rating?: number;
  inStock?: number;
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const data = await apiClient.get("/api/products?page=1&limit=4");
    if (data.ok) {
      const result = await data.json();
      return Array.isArray(result) ? result.slice(0, 4) : [];
    }
  } catch (error) {
    console.error("Error fetching featured products:", error);
  }
  return [];
}

export async function ProductsSectionWrapper() {
  const products = await getFeaturedProducts();

  return (
    <ProductsSection products={products} />
  );
}
