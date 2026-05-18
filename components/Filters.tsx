// *********************
// Role of the component: Filters on shop page
// Name of the component: Filters.tsx
// Developer: Vu Dat
// Version: 1.1
// Component call: <Filters />
// Input parameters: no input parameters
// Output: stock, rating and price filter
// *********************

"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSortStore } from "@/app/_zustand/sortStore";
import { usePaginationStore } from "@/app/_zustand/paginationStore";
import { motion } from "framer-motion";
import { Filter, Star } from "lucide-react";

interface InputCategory {
  inStock: { text: string, isChecked: boolean },
  outOfStock: { text: string, isChecked: boolean },
  priceFilter: { text: string, value: number },
  ratingFilter: { text: string, value: number },
}

const Filters = () => {
  const pathname = usePathname();
  const { replace } = useRouter();

  // getting current page number from Zustand store
  const { page } = usePaginationStore();

  const [inputCategory, setInputCategory] = useState<InputCategory>({
    inStock: { text: "instock", isChecked: true },
    outOfStock: { text: "outofstock", isChecked: true },
    priceFilter: { text: "price", value: 30000000 },
    ratingFilter: { text: "rating", value: 0 },
  });
  const { sortBy } = useSortStore();

  useEffect(() => {
    const params = new URLSearchParams();
    // setting URL params and after that putting them all in URL
    params.set("outOfStock", inputCategory.outOfStock.isChecked.toString());
    params.set("inStock", inputCategory.inStock.isChecked.toString());
    params.set("rating", inputCategory.ratingFilter.value.toString());
    params.set("price", inputCategory.priceFilter.value.toString());
    params.set("sort", sortBy);
    params.set("page", page.toString());
    replace(`${pathname}?${params}`);
  }, [inputCategory, sortBy, page]);

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Filter className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Filters</h3>
      </div>

      {/* Availability Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Availability</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={inputCategory.inStock.isChecked}
                onChange={() =>
                  setInputCategory({
                    ...inputCategory,
                    inStock: {
                      text: "instock",
                      isChecked: !inputCategory.inStock.isChecked,
                    },
                  })
                }
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                inputCategory.inStock.isChecked
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent"
                  : "border-gray-300 group-hover:border-purple-400"
              }`}>
                {inputCategory.inStock.isChecked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-gray-700 group-hover:text-purple-600 transition-colors">In stock</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={inputCategory.outOfStock.isChecked}
                onChange={() =>
                  setInputCategory({
                    ...inputCategory,
                    outOfStock: {
                      text: "outofstock",
                      isChecked: !inputCategory.outOfStock.isChecked,
                    },
                  })
                }
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                inputCategory.outOfStock.isChecked
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent"
                  : "border-gray-300 group-hover:border-purple-400"
              }`}>
                {inputCategory.outOfStock.isChecked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-gray-700 group-hover:text-purple-600 transition-colors">Out of stock</span>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Price Range</h4>
        <div className="space-y-4">
          <input
            type="range"
            min={0}
            max={30000000}
            step={500000}
            value={inputCategory.priceFilter.value}
            className="range range-sm range-primary w-full"
            onChange={(e) =>
              setInputCategory({
                ...inputCategory,
                priceFilter: {
                  text: "price",
                  value: Number(e.target.value),
                },
              })
            }
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">0</span>
            <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full">
              Max: {formatPrice(inputCategory.priceFilter.value)}₫
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

      {/* Rating Filter */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Minimum Rating</h4>
        <input
          type="range"
          min={0}
          max="5"
          value={inputCategory.ratingFilter.value}
          onChange={(e) =>
            setInputCategory({
              ...inputCategory,
              ratingFilter: { text: "rating", value: Number(e.target.value) },
            })
          }
          className="range range-sm range-warning w-full"
          step="1"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < inputCategory.ratingFilter.value
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {inputCategory.ratingFilter.value}+ stars
          </span>
        </div>
      </div>
    </div>
  );
};

export default Filters;
