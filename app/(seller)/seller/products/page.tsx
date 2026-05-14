"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

export default function SellerProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/seller/products?sellerId=${session.user.id}`);
      if (!res.ok) {
        throw new Error("Unable to load products");
      }
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      toast.error("Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [session?.user?.id]);

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await apiClient.request(`/api/seller/products/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ sellerId: session?.user?.id }),
        headers: { "Content-Type": "application/json" }
      } as any);
      if (res.status === 204) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Unable to delete product");
      }
    } catch {
      toast.error("Error deleting product");
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
          You don't have any products yet.{" "}
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
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="py-4 px-4">{product.title}</td>
                  <td className="py-4 px-4 text-gray-500">{product.category?.name || "—"}</td>
                  <td className="py-4 px-4">${product.price}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        product.inStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.inStock > 0 ? `${product.inStock} left` : "Out of stock"}
                    </span>
                  </td>
                  <td className="py-4 px-4 flex gap-3">
                    <Link
                      href={`/seller/products/${product.id}`}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
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