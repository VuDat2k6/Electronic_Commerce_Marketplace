// SearchInput - Enhanced with smooth animations
"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { sanitize } from "@/lib/sanitize";

const SearchInput = () => {
  const [searchInput, setSearchInput] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const searchProducts = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sanitizedSearch = sanitize(searchInput);
    if (sanitizedSearch.trim()) {
      router.push(`/search?search=${encodeURIComponent(sanitizedSearch)}`);
      setSearchInput("");
    }
  };

  const clearSearch = () => {
    setSearchInput("");
  };

  return (
    <motion.form
      className="flex w-full justify-center"
      onSubmit={searchProducts}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="relative flex w-full max-w-xl items-center"
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Search Input */}
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for products..."
          className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 shadow-sm focus:shadow-md"
        />

        {/* Search Icon */}
        <motion.div
          className="absolute left-4 text-gray-400"
          animate={{
            color: isFocused ? "#9333ea" : "#9ca3af",
          }}
          transition={{ duration: 0.2 }}
        >
          <Search className="w-5 h-5" />
        </motion.div>

        {/* Clear Button */}
        {searchInput && (
          <motion.button
            type="button"
            onClick={clearSearch}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-14 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}

        {/* Search Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="ml-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium rounded-xl hover:from-purple-700 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export default SearchInput;
