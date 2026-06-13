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
import prisma from "@/utils/db";
import StorefrontLoadError from "@/components/StorefrontLoadError";

interface ImageItem {
  imageID: string;
  productID: string;
  image: string;
}

interface SingleProductPageProps {
  params: Promise<{ productSlug: string; id: string }>;
}
export const dynamic = 'force-dynamic';

const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const paramsAwaited = await params;
  const renderLoadFailure = (status?: number) => (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <StorefrontLoadError
          resource="this product"
          status={status}
          backHref="/shop"
          backLabel="Browse catalog"
        />
      </div>
    </div>
  );

  let data: Response;
  try {
    data = await apiClient.get(`/api/slugs/${paramsAwaited?.productSlug}`);
  } catch (error) {
    console.error("Error fetching product:", error);
    return renderLoadFailure();
  }

  if (data.status === 404) {
    notFound();
  }

  if (!data.ok) {
    console.error("Failed to fetch product:", data.status);
    return renderLoadFailure(data.status);
  }

  let product;
  try {
    product = await data.json();
  } catch (error) {
    console.error("Error parsing product response:", error);
    return renderLoadFailure();
  }

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

  let reviewsData = null;
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: product.id, status: 'PUBLISHED' },
      include: { user: { select: { email: true } }, product: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    let averageRating = 0;
    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    if (reviews.length > 0) {
      let totalRating = 0;
      reviews.forEach((r: any) => {
        totalRating += r.rating;
        distribution[r.rating.toString()] += 1;
      });
      averageRating = totalRating / reviews.length;
    }

    reviewsData = {
      reviews: reviews.map(({ id, rating, comment, createdAt, user }) => ({
        id,
        rating,
        comment,
        createdAt: createdAt.toISOString(),
        user,
      })),
      pagination: { total: reviews.length },
      stats: { averageRating, totalReviews: reviews.length, distribution }
    };
  } catch (e) {
    console.error("Error fetching reviews from DB:", e);
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' VND';
  };

  const originalPrice = product?.originalPrice || (product?.price > 500000 ? product.price * 1.15 : undefined);
  const discount = originalPrice
    ? Math.round(((originalPrice - product?.price) / originalPrice) * 100)
    : 0;

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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                {sanitize(product?.title)}
                {discount > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -{discount}%
                  </span>
                )}
              </h1>
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatPrice(product?.price || 0)}
                </p>
                {originalPrice && (
                  <p className="text-xl text-gray-400 line-through">
                    {formatPrice(originalPrice)}
                  </p>
                )}
              </div>
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
          <ProductTabs product={product} reviewsData={reviewsData || undefined} />
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;
