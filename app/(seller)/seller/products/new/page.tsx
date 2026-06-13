"use client";

import React from "react";
import ProductForm from "../components/ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/seller/products" className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
          <p className="text-gray-500 mt-1">Fill in the details below to add a new product to your shop.</p>
        </div>
      </div>

      <ProductForm />
    </div>
  );
}
