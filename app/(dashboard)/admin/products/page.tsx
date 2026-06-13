"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { formatCategoryName } from "../../../../utils/categoryFormating";
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink, PackageSearch, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface ModerationProduct {
  id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  inStock: number;
  price: number;
  manufacturer?: string;
  category?: { name?: string };
  seller?: { shopName?: string | null; email?: string };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusStyle: Record<ProductStatus, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-amber-50 text-amber-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const formatPrice = (price: number) => `${price.toLocaleString("vi-VN")} VND`;

export default function AdminProductModerationPage() {
  const [products, setProducts] = useState<ModerationProduct[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ProductStatus>("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        mode: "admin",
        page: String(page),
        limit: "15",
      });
      if (query) params.set("search", query);
      if (status !== "ALL") params.set("status", status);

      const response = await apiClient.get(`/api/products?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load moderation queue");

      const data = await response.json();
      setProducts(Array.isArray(data?.products) ? data.products : []);
      setPagination(data?.pagination || { page, limit: 15, total: 0, totalPages: 1 });
    } catch (requestError) {
      console.error("Error loading product moderation data:", requestError);
      setProducts([]);
      setError("Unable to load product listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const counts = useMemo(() => ({
    published: products.filter((product) => product.status === "PUBLISHED").length,
    draft: products.filter((product) => product.status === "DRAFT").length,
    archived: products.filter((product) => product.status === "ARCHIVED").length,
  }), [products]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col bg-gray-50 xl:flex-row">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:p-8">
        <header className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase text-purple-600">Marketplace Compliance</p>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Product Moderation</h1>
          <p className="mt-1 text-sm text-gray-500">Review seller listings and issue compliance warnings.</p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Moderation listing metrics">
          <Metric label="Matching listings" value={pagination.total} tone="text-gray-900" />
          <Metric label="Published on page" value={counts.published} tone="text-emerald-700" />
          <Metric label="Draft on page" value={counts.draft} tone="text-amber-700" />
          <Metric label="Archived on page" value={counts.archived} tone="text-gray-600" />
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-purple-600" />
              <div>
                <h2 className="font-semibold text-gray-900">Listing review queue</h2>
                <p className="text-sm text-gray-500">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder="Search product or brand"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                />
              </label>
              <select
                value={status}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value as "ALL" | ProductStatus);
                }}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                aria-label="Filter listing status"
              >
                <option value="ALL">All status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <button type="submit" className="h-10 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-700">
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <TableLoading />
          ) : error ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
              <p className="text-sm text-gray-600">{error}</p>
              <button type="button" onClick={loadProducts} className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <PackageSearch className="mx-auto mb-3 h-9 w-9 text-gray-300" />
              <p className="font-medium text-gray-800">No listings match this review filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-gray-50">
                  <tr>
                    <HeaderCell>Listing</HeaderCell>
                    <HeaderCell>Seller</HeaderCell>
                    <HeaderCell>Category</HeaderCell>
                    <HeaderCell>Price</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                    <HeaderCell className="text-right">Action</HeaderCell>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="transition hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{product.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{product.manufacturer || product.slug}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{product.seller?.shopName || "Unnamed shop"}</p>
                        <p className="text-xs text-gray-500">{product.seller?.email || "-"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm capitalize text-gray-600">
                        {formatCategoryName(product.category?.name || "uncategorized")}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-800">{formatPrice(product.price)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[product.status] || statusStyle.DRAFT}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                        >
                          Review
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
              <p className="text-sm text-gray-500">{pagination.total} matching listings</p>
              <div className="flex gap-2">
                <PaginationButton label="Previous" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </PaginationButton>
                <PaginationButton label="Next" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </PaginationButton>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
      <p className={`mt-3 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function HeaderCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500 ${className}`}>{children}</th>;
}

function TableLoading() {
  return (
    <div className="animate-pulse space-y-4 p-5">
      {[1, 2, 3, 4].map((row) => <div key={row} className="h-10 rounded bg-gray-100" />)}
    </div>
  );
}

function PaginationButton({ children, label, disabled, onClick }: { children: ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
