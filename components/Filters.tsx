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
import { Star, RotateCcw, SlidersHorizontal } from "lucide-react";

interface InputCategory {
  inStock: { text: string, isChecked: boolean },
  outOfStock: { text: string, isChecked: boolean },
  priceFilter: { text: string, value: number },
  ratingFilter: { text: string, value: number },
}

const Filters = ({ onApplied }: { onApplied?: () => void }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const [inputCategory, setInputCategory] = useState<InputCategory>({
    inStock: { text: "instock", isChecked: true },
    outOfStock: { text: "outofstock", isChecked: true },
    priceFilter: { text: "price", value: 80000000 },
    ratingFilter: { text: "rating", value: 0 },
  });
  const [isInteractive, setIsInteractive] = useState(false);
  const { sortBy } = useSortStore();

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  useEffect(() => {
    const price = Number(searchParams.get("price"));
    const rating = Number(searchParams.get("rating"));

    setInputCategory({
      inStock: { text: "instock", isChecked: searchParams.get("inStock") !== "false" },
      outOfStock: { text: "outofstock", isChecked: searchParams.get("outOfStock") !== "false" },
      priceFilter: { text: "price", value: Number.isFinite(price) && price > 0 ? price : 80000000 },
      ratingFilter: { text: "rating", value: Number.isFinite(rating) ? rating : 0 },
    });
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("outOfStock", inputCategory.outOfStock.isChecked.toString());
    params.set("inStock", inputCategory.inStock.isChecked.toString());
    params.set("rating", inputCategory.ratingFilter.value.toString());
    params.set("price", inputCategory.priceFilter.value.toString());
    params.set("sort", sortBy);
    params.set("page", "1");
    replace(`${pathname}?${params}`);
    onApplied?.();
  };

  const resetFilters = () => {
    setInputCategory({
      inStock: { text: "instock", isChecked: true },
      outOfStock: { text: "outofstock", isChecked: true },
      priceFilter: { text: "price", value: 80000000 },
      ratingFilter: { text: "rating", value: 0 },
    });
    const params = new URLSearchParams(searchParams.toString());
    params.set("outOfStock", "true");
    params.set("inStock", "true");
    params.set("rating", "0");
    params.set("price", "80000000");
    params.set("sort", sortBy);
    params.set("page", "1");
    replace(`${pathname}?${params}`);
    onApplied?.();
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  return (
    <fieldset
      disabled={!isInteractive}
      className={`m-0 min-w-0 space-y-6 border-0 p-0 transition-opacity ${
        isInteractive ? "" : "pointer-events-none opacity-60"
      }`}
    >
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
            max={80000000}
            step={1000000}
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
              Max: {formatPrice(inputCategory.priceFilter.value)} VND
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

      <div className="pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Apply
        </button>
      </div>
    </fieldset>
  );
};

export default Filters;
