"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { ArrowLeft, FolderPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { convertCategoryNameToURLFriendly } from "../../../../../utils/categoryFormating";

export default function DashboardNewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const addNewCategory = async () => {
    if (!name.trim()) {
      toast.error("Enter a category name");
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post("/api/categories", {
        name: convertCategoryNameToURLFriendly(name.trim().toLowerCase()),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to create category");
      }
      toast.success("Category added successfully");
      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col bg-gray-50 xl:flex-row">
      <DashboardSidebar />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:p-8">
        <Link href="/admin/categories" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700">
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Link>
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase text-purple-600">Catalog Structure</p>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Add category</h1>
          <p className="mt-1 text-sm text-gray-500">Create a category for electronics product discovery and filters.</p>
        </div>

        <div className="max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <FolderPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">Category information</h2>
              <p className="text-sm text-gray-500">Names become clean storefront URL slugs.</p>
            </div>
          </div>
          <div className="p-6">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Category name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="For example: Smart Watches"
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
              <span className="mt-2 block text-xs text-gray-500">
                Storefront slug: /{name.trim() ? convertCategoryNameToURLFriendly(name.trim().toLowerCase()) : "category-name"}
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <Link href="/admin/categories" className="inline-flex h-11 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={addNewCategory}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create category
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
