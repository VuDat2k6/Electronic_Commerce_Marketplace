// Header - Premium UX with working search
"use client";

import { ShoppingCart, Heart, Search, Phone, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/app/_zustand/store';
import { useWishlistStore } from '@/app/_zustand/wishlistStore';

export function Header() {
  const router = useRouter();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { allQuantity } = useProductStore();
  const { wishlist, wishQuantity } = useWishlistStore();

  // Handle search submit
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  }, [searchQuery, router]);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && isSearchFocused) {
        setIsSearchFocused(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white sticky top-0 z-50 shadow-md will-change-transform"
    >
      {/* Top bar */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white overflow-hidden relative">
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{ backgroundSize: '200% 200%' }}
        />
        <div className="max-w-7xl mx-auto px-4 py-2 relative z-10">
          <div className="flex items-center justify-between text-sm">
            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+84 012 345 6789</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@tfdtronic.com</span>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/login" className="hover:text-purple-200 transition-colors">Login</Link>
              <span className="text-purple-300">|</span>
              <Link href="/register" className="hover:text-purple-200 transition-colors">Register</Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <motion.div
              className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg"
              whileHover={{ rotate: [0, 10, -10, 0] }}
              transition={{
                duration: 0.5,
              }}
            >
              <ShoppingCart className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              TFDTRONIC
            </h1>
          </Link>

          {/* Search bar - centered */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <motion.div
                className="relative"
                animate={{
                  boxShadow: isSearchFocused 
                    ? "0 0 0 3px rgba(147, 51, 234, 0.2)" 
                    : "0 0 0 0px rgba(147, 51, 234, 0)",
                }}
                transition={{ duration: 0.2 }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  className="w-full pl-4 pr-24 py-2.5 border-2 border-gray-200 rounded-full focus:outline-none focus:border-purple-500 transition-all text-sm text-gray-900 placeholder-gray-400"
                  aria-label="Search products"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1.5 rounded-full shadow-md hover:shadow-xl transition-shadow flex items-center gap-2 text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </motion.button>

                {/* Clear button */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute right-28 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Keyboard shortcut hint */}
                <AnimatePresence>
                  {!isSearchFocused && !searchQuery && (
                    <motion.kbd
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-24 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500 font-medium"
                    >
                      <span>⌘</span>
                      <span>K</span>
                    </motion.kbd>
                  )}
                </AnimatePresence>
              </motion.div>
            </form>
          </div>

          {/* Mobile search icon */}
          <div className="md:hidden">
            <button
              onClick={() => {
                searchInputRef.current?.focus();
              }}
              className="p-2 hover:bg-purple-50 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/wishlist"
              className="p-2 md:p-3 hover:bg-purple-50 rounded-full transition-colors relative"
              aria-label={`Wishlist${wishQuantity > 0 ? `, ${wishQuantity} items` : ''}`}
            >
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
              {wishQuantity > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center font-semibold shadow-lg"
                >
                  {wishQuantity > 9 ? '9+' : wishQuantity}
                </motion.span>
              )}
            </Link>
            <Link
              href="/cart"
              className="p-2 md:p-3 hover:bg-purple-50 rounded-full transition-colors relative"
              aria-label={`Cart${allQuantity > 0 ? `, ${allQuantity} items` : ''}`}
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
              {allQuantity > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center font-semibold shadow-lg"
                >
                  {allQuantity > 9 ? '9+' : allQuantity}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;
