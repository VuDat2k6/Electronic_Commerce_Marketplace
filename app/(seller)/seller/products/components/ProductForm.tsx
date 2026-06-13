"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    price: initialData?.price?.toString() || "",
    manufacturer: initialData?.manufacturer || "",
    inStock: initialData?.inStock?.toString() || "0",
    categoryId: initialData?.categoryId || "",
    description: initialData?.description || "",
    mainImage: initialData?.mainImage || "",
  });

  useEffect(() => {
    // Fetch categories
    apiClient.get("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => {
        console.error("Failed to load categories", err);
        toast.error("Failed to load categories");
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSlugify = () => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("You must be logged in to do this");
      return;
    }

    const price = Number(formData.price);
    const inStock = Number(formData.inStock);

    if (!Number.isInteger(price) || price <= 0) {
      toast.error("Price must be a positive whole VND amount");
      return;
    }

    if (!Number.isInteger(inStock) || inStock < 0) {
      toast.error("Stock quantity must be a non-negative whole number");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price,
        inStock,
      };

      let res;
      if (isEditing && initialData?.id) {
        res = await apiClient.put(`/api/seller/products/${initialData.id}`, payload);
      } else {
        res = await apiClient.post("/api/seller/products", payload);
      }

      if (res.ok) {
        toast.success(isEditing ? "Product updated successfully" : "Product created successfully");
        router.push("/seller/products");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save product");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleSlugify}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. iPhone 15 Pro Max"
            />
          </div>

          {/* Slug */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL friendly) *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. iphone-15-pro-max"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (VND) *</label>
            <input
              type="number"
              name="price"
              step="1"
              value={formData.price}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. 27990000"
            />
          </div>

          {/* In Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
            <input
              type="number"
              name="inStock"
              value={formData.inStock}
              onChange={handleChange}
              required
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="">Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. Apple"
            />
          </div>

          {/* Main Image URL */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Image URL</label>
            <input
              type="url"
              name="mainImage"
              value={formData.mainImage}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Description */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe your product here..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
