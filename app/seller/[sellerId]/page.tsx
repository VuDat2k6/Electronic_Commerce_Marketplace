"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import apiClient from "@/lib/api";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface Seller {
  id: string;
  email: string;
  shopName: string | null;
  shopDescription: string | null;
  shopPhone: string | null;
  shopAddress: string | null;
  shopStatus: string;
  products: Product[];
}

interface Product {
  id: string;
  title: string;
  slug: string;
  mainImage: string;
  price: number;
  inStock: number;
  rating: number;
}

const SellerShopPage = () => {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useProductStore();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchSeller = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/api/sellers/${sellerId}`);
        if (res.ok) {
          const data = await res.json();
          setSeller(data);
        } else if (res.status === 404) {
          setError("Shop not found");
        } else {
          setError("Error loading shop");
        }
      } catch {
        setError("Connection error");
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSeller();
    }
  }, [sellerId]);

  const handleAddToCart = (product: Product) => {
    if (!session?.user) {
      toast.error("Please login to add to cart");
      return;
    }

    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.mainImage,
      amount: 1,
      sellerId: sellerId,
      sellerName: seller?.shopName || "Unknown Shop",
      slug: product.slug,
      maxStock: product.inStock,
    });
    toast.success("Added to cart!");
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(cents);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (seller.shopStatus === "SUSPENDED") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Shop Has Been Suspended</h1>
          <p className="text-gray-600 mb-4">This shop is currently not active.</p>
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-green-600">
                {seller.shopName?.charAt(0)?.toUpperCase() || "S"}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{seller.shopName || "Shop"}</h1>
              <p className="text-green-100 mt-1">
                {seller.shopDescription || "Trusted shop - Top quality products"}
              </p>
              <div className="flex gap-4 mt-3 text-sm text-green-100">
                {seller.shopPhone && (
                  <span className="flex items-center gap-1">
                    📞 {seller.shopPhone}
                  </span>
                )}
                {seller.shopAddress && (
                  <span className="flex items-center gap-1">
                    📍 {seller.shopAddress}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">{seller.products?.length || 0}</p>
              <p className="text-sm text-green-100">Products</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">
                {seller.shopStatus === "ACTIVE" ? "✓" : "○"}
              </p>
              <p className="text-sm text-green-100">
                {seller.shopStatus === "ACTIVE" ? "Active" : "Pending Approval"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">Shop Products</h2>

        {seller.products && seller.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {seller.products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/product/${product.slug}`}>
                  <div className="relative h-48">
                    <Image
                      src={product.mainImage || "/product_placeholder.jpg"}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    {product.inStock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                          Out of stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="font-medium text-gray-800 line-clamp-2 hover:text-green-600 transition">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.rating > 0 && (
                      <span className="text-yellow-500 text-sm">★ {product.rating}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.inStock === 0}
                    className={`w-full mt-3 py-2 rounded-lg font-medium transition ${
                      product.inStock === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {product.inStock === 0 ? "Out of stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">This shop has no products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerShopPage;
