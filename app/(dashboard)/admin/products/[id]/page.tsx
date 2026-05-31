"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { formatCategoryName } from "../../../../../utils/categoryFormating";
import { AlertTriangle, ArrowLeft, BellRing, ClipboardCheck, Loader2, Package, ShieldAlert, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import toast from "react-hot-toast";

type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type WarningPriority = "NORMAL" | "HIGH" | "URGENT";

interface ModerationProduct {
  id: string;
  title: string;
  slug: string;
  mainImage: string;
  price: number;
  description: string;
  manufacturer: string;
  inStock: number;
  status: ProductStatus;
  category?: { name?: string };
  seller?: { id: string; email: string; shopName?: string | null; shopStatus?: string };
  _count?: { orderItems: number; subOrderProducts: number; reviews: number };
}

const violationOptions = [
  { value: "POLICY_VIOLATION", label: "Policy violation" },
  { value: "MISLEADING_INFORMATION", label: "Misleading information" },
  { value: "COUNTERFEIT_RISK", label: "Counterfeit risk" },
  { value: "PROHIBITED_ITEM", label: "Prohibited item" },
  { value: "IMAGE_OR_BRAND_MISUSE", label: "Image or brand misuse" },
  { value: "OTHER", label: "Other compliance issue" },
];

const statusStyle: Record<ProductStatus, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-amber-50 text-amber-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const resolveImage = (image?: string) => {
  if (!image) return "/product_placeholder.jpg";
  return image.startsWith("http") || image.startsWith("/") ? image : `/${image}`;
};

export default function AdminProductReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ModerationProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [violationType, setViolationType] = useState("POLICY_VIOLATION");
  const [priority, setPriority] = useState<WarningPriority>("HIGH");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await apiClient.get(`/api/products/moderation/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load product review");
        setProduct(await response.json());
      } catch {
        toast.error("Unable to load product review");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const sendWarning = async () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < 10) {
      setReasonError("Enter at least 10 characters so the seller understands what must be fixed.");
      toast.error("Provide at least 10 characters describing the violation");
      return;
    }

    setReasonError("");
    setSending(true);
    try {
      const response = await apiClient.post(`/api/products/moderation/${id}/warnings`, {
        violationType,
        priority,
        reason: trimmedReason,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to send warning");

      toast.success(data.message || "Compliance warning sent to seller");
      setReason("");
      setReasonError("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send warning");
    } finally {
      setSending(false);
    }
  };

  const referencedOrders = (product?._count?.orderItems || 0) + (product?._count?.subOrderProducts || 0);

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col bg-gray-50 xl:flex-row">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:p-8">
        <Link href="/admin/products" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700">
          <ArrowLeft className="h-4 w-4" />
          Back to moderation
        </Link>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading listing...
          </div>
        ) : !product ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-600">Listing not available.</div>
        ) : (
          <>
            <header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-purple-600">Compliance Review</p>
                <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">{product.title}</h1>
                <p className="mt-1 text-sm text-gray-500">{product.manufacturer} / {formatCategoryName(product.category?.name || "uncategorized")}</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle[product.status]}`}>
                {product.status}
              </span>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className="space-y-5">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr]">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
                      <Image src={resolveImage(product.mainImage)} alt={product.title} fill className="object-contain p-2" sizes="180px" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-2xl font-bold text-gray-900">{product.price.toLocaleString("vi-VN")} VND</p>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <Fact label="Stock" value={`${product.inStock} units`} icon={Package} />
                        <Fact label="Reviews" value={String(product._count?.reviews || 0)} icon={ClipboardCheck} />
                        <Fact label="Order references" value={String(referencedOrders)} icon={AlertTriangle} />
                        <Fact label="Slug" value={product.slug} icon={ShieldAlert} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 p-5">
                    <h2 className="mb-2 text-sm font-semibold text-gray-900">Listing description</h2>
                    <p className="whitespace-pre-line text-sm leading-6 text-gray-600">{product.description || "No description supplied."}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                    <Store className="h-5 w-5 text-purple-600" />
                    Seller account
                  </h2>
                  <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <Definition label="Shop" value={product.seller?.shopName || "Unnamed shop"} />
                    <Definition label="Email" value={product.seller?.email || "-"} />
                    <Definition label="Approval" value={product.seller?.shopStatus || "-"} />
                  </dl>
                </div>
              </section>

              <section className="h-fit overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                    <BellRing className="h-5 w-5 text-red-600" />
                    Issue compliance warning
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">The seller receives a system alert for this listing.</p>
                </div>
                <div className="space-y-4 p-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">Violation category</span>
                    <select
                      value={violationType}
                      onChange={(event) => setViolationType(event.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    >
                      {violationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">Priority</span>
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as WarningPriority)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">Reason and required action</span>
                    <textarea
                      value={reason}
                      onChange={(event) => {
                        setReason(event.target.value);
                        if (reasonError && event.target.value.trim().length >= 10) {
                          setReasonError("");
                        }
                      }}
                      rows={6}
                      maxLength={1000}
                      placeholder="Describe the policy issue and what the seller must correct."
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                        reasonError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-200 focus:border-purple-400 focus:ring-purple-100"
                      }`}
                      aria-invalid={Boolean(reasonError)}
                      aria-describedby="warning-reason-help"
                    />
                    <div id="warning-reason-help" className="mt-1 flex items-center justify-between gap-3 text-xs">
                      <span className={reasonError ? "text-red-600" : "text-gray-500"}>
                        {reasonError || "Minimum 10 characters. Include the issue and required seller action."}
                      </span>
                      <span className="shrink-0 text-gray-400">{reason.trim().length}/1000</span>
                    </div>
                  </label>
                </div>
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={sendWarning}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                    Send warning to seller
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Fact({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Package }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-gray-500"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 truncate font-medium text-gray-800" title={value}>{value}</p>
    </div>
  );
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="mt-1 truncate font-medium text-gray-800" title={value}>{value}</dd>
    </div>
  );
}
