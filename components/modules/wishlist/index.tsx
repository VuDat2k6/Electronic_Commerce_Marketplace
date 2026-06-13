// WishlistModule - Clean, modern design
"use client";

import { useWishlistStore, ProductInWishlist } from "@/app/_zustand/wishlistStore";
import WishItem from "@/components/WishItem";
import apiClient from "@/lib/api";
import { useSession } from "next-auth/react";
import { useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

export const WishlistModule = () => {
  const { data: session, status } = useSession();
  const { wishlist, setWishlist, removeFromWishlist } = useWishlistStore();
  const [userId, setUserId] = useState<string | null>(null);

  const getWishlistByUserId = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/api/wishlist/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch wishlist");
      const data = await response.json();
      const wishlistData = data.wishlist || data || [];
      const productArray: ProductInWishlist[] = wishlistData
        .filter((item: any) => item?.product)
        .map((item: any) => ({
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          image: item.product.mainImage,
          slug: item.product.slug,
          stockAvailabillity: item.product.inStock,
        }));
      setWishlist(productArray);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist");
    }
  }, [setWishlist]);

  const getUserByEmail = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const response = await apiClient.get(`/api/users/email/${session.user.email}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      if (data?.id) {
        setUserId(data.id);
        getWishlistByUserId(data.id);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user data");
    }
  }, [session?.user?.email, getWishlistByUserId]);

  useEffect(() => {
    if (status === "authenticated") {
      getUserByEmail();
    }
  }, [status, getUserByEmail]);

  const handleRemoveFromWishlist = useCallback(async (id: string, uid?: string) => {
    try {
      removeFromWishlist(id);
      if (uid) {
        const response = await apiClient.delete(`/api/wishlist/${uid}/${id}`);
        if (!response.ok) throw new Error("Failed to remove from wishlist");
      }
      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  }, [removeFromWishlist]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your wishlist</h2>
        <p className="text-gray-500 mb-6">Save items you like for later</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save items you like by clicking the heart icon</p>
        <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Wishlist</h1>
      <div className="space-y-4">
        {wishlist.map((item) => (
          <WishItem
            key={item.id}
            id={item.id}
            title={item.title}
            price={item.price}
            image={item.image}
            slug={item.slug}
            stockAvailabillity={item.stockAvailabillity}
            onRemove={() => handleRemoveFromWishlist(item.id, userId || undefined)}
          />
        ))}
      </div>
    </div>
  );
};
