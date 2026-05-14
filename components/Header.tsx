// Header component - REDESIGNED with Purple/Cyan theme
"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useCallback, useState } from "react";
import HeaderTop from "./HeaderTop";
import Image from "next/image";
import SearchInput from "./SearchInput";
import Link from "next/link";
import CartElement from "./CartElement";
import NotificationBell from "./NotificationBell";
import HeartElement from "./HeartElement";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import { ShoppingBag, User, LogOut } from "lucide-react";

// Cache for user data to avoid redundant fetches
// Each entry stores data along with a timestamp for TTL expiration
const userCache = new Map<string, { userId: string; wishlist: unknown[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

const Header = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setWishlist, wishQuantity } = useWishlistStore();
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  const handleLogout = useCallback(() => {
    toast.success("Logout successful!");
    setTimeout(() => signOut(), 1000);
  }, []);

  const fetchUserAndWishlist = useCallback(async (email: string) => {
    // Check cache first (with TTL validation)
    const cached = userCache.get(email);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setWishlist(cached.wishlist as Parameters<typeof setWishlist>[0]);
      return;
    }

    setIsLoadingWishlist(true);
    try {
      // Use single API endpoint that returns both user and wishlist if possible
      // Or fetch in parallel
      const [userResponse, wishlistResponse] = await Promise.all([
        apiClient.get(`/api/users/email/${encodeURIComponent(email)}`, { cache: "no-store" }),
        apiClient.get(`/api/wishlist?email=${encodeURIComponent(email)}`, { cache: "no-store" }).catch(() => null)
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userId = userData?.id;

        if (userId) {
          // Fetch wishlist for this user
          let wishlistData: unknown[] = [];
          if (wishlistResponse?.ok) {
            wishlistData = await wishlistResponse.json();
          } else {
            // Fallback: fetch wishlist directly
            try {
              const directWishlistResponse = await apiClient.get(`/api/wishlist/${userId}`, { cache: "no-store" });
              if (directWishlistResponse.ok) {
                wishlistData = await directWishlistResponse.json();
              }
            } catch {
              // Ignore wishlist fetch errors
            }
          }

          // Transform wishlist data
          const productArray = Array.isArray(wishlistData)
            ? wishlistData.map((item: any) => ({
                id: item?.product?.id,
                title: item?.product?.title,
                price: item?.product?.price,
                image: item?.product?.mainImage,
                slug: item?.product?.slug,
                stockAvailabillity: item?.product?.inStock,
              }))
            : [];

          // Cache the result with timestamp
          userCache.set(email, { userId, wishlist: productArray, timestamp: Date.now() });
          setWishlist(productArray);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoadingWishlist(false);
    }
  }, [setWishlist]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserAndWishlist(session.user.email);
    }
  }, [session?.user?.email, fetchUserAndWishlist]);

  // Memoize the user ID lookup to prevent unnecessary re-renders
  const isSeller = session?.user?.role === "seller";
  const isBuyer = session?.user?.role === "buyer";
  const showNormalHeader = !pathname.startsWith("/admin") && !pathname.startsWith("/seller/");
  const showSellerHeader = pathname.startsWith("/seller/") && pathname !== "/become-seller";
  const showAdminHeader = pathname.startsWith("/admin");

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* Seller dashboard header */}
      {showSellerHeader && (
        <div className="flex justify-between h-20 bg-gradient-to-r from-purple-600 to-cyan-500 items-center px-6">
          <div className="flex items-center gap-6 w-full">
            <Link
              href="/"
              className="text-white font-bold text-lg flex items-center gap-2 whitespace-nowrap hover:text-purple-100 transition-colors"
            >
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </span>
              Back to Home
            </Link>

            <div className="text-white/80 text-sm hidden md:block">
              Seller Dashboard
            </div>
          </div>

          <div className="flex gap-x-5 items-center ml-4 flex-shrink-0">
            <span className="text-purple-100 text-sm hidden sm:block">
              Seller Dashboard
            </span>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="w-10 cursor-pointer">
                <Image
                  src="/randomuser.jpg"
                  alt="profile"
                  width={30}
                  height={30}
                  className="w-full h-full rounded-full ring-2 ring-white/50"
                />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow-xl bg-white rounded-xl w-52 mt-2 border border-gray-200"
              >
                <li className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Account
                </li>
                <li>
                  <Link href="/seller/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
                    <ShoppingBag className="w-4 h-4" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/seller/settings" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
                    <User className="w-4 h-4" />
                    Shop Settings
                  </Link>
                </li>
                <li className="border-t border-gray-100 mt-2 pt-2">
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 rounded-lg w-full">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Normal header */}
      {showNormalHeader && (
        <div className="h-28 bg-white flex items-center justify-between px-8 max-[1320px]:px-8 max-md:px-6 max-lg:flex-col max-lg:gap-y-4 max-lg:justify-center max-lg:h-auto max-w-screen-2xl mx-auto py-4">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/TFDTRONIC-logo.png"
              width={180}
              height={72}
              alt="TFDTRONIC logo"
              className="relative right-5 max-[1023px]:w-48 h-auto"
              priority
            />
          </Link>
          <div className="flex-1 max-w-xl mx-8 max-lg:mx-0 max-w-screen-md">
            <SearchInput />
          </div>
          <div className="flex gap-x-8 items-center">
            {isSeller && (
              <Link
                href="/seller/dashboard"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Seller Dashboard
              </Link>
            )}
            {isBuyer && (
              <Link
                href="/become-seller"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5"
              >
                Become a Seller
              </Link>
            )}
            <div className="flex items-center gap-4">
              <NotificationBell />
              <HeartElement wishQuantity={wishQuantity} />
              <CartElement />
            </div>
          </div>
        </div>
      )}

      {/* Admin header */}
      {showAdminHeader && (
        <div className="flex justify-between h-20 bg-gradient-to-r from-purple-600 to-purple-700 items-center px-8 max-w-screen-2xl mx-auto">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/TFDTRONIC-logo.png"
              width={130}
              height={52}
              alt="TFDTRONIC logo"
              className="w-48 h-auto brightness-0 invert"
            />
          </Link>
          <div className="flex gap-x-5 items-center">
            <NotificationBell />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="w-10 cursor-pointer">
                <Image
                  src="/randomuser.jpg"
                  alt="random profile photo"
                  width={30}
                  height={30}
                  className="w-full h-full rounded-full ring-2 ring-purple-300"
                />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow-xl bg-white rounded-xl w-52 mt-2 border border-gray-200"
              >
                <li className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Admin Account
                </li>
                <li>
                  <Link href="/admin" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
                    <ShoppingBag className="w-4 h-4" />
                    Dashboard
                  </Link>
                </li>
                <li className="border-t border-gray-100 mt-2 pt-2">
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 rounded-lg w-full">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <HeaderTop />
    </header>
  );
};

export default Header;
