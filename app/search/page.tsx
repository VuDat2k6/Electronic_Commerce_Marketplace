import { ProductItem, SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import { Search, Package } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

// sending api request for search results for a given search text
const SearchPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  let products = [];

  try {
    const data = await apiClient.get(
      `/api/search?query=${sp?.search || ""}`
    );

    if (!data.ok) {
      console.error('Failed to fetch search results:', data.statusText);
      products = [];
    } else {
      const result = await data.json();
      // Handle both array and object response formats
      if (Array.isArray(result)) {
        products = result;
      } else if (result && typeof result === 'object') {
        // New format: { products: [...], count: number, query: string }
        products = result.products || [];
      } else {
        products = [];
      }
    }
  } catch (error) {
    console.error('Error fetching search results:', error);
    products = [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SectionTitle title="Search" path={`Home | Search | ${sp?.search || 'All Products'}`} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        {sp?.search && (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Search results for <span className="text-purple-600">&quot;{sanitize(sp?.search)}&quot;</span>
            </h2>
            <p className="text-gray-500 mt-2">{products.length} products found</p>
          </div>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductItem key={product.id} product={product} color="black" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {sp?.search
                ? "No products match your search. Try different keywords or browse our categories."
                : "Start typing to search for products."}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-full hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg"
            >
              <Package className="w-4 h-4" />
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
