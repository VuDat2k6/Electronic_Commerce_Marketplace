"use client";

import React, { useEffect, useState, use } from "react";
import ProductForm from "../components/ProductForm";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We need to fetch the specific product details
    // But since the API /api/seller/products might return an array, we can find it
    // Wait, let's fetch all seller products and filter, or fetch the specific one if the API supports it.
    // The backend `GET /api/seller/products` returns the seller's products. We can filter it here.
    apiClient.get("/api/seller/products")
      .then(res => res.json())
      .then(data => {
        const productsArray = data.products || [];
        if (Array.isArray(productsArray)) {
          const found = productsArray.find((p: any) => p.id === id);
          if (found) {
            setProduct(found);
          } else {
            toast.error("Product not found");
          }
        }
      })
      .catch(err => {
        console.error(err);
        toast.error("Error loading product");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Product Not Found</h2>
        <p className="text-gray-500 mt-2 mb-6">The product you are trying to edit does not exist or you do not have permission.</p>
        <Link href="/seller/products" className="text-green-600 hover:underline">
          &larr; Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/seller/products" className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 mt-1">Update the details of your product.</p>
        </div>
      </div>

      <ProductForm initialData={product} isEditing={true} />
    </div>
  );
}
