// *********************
// Role of the component: Single product tabs on the single product page containing product description, main product info and reviews
// Name of the component: ProductTabs.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <ProductTabs product={product} />
// Input parameters: { product: Product }
// Output: Single product tabs containing product description, main product info and reviews
// *********************

"use client";

import React, { useState } from "react";
import { formatCategoryName } from "@/utils/categoryFormating";
import { sanitize, sanitizeHtml } from "@/lib/sanitize";
import { BadgeCheck, PackageCheck, RotateCcw, ShieldCheck, Star, Truck, Zap } from "lucide-react";
import AddReviewForm from "./AddReviewForm";

interface ProductReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: { email?: string | null };
}

interface ProductReviewsData {
  reviews?: ProductReview[];
  pagination?: { total?: number };
  stats?: {
    averageRating?: number;
    avgRating?: number;
    totalReviews?: number;
    distribution?: Record<string, number>;
  };
}

const ProductTabs = ({
  product,
  reviewsData,
}: {
  product: any;
  reviewsData?: ProductReviewsData;
}) => {
  const [currentProductTab, setCurrentProductTab] = useState<number>(0);
  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.pagination?.total || reviewsData?.stats?.totalReviews || reviews.length;
  const averageRating = reviewsData?.stats?.averageRating || reviewsData?.stats?.avgRating || product?.rating || 0;
  const distribution = reviewsData?.stats?.distribution || {};
  const tabs = ["Description", "Specifications", `Reviews (${totalReviews})`];

  const productCategory = product?.category?.name
    ? sanitize(formatCategoryName(product.category.name))
    : "Electronics";
  const sellerName = product?.seller?.shopName || product?.seller?.email || "Verified seller";
  const stockLabel = product?.inStock > 0 ? `${product.inStock} units available` : "Currently out of stock";
  const sku = `PROD-${product?.id?.slice(0, 8) || "00000000"}`;
  const descriptionHtml = sanitizeHtml(product?.description || "");

  const highlights = [
    {
      icon: BadgeCheck,
      title: "Authentic marketplace listing",
      text: `${sanitize(product?.manufacturer || "Brand")} product data is reviewed for catalog consistency and buyer clarity.`,
    },
    {
      icon: PackageCheck,
      title: "Inventory-aware checkout",
      text: stockLabel,
    },
    {
      icon: Truck,
      title: "Delivery-ready order flow",
      text: "Shipping, tax, payment method, and seller split are handled during checkout.",
    },
    {
      icon: ShieldCheck,
      title: "Protected payment options",
      text: "Supports QR bank transfer and cash on delivery with order tracking after purchase.",
    },
  ];

  const specificationRows = [
    ["SKU", sku],
    ["Manufacturer", sanitize(product?.manufacturer || "Not specified")],
    ["Category", productCategory],
    ["Seller", sanitize(sellerName)],
    ["Availability", stockLabel],
    ["Marketplace status", "Published electronics listing"],
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm sm:p-6">
      <div role="tablist" className="flex gap-2 overflow-x-auto border-b border-zinc-100 pb-3">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={currentProductTab === index}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              currentProductTab === index
                ? "bg-zinc-950 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
            }`}
            onClick={() => setCurrentProductTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {currentProductTab === 0 && (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">
                  Product overview
                </p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">
                  Built for a serious electronics purchase
                </h2>
                <p className="mt-3 text-base leading-7 text-zinc-600">
                  This page combines the seller listing, stock status, payment readiness, and verified
                  customer feedback so buyers can evaluate the product before checkout.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-950 p-5 text-white">
                  <Zap className="mb-4 h-5 w-5 text-yellow-300" />
                  <p className="text-sm text-white/70">Category</p>
                  <p className="mt-1 text-lg font-bold">{productCategory}</p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
                  <Star className="mb-4 h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <p className="text-sm text-zinc-500">Rating</p>
                  <p className="mt-1 text-lg font-bold text-zinc-950">
                    {averageRating.toFixed(1)} / 5
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <h3 className="text-lg font-bold text-zinc-950">Description</h3>
              <div
                className="prose prose-zinc mt-3 max-w-none text-base leading-7 text-zinc-700"
                dangerouslySetInnerHTML={{
                  __html: descriptionHtml,
                }}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-zinc-100 p-5">
                    <Icon className="mb-3 h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-zinc-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentProductTab === 1 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="overflow-hidden rounded-2xl border border-zinc-100">
              <table className="w-full text-left text-sm">
                <tbody>
                  {specificationRows.map(([label, value], index) => (
                    <tr key={label} className={index === specificationRows.length - 1 ? "" : "border-b border-zinc-100"}>
                      <th className="w-1/3 bg-zinc-50 px-4 py-4 font-semibold text-zinc-600">{label}</th>
                      <td className="px-4 py-4 text-zinc-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <RotateCcw className="mb-4 h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-zinc-950">Buyer checks before checkout</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                <li>Confirm the selected quantity is available in current stock.</li>
                <li>Review payment method and QR transfer amount at checkout.</li>
                <li>Keep order confirmation for seller and delivery tracking.</li>
              </ul>
            </div>
          </div>
        )}

        {currentProductTab === 2 && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Customer rating</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-black text-zinc-950">{averageRating.toFixed(1)}</span>
                <span className="pb-1 text-sm text-zinc-500">/ 5</span>
              </div>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={`h-5 w-5 ${
                      index < Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-zinc-300"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-zinc-500">{totalReviews} verified reviews</p>

              <div className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = Number(distribution[rating] || 0);
                  const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={rating} className="grid grid-cols-[34px_1fr_36px] items-center gap-2 text-xs text-zinc-600">
                      <span>{rating} star</span>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                        <div className="h-full rounded-full bg-yellow-400" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-zinc-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-950">
                          {review.user?.email ? review.user.email.split("@")[0] : "Verified buyer"}
                        </p>
                        <div className="mt-1 flex gap-1">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-zinc-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.createdAt && (
                        <time className="text-sm text-zinc-500">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      )}
                    </div>
                    <p className="mt-3 leading-7 text-zinc-700">
                      {sanitize(review.comment || "Good product quality and reliable checkout experience.")}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center">
                  <p className="font-semibold text-zinc-950">No written reviews yet</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Ratings will appear here after verified buyers review this product.
                  </p>
                </div>
              )}

              <AddReviewForm productId={product.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
