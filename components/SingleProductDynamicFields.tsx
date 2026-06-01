// *********************
// Role of the component: Helper component for seperating dynamic client component from server component on the single product page with the intention to preserve SEO benefits of Next.js
// Name of the component: SingleProductDynamicFields.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <SingleProductDynamicFields product={product} />
// Input parameters: { product: Product }
// Output: Quantity, add to cart and buy now component on the single product page
// *********************

"use client";
import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import QuantityInput from "./QuantityInput";
import AddToCartSingleProductBtn from "./AddToCartSingleProductBtn";
import BuyNowSingleProductBtn from "./BuyNowSingleProductBtn";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";

const SingleProductDynamicFields = ({ product }: { product: Product }) => {
  const [quantityCount, setQuantityCount] = useState<number>(1);
  const { data: session, status } = useSession();
  const router = useRouter();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const wishlist = useWishlistStore((state) => state.wishlist);
  const isAvailable = Number(product.inStock) > 0;
  const productId = product.id?.toString();
  const isWishlisted = productId ? wishlist.some((item) => item.id === productId) : false;
  const wishlistDisabled = status === "loading" || !productId;

  const handleWishlist = () => {
    if (!productId) {
      toast.error("Product data is invalid");
      return;
    }

    if (!session?.user) {
      toast.error("Please login to add to wishlist");
      router.push(`/login?callbackUrl=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(productId);
      toast.success("Removed from wishlist");
      return;
    }

    addToWishlist({
      id: productId,
      title: product.title,
      price: product.price,
      image: product.mainImage,
      slug: product.slug,
      sellerId: product.sellerId,
      sellerName: product.seller?.shopName || product.seller?.email,
      stockAvailabillity: product.inStock,
    });
    toast.success("Product added to wishlist");
  };

  return (
    <>
      {isAvailable && (
        <>
          <QuantityInput
            quantityCount={quantityCount}
            setQuantityCount={setQuantityCount}
          />
          <div className="flex gap-x-5 max-[500px]:flex-col max-[500px]:items-center max-[500px]:gap-y-1">
            <AddToCartSingleProductBtn
              quantityCount={quantityCount}
              product={product}
            />
            <BuyNowSingleProductBtn
              quantityCount={quantityCount}
              product={product}
            />
          </div>
        </>
      )}
      <button
        type="button"
        disabled={wishlistDisabled}
        onClick={handleWishlist}
        className={`mt-4 flex w-[425px] max-w-full items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-base font-semibold transition-all max-[500px]:w-full ${
          isWishlisted
            ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-gray-200 bg-white text-gray-800 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        } disabled:cursor-wait disabled:opacity-60`}
        aria-pressed={isWishlisted}
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
        {isWishlisted ? "Saved to wishlist" : "Add to wishlist"}
      </button>
    </>
  );
};

export default SingleProductDynamicFields;
