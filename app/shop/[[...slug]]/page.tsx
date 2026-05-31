export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Breadcrumb, Filters, MobileFilters, Pagination, Products, SortBy } from "@/components";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import { Package } from "lucide-react";
import apiClient from "@/lib/api";
import StorefrontLoadError from "@/components/StorefrontLoadError";

const improveCategoryText = (text: string): string => {
  const normalized = text.indexOf("-") !== -1 ? text.split("-").join(" ") : text;
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

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

const ShopPage = async ({ params, searchParams }: { 
  params: Promise<{ slug?: string[] }>, 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) => {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  
  const categoryName = awaitedParams?.slug && awaitedParams?.slug[0]?.length > 0
    ? sanitize(improveCategoryText(awaitedParams?.slug[0]))
    : "All Products";
  
  // Fetch products server-side
  let products: Product[] = [];
  let isLoading = true;
  let loadFailed = false;
  let loadErrorStatus: number | undefined;
  
  try {
    const getSearchParam = (value: string | string[] | undefined) =>
      Array.isArray(value) ? value[0] : value;

    const inStockNum = getSearchParam(awaitedSearchParams?.inStock) === "true" ? 1 : 0;
    const outOfStockNum = getSearchParam(awaitedSearchParams?.outOfStock) === "true" ? 1 : 0;
    const page = getSearchParam(awaitedSearchParams?.page)
      ? Number(getSearchParam(awaitedSearchParams?.page))
      : 1;

    let stockFilter = "";
    if (inStockNum === 1 && outOfStockNum === 0) {
      stockFilter = "&filters[inStock][$gt]=0";
    }
    if (inStockNum === 0 && outOfStockNum === 1) {
      stockFilter = "&filters[inStock][$equals]=0";
    }

    const categoryFilter =
      awaitedParams?.slug?.length && awaitedParams.slug.length > 0
        ? `&filters[category][$equals]=${encodeURIComponent(categoryName)}`
        : "";

    const price = getSearchParam(awaitedSearchParams?.price) || 80000000;
    const rating = Number(getSearchParam(awaitedSearchParams?.rating)) || 0;
    const sort = getSearchParam(awaitedSearchParams?.sort) || "";

    const apiUrl = `/api/products?filters[price][$lte]=${price}&filters[rating][$gte]=${rating}${stockFilter}${categoryFilter}&sort=${sort}&page=${page}`;
    const data = await apiClient.get(apiUrl);

    if (data.ok) {
      const result = await data.json();
      products = Array.isArray(result) ? result : [];
    } else {
      loadFailed = true;
      loadErrorStatus = data.status;
      console.error("Failed to fetch products:", data.status);
    }
  } catch (error) {
    loadFailed = true;
    console.error("Error fetching products:", error);
  } finally {
    isLoading = false;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-800">Filters</h2>
              </div>
              <Filters />
            </div>
          </aside>

          {/* Main Content */}
          <main>
            {/* Top Bar */}
            <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm px-6 py-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-800">
                    {categoryName}
                  </h1>
                  <p className="text-sm text-zinc-500 mt-1">
                    {isLoading ? "Loading..." : loadFailed ? "Products unavailable" : `${products.length} products`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <MobileFilters />
                  <SortBy />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6">
              {loadFailed ? (
                <StorefrontLoadError resource="products" status={loadErrorStatus} />
              ) : (
                <Products products={products} isLoading={isLoading} />
              )}
            </div>

            {/* Pagination */}
            {!loadFailed && (
              <div className="mt-6">
                <Pagination />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
