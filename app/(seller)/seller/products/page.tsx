"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

interface SellerProduct extends Product {
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

/**
 * Render the authenticated seller's product management page with controls to add, edit, and delete products.
 *
 * The component loads the current seller's products, displays a table with product details and stock badges,
 * shows a loading state and an empty-state message when appropriate, and provides an "Add Product" link.
 * It performs network requests to fetch and delete products and shows toast notifications for success or failure.
 *
 * @returns The JSX element for the seller's product management page
 */
export default function SellerProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as any)?.id;

  const fetchProducts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/seller/products?sellerId=${userId}`);
      if (!res.ok) {
        throw new Error("Unable to load products");
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      toast.error("Unable to load products");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = async (id: string) => {
    if (!confirm("Remove this product from sale? Existing order history will be preserved.")) return;
    try {
      const res = await apiClient.delete(`/api/seller/products/${id}`);
      const data = res.status === 204 ? null : await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Unable to remove product");

      toast.success(data?.archived ? "Product removed from sale. Existing orders are preserved." : "Product deleted successfully");
      fetchProducts();
    } catch {
      toast.error("Unable to remove product");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Link
          href="/seller/products/new"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          You don&apos;t have any products yet. {" "}
          <Link href="/seller/products/new" className="text-green-600 underline">
            Add one now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Product Name</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Price</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Stock</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="py-4 px-4">{product.title}</td>
                  <td className="py-4 px-4 text-gray-500">{product.category?.name || "—"}</td>
                  <td className="py-4 px-4">{product.price.toLocaleString("vi-VN")} VND</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        product.inStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.inStock > 0 ? `${product.inStock} left` : "Out of stock"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.status === "ARCHIVED"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {product.status || "PUBLISHED"}
                    </span>
                  </td>
                  <td className="py-4 px-4 flex gap-3">
                    <Link
                      href={`/seller/products/${product.id}`}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Edit
                    </Link>
                    {product.status !== "ARCHIVED" && (
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
