import React from "react";
import { getMerchantShop } from "../../../server/services/order.service";
import Link from "next/link";
import Image from "next/image";
import { Store, Package, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

interface ShopPageProps {
  params: Promise<{
    merchantId: string;
  }>;
}

const categoryRedirects: Record<string, string> = {
  smartphones: "smartphones",
  "smart-phones": "smartphones",
  laptops: "laptops",
  tablets: "tablets",
  audio: "audio",
  earbuds: "audio",
  headphones: "audio",
  cameras: "cameras",
  "smart-watches": "smart-watches",
  watches: "smart-watches",
  gaming: "gaming",
  accessories: "accessories",
  mouses: "accessories",
  computers: "computers",
  printers: "printers",
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { merchantId } = await params;

  if (categoryRedirects[merchantId]) {
    redirect(`/shop?category=${categoryRedirects[merchantId]}`);
  }

  let merchantName = "Unknown Shop";
  let merchantDescription = "";
  let products: Array<{
    id: string;
    title: string;
    price: number | string;
    inStock: number;
    mainImage?: string;
    slug?: string;
  }> = [];

  try {
    const { merchant, products: merchantProducts } = await getMerchantShop(merchantId);
    merchantName = (merchant as { name?: string }).name ?? merchantName;
    merchantDescription = (merchant as { description?: string }).description ?? "";
    products = merchantProducts as Array<{
      id: string;
      title: string;
      price: number | string;
      inStock: number;
      mainImage?: string;
      slug?: string;
    }>;
  } catch {
    // Keep page rendering even when merchant is not found.
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return numPrice.toLocaleString('vi-VN') + '₫';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shops
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{merchantName}</h1>
              {merchantDescription && (
                <p className="text-white/80 mt-1">{merchantDescription}</p>
              )}
              <p className="text-white/60 text-sm mt-2">{products.length} products available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No products available</h2>
            <p className="text-gray-500">This shop has no products listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
              >
                <Link
                  href={`/product/${product.slug || product.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Image
                      src={product.mainImage || "/product_placeholder.jpg"}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-lg font-bold text-purple-600">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
