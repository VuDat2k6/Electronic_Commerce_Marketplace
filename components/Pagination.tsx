// *********************
// Role of the component: Pagination for navigating the shop page
// Name of the component: Pagination.tsx
// Developer: Vu Dat
// Version: 1.1
// Component call: <Pagination />
// Input parameters: no input parameters
// Output: Component with the current page and buttons for incrementing and decrementing page
// *********************

"use client";
import { usePaginationStore } from "@/app/_zustand/paginationStore";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import React from "react";

interface PaginationProps {
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const Pagination = ({ totalPages = 10, onPageChange }: PaginationProps) => {
  const { page, incrementPage, decrementPage, setPage } = usePaginationStore();

  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    if (onPageChange) {
      onPageChange(pageNum);
    }
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        {/* First Page */}
        <button
          onClick={() => goToPage(1)}
          disabled={!canGoPrev}
          className={`p-2.5 rounded-lg transition-all ${
            canGoPrev
              ? "hover:bg-purple-50 text-gray-700 hover:text-purple-600"
              : "text-gray-300 cursor-not-allowed"
          }`}
          aria-label="First page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        {/* Previous */}
        <button
          onClick={decrementPage}
          disabled={!canGoPrev}
          className={`p-2.5 rounded-lg transition-all ${
            canGoPrev
              ? "hover:bg-purple-50 text-gray-700 hover:text-purple-600"
              : "text-gray-300 cursor-not-allowed"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            const isActive = page === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          onClick={incrementPage}
          disabled={!canGoNext}
          className={`p-2.5 rounded-lg transition-all ${
            canGoNext
              ? "hover:bg-purple-50 text-gray-700 hover:text-purple-600"
              : "text-gray-300 cursor-not-allowed"
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => goToPage(totalPages)}
          disabled={!canGoNext}
          className={`p-2.5 rounded-lg transition-all ${
            canGoNext
              ? "hover:bg-purple-50 text-gray-700 hover:text-purple-600"
              : "text-gray-300 cursor-not-allowed"
          }`}
          aria-label="Last page"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
