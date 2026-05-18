// SingleProductPage - Clean, modern design
import {
  StockAvailabillity,
  ProductTabs,
  SingleProductDynamicFields,
} from "@/components";
import apiClient from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";
import { FaFacebook, FaTwitter, FaPinterest } from "react-icons/fa";
import { sanitize } from "@/lib/sanitize";

interface ImageItem {
  imageID: string;
  productID: string;
  image: string;
}

interface SingleProductPageProps {
  params: Promise<{ productSlug: string; id: string }>;
}

const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const paramsAwaited = await params;
  const data = await apiClient.get(`/api/slugs/${paramsAwaited?.productSlug}`);
  const product = await data.json();

  let images: ImageItem[] = [];
  if (paramsAwaited?.id && paramsAwaited.id !== "undefined") {
    try {
      const imagesData = await apiClient.get(`/api/images/${paramsAwaited?.id}`);
      if (imagesData.ok) {
        images = await imagesData.json();
      }
    } catch (e) {
      console.error("Error fetching images:", e);
    }
  }

  if (!product || product.error) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('vi-VN') + '₫';
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-gray-900">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{sanitize(product?.title)}</span>
        </nav>

        {/* Product Info */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <Image
                src={product?.mainImage || "/product_placeholder.jpg"}
                width={600}
                height={600}
                alt={sanitize(product?.title) || "Product image"}
                className="w-full h-full object-cover"
              />
            </div>
            {images && images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((imageItem: ImageItem, key: number) => (
                  <button
                    key={imageItem.imageID + key}
                    className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:border-gray-900 transition-colors"
                  >
                    <Image
                      src={imageItem.image}
                      width={80}
                      height={80}
                      alt="Product thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {sanitize(product?.title)}
              </h1>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(product?.price)}
              </p>
            </div>

            {/* Stock */}
            <StockAvailabillity inStock={product?.inStock} />

            {/* Dynamic Fields (Quantity, Add to Cart, Buy Now) */}
            <SingleProductDynamicFields product={product} />

            {/* SKU */}
            <div className="pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                SKU: <span className="font-medium text-gray-900">PROD-{product?.id?.slice(0, 8) || "00000000"}</span>
              </p>
            </div>

            {/* Share */}
            <div>
              <p className="text-sm text-gray-500 mb-3">Share:</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors">
                  <FaFacebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors">
                  <FaTwitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors">
                  <FaPinterest className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <p className="text-sm text-gray-500 mb-3">Secure Payment:</p>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Image src="/visa.svg" width={40} height={25} alt="Visa" className="h-4 w-auto" />
                </div>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Image src="/mastercard.svg" width={40} height={25} alt="Mastercard" className="h-4 w-auto" />
                </div>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Image src="/paypal.svg" width={40} height={25} alt="PayPal" className="h-4 w-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-16">
          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;
