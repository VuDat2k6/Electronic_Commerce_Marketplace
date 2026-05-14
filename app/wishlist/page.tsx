"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaTrash, FaShoppingCart, FaHeart } from "react-icons/fa";
import { SectionTitle } from "@/components";
import { useWishlistStore, ProductInWishlist } from "@/app/_zustand/wishlistStore";
import { useProductStore } from "@/app/_zustand/store";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, wishQuantity } = useWishlistStore();
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    if (wishlist.length > 0) {
      fetchProductDetails();
    }
  }, [wishlist]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Use the optimized bulk slugs endpoint
      const slugs = wishlist.filter(item => item.slug).map(item => item.slug!);

      if (slugs.length === 0) {
        setProductDetails({});
        return;
      }

      // Fetch all products in a single request using the optimized bulk endpoint
      const response = await apiClient.get(`/api/slugs/bulk?slugs=${slugs.join(",")}`);

      if (response.ok) {
        const data = await response.json();
        // Build lookup map from response
        const details: Record<string, any> = {};
        const products = data.products || [];
        for (const product of products) {
          details[product.id] = product;
        }
        setProductDetails(details);
      } else {
        // Fallback: try individual requests in parallel (only if bulk fails)
        const results = await Promise.allSettled(
          wishlist
            .filter(item => item.slug)
            .map(item =>
              apiClient.get(`/api/slugs/${item.slug}`).then(res => res.json())
            )
        );
        const details: Record<string, any> = {};
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const item = wishlist.filter(w => w.slug)[index];
            if (item) details[item.id] = result.value;
          }
        });
        setProductDetails(details);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
    toast.success("Removed from wishlist");
  };

  const { addToCart } = useProductStore();

  const handleAddToCart = async (product: ProductInWishlist) => {
    try {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        slug: product.slug,
        amount: 1,
      });
      toast.success("Added to cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  if (wishQuantity === 0) {
    return (
      <div className="bg-white min-h-screen">
        <SectionTitle title="My Wishlist" path="Home | Wishlist" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4 text-gray-300">
            <FaHeart className="mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Save your favorite items to buy them later
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <SectionTitle title="My Wishlist" path="Home | Wishlist" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Wishlist ({wishQuantity} items)
          </h1>
          <Link
            href="/shop"
            className="text-blue-600 hover:text-blue-800"
          >
            Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {wishlist.map((item) => {
                const productDetail = productDetails[item.id];
                const finalPrice = productDetail?.price || item.price;
                const imageUrl = item.image || productDetail?.mainImage || "/placeholder.jpg";

                return (
                  <div key={item.id} className="p-6 flex items-center gap-6">
                    <Link href={`/product/${item.slug || item.id}`} className="flex-shrink-0">
                      <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.slug || item.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate block"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {productDetail?.manufacturer || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.stockAvailabillity !== undefined
                          ? item.stockAvailabillity > 0
                            ? "In Stock"
                            : "Out of Stock"
                          : productDetail?.inStock > 0
                          ? "In Stock"
                          : "Out of Stock"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          ${formatPrice(finalPrice)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <FaShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <Link
            href="/cart"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Cart
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
