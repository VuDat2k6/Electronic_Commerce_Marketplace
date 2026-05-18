"use client";

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ShoppingCart, Heart, Search, Menu, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/app/_zustand/store';
import { useWishlistStore } from '@/app/_zustand/wishlistStore';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

export const Header = memo(() => {
  const router = useRouter();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allQuantity = useProductStore((state) => state.allQuantity);
  const wishQuantity = useWishlistStore((state) => state.wishQuantity);

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      {/* Top Bar */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Welcome to TFDTRONIC</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <span className="font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">TFDTRONIC</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-12 w-full bg-input-background border-border"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              
              {/* Keyboard shortcut hint */}
              <AnimatePresence>
                {!isSearchFocused && !searchQuery && (
                  <motion.kbd
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-500 font-medium"
                  >
                    <span>⌘</span>
                    <span>K</span>
                  </motion.kbd>
                )}
              </AnimatePresence>
              {/* Clear button */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" tabIndex={-1}>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/wishlist" tabIndex={-1}>
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishQuantity > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {wishQuantity > 99 ? '99+' : wishQuantity}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link href="/cart" tabIndex={-1}>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {allQuantity > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {allQuantity > 99 ? '99+' : allQuantity}
                  </Badge>
                )}
              </Button>
            </Link>

            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-6 h-12 overflow-x-auto no-scrollbar">
            <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              Shop All
            </Link>
            <Link href="/shop?category=smart-phones" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              Phones
            </Link>
            <Link href="/shop?category=laptops" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              Laptops
            </Link>
            <Link href="/shop?category=watches" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              Watches
            </Link>
            <Link href="/shop?category=headphones" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
              Audio
            </Link>
            <Link href="/shop?sale=true" className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors whitespace-nowrap">
              Hot Deals
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
