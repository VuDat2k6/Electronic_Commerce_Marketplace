// ProductsSectionWrapper - Fetches and displays featured products

import { ProductsSection } from "./ProductsSection";
import { apiClient } from "@/lib/api";

interface FeaturedProductsResult {
  products: Product[];
  failed: boolean;
  status?: number;
}

/**
 * Fetches up to eight featured products from the products API.
 */
async function getFeaturedProducts(): Promise<FeaturedProductsResult> {
  try {
    const data = await apiClient.get("/api/products?page=1&limit=8");
    if (!data.ok) {
      console.error("Failed to fetch featured products:", data.status);
      return { products: [], failed: true, status: data.status };
    }

    const result = await data.json();
    if (Array.isArray(result)) return { products: result.slice(0, 8), failed: false };
    if (Array.isArray(result?.products)) return { products: result.products.slice(0, 8), failed: false };

    console.error("Unexpected featured products response format");
    return { products: [], failed: true };
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return { products: [], failed: true };
  }
}

/**
 * Renders the ProductsSection populated with featured products fetched from the server.
 *
 * @returns The rendered ProductsSection element populated with up to four featured products (empty list if none available).
 */
export async function ProductsSectionWrapper() {
  const { products, failed, status } = await getFeaturedProducts();

  return (
    <ProductsSection products={products} hasError={failed} errorStatus={status} />
  );
}

export default ProductsSectionWrapper;
