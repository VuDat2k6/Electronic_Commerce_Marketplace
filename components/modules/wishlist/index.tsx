"use client";

import { useWishlistStore, ProductInWishlist } from "@/app/_zustand/wishlistStore";
import WishItem from "@/components/WishItem";
import apiClient from "@/lib/api";
import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";
import { useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";

export const WishlistModule = () => {
  const { data: session, status } = useSession();
  const { wishlist, setWishlist, removeFromWishlist } = useWishlistStore();
  const [userId, setUserId] = useState<string | null>(null);

  // Get wishlist from API by userId
  const getWishlistByUserId = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/api/wishlist/${id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      const data = await response.json();
      const wishlistData = data.wishlist || data || [];

      // Convert API data to ProductInWishlist
      const productArray: ProductInWishlist[] = wishlistData
        .filter((item: any) => item?.product) // Filter out items without product
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

  // Get userId from email
  const getUserByEmail = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await apiClient.get(`/api/users/email/${session.user.email}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

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

  // Call API when session changes
  useEffect(() => {
    if (status === "authenticated") {
      getUserByEmail();
    }
  }, [status, getUserByEmail]);

  // Handle removing product from wishlist
  const handleRemoveFromWishlist = useCallback(async (id: string, userId?: string) => {
    try {
      // Remove from state first (optimistic update)
      removeFromWishlist(id);

      // If userId exists, call API to remove from database
      if (userId) {
        const response = await apiClient.delete(`/api/wishlist/${userId}/${id}`);
        if (!response.ok) {
          throw new Error("Failed to remove from wishlist");
        }
      }

      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
      // TODO: Restore state if needed
    }
  }, [removeFromWishlist]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Not logged in
  if (status === "unauthenticated") {
    return (
      <div className="text-center py-20">
        <h3 className="text-4xl py-10 text-black max-lg:text-3xl max-sm:text-2xl max-sm:pt-5 max-[400px]:text-xl">
          Please login to view your wishlist
        </h3>
      </div>
    );
  }

  // Empty wishlist
  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">❤️</div>
        <h3 className="text-4xl py-10 text-black max-lg:text-3xl max-sm:text-2xl max-sm:pt-5 max-[400px]:text-xl">
          No items found in the wishlist
        </h3>
        <p className="text-gray-500">Add some products to your wishlist!</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-screen-2xl mx-auto">
        <div className="overflow-x-auto">
          <table className="table text-center">
            <thead>
              <tr>
                <th></th>
                <th className="text-accent-content">Image</th>
                <th className="text-accent-content">Name</th>
                <th className="text-accent-content">Stock Status</th>
                <th className="text-accent-content">Price</th>
                <th className="text-accent-content">Action</th>
              </tr>
            </thead>
            <tbody>
              {wishlist.map((item) => (
                <WishItem
                  key={item.id || nanoid()}
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  image={item.image}
                  slug={item.slug}
                  stockAvailabillity={item.stockAvailabillity}
                  onRemove={() => handleRemoveFromWishlist(item.id, userId || undefined)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};