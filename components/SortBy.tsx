// *********************
// Role of the component: SortBy
// Name of the component: SortBy.tsx
// Developer: Vu Dat
// Version: 1.1
// Component call: <SortBy />
// Input parameters: no input parameters
// Output: select input with options for sorting by a-z, z-a, price low, price high
// *********************

"use client";
import React, { useState } from "react";
import { useSortStore } from "@/app/_zustand/sortStore";
import { ArrowUpDown, Check } from "lucide-react";

const sortOptions = [
  { value: "defaultSort", label: "Default Sort" },
  { value: "titleAsc", label: "Name: A to Z" },
  { value: "titleDesc", label: "Name: Z to A" },
  { value: "lowPrice", label: "Price: Low to High" },
  { value: "highPrice", label: "Price: High to Low" },
];

const SortBy = () => {
  const { sortBy, changeSortBy } = useSortStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
        <span className="text-sm font-medium text-gray-700">
          Sort: <span className="text-purple-600">{currentOption.label}</span>
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 transition-all duration-200 origin-top ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                changeSortBy(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                sortBy === option.value
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              }`}
            >
              {option.label}
              {sortBy === option.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SortBy;
