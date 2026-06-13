"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { ArrowLeft, FolderCog, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { convertCategoryNameToURLFriendly, formatCategoryName } from "../../../../../utils/categoryFormating";

export default function DashboardSingleCategory() {
  const id = useParams().id as string;
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const response = await apiClient.get(`/api/categories/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load category");
        const category = await response.json();
        setName(formatCategoryName(category?.name || ""));
      } catch {
        toast.error("Unable to load category details");
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id]);

  const updateCategory = async () => {
    if (!name.trim()) {
      toast.error("Enter a category name");
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.put(`/api/categories/${id}`, {
        name: convertCategoryNameToURLFriendly(name.trim().toLowerCase()),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to update category");
      }
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update category");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!window.confirm("Delete this category? This is only allowed when no products use it.")) return;
    setDeleting(true);
    try {
      const response = await apiClient.delete(`/api/categories/${id}`);
      if (response.status !== 204) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to delete category");
      }
      toast.success("Category deleted successfully");
      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete category");
      setDeleting(false);
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
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Category details</h1>
          <p className="mt-1 text-sm text-gray-500">Rename a storefront taxonomy entry or remove an unused one.</p>
        </div>

        <div className="max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <FolderCog className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">Manage category</h2>
              <p className="text-sm text-gray-500">Updates appear in the shop filter and product forms.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading category...
            </div>
          ) : (
            <>
              <div className="space-y-5 p-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Category name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                  <span className="mt-2 block text-xs text-gray-500">
                    Storefront slug: /{name.trim() ? convertCategoryNameToURLFriendly(name.trim().toLowerCase()) : "category-name"}
                  </span>
                </label>
                <div className="flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  A category cannot be deleted while products are assigned to it. Reassign products first.
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={deleting || saving}
                  onClick={deleteCategory}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete category
                </button>
                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={updateCategory}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
