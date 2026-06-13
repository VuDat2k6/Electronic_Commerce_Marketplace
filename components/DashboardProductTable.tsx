"use client";

import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import { ArrowRight, Package, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type ModerationProduct = Product & {
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

const DashboardProductTable = () => {
  const [products, setProducts] = useState<ModerationProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/api/products?mode=admin", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setProducts(Array.isArray(data?.products) ? data.products : []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  const formatPrice = (price: number) =>
    price ? `${price.toLocaleString("vi-VN")} VND` : "-";

  const getImageSource = (mainImage?: string | null) => {
    if (!mainImage) return "/product_placeholder.jpg";
    if (mainImage.startsWith("/") || mainImage.startsWith("http")) return mainImage;
    return `/${mainImage}`;
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-12 rounded bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-16 rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 lg:text-3xl">Listing review</h1>
          <p className="mt-1 text-gray-500">{products.length} listings requiring oversight</p>
        </div>
        <ShieldAlert className="h-8 w-8 text-amber-600" />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Price</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            fill
                            src={getImageSource(product.mainImage)}
                            alt={sanitize(product.title) || "Product"}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="line-clamp-1 font-medium text-gray-900">{sanitize(product.title)}</p>
                          <p className="text-sm text-gray-500">
                            {sanitize(product.manufacturer) || "No manufacturer"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {product.status || "PUBLISHED"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.inStock ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
                          In stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{formatPrice(product.price)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50"
                      >
                        Review
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardProductTable;
