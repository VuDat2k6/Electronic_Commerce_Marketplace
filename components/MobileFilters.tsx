"use client";

import React, { useEffect, useState } from "react";
import { X, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Filters from "./Filters";

export function MobileFilters() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  return (
    <>
      <button
        type="button"
        disabled={!isInteractive}
        onClick={() => setIsOpen(true)}
        className="lg:hidden inline-flex h-11 items-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50 active:scale-95 disabled:cursor-wait disabled:opacity-60"
      >
        <Filter className="h-4 w-4" />
        Filters
      </button>

      {/* Drawer and Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-[90] backdrop-blur-xs"
            />

            {/* Slider Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[100] flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                    <Filter className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-base font-bold text-gray-900">Filters</p>
                    <p className="text-xs text-gray-500">Apply when you are done</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 active:scale-90"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <Filters onApplied={() => setIsOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileFilters;
