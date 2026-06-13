"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { formatCategoryName } from "../../../../utils/categoryFormating";
import { AlertCircle, ChevronRight, FolderTree, Plus, Search, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Category {
  id: string;
  name: string;
}

export default function DashboardCategory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get("/api/categories", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch categories");

        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (requestError) {
        console.error("Error fetching categories:", requestError);
        setCategories([]);
        setError("Unable to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCategories = useMemo(
    () => categories.filter((category) => formatCategoryName(category.name).toLowerCase().includes(normalizedQuery)),
    [categories, normalizedQuery],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col bg-gray-50 xl:flex-row">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:p-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-purple-600">Catalog Structure</p>
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Categories</h1>
            <p className="mt-1 text-sm text-gray-500">Manage electronics taxonomy used across shopping and seller listings.</p>
          </div>
          <Link
            href="/admin/categories/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <Plus className="h-4 w-4" />
            Add category
          </Link>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2" aria-label="Category metrics">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Active categories</p>
              <FolderTree className="h-5 w-5 text-purple-600" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{categories.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Matching results</p>
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{filteredCategories.length}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Category directory</h2>
              <p className="text-sm text-gray-500">Keep storefront filters consistent with the catalog.</p>
            </div>
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search categories"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />
            </label>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4 p-5">
              {[1, 2, 3, 4].map((row) => <div key={row} className="h-10 rounded bg-gray-100" />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <FolderTree className="mx-auto mb-3 h-9 w-9 text-gray-300" />
              <p className="font-medium text-gray-800">{categories.length === 0 ? "No categories created" : "No matching categories"}</p>
              <p className="mt-1 text-sm text-gray-500">
                {categories.length === 0 ? "Create an electronics category to organize products." : "Try another search keyword."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">Storefront slug</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="transition hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                            <Tag className="h-4 w-4" />
                          </span>
                          <p className="font-medium capitalize text-gray-900">{formatCategoryName(category.name)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">/{category.name}</code>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/categories/${category.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                        >
                          Details
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
