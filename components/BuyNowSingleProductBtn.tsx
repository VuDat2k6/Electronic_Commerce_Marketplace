// *********************
// Role of the component: Buy Now button that adds product to the cart and redirects to the checkout page
// Name of the component: BuyNowSingleProductBtn.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <BuyNowSingleProductBtn product={product} quantityCount={quantityCount} />
// Input parameters: SingleProductBtnProps interface
// Output: Button with buy now functionality
// *********************

"use client";
import { useProductStore, ProductInCart } from "@/app/_zustand/store";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Product {
  id?: string | number;
  title?: string;
  price?: number;
  mainImage?: string;
  sellerId?: string;
  seller?: { shopName?: string | null };
  merchantId?: string;
  merchant?: { name?: string };
  slug?: string;
}

interface SingleProductBtnProps {
  product: Product;
  quantityCount?: number;
}

const BuyNowSingleProductBtn = ({
  product,
  quantityCount,
}: SingleProductBtnProps) => {
  const router = useRouter();
  const addToCart = useProductStore((state) => state.addToCart);
  const { data: session, status } = useSession();
  const [isInteractive, setIsInteractive] = useState(false);
  const isDisabled = !isInteractive || status === "loading";

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  const handleAddToCart = () => {
    if (!session?.user) {
      toast.error("Please login to purchase");
      const returnUrl = product.slug ? `/product/${product.slug}` : "/shop";
      router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (product?.id === undefined || product?.id === null || product?.id === "") {
      toast.error("Product data is invalid");
      return;
    }

    const cartItem: ProductInCart = {
      id: product.id.toString(),
      title: product?.title || "",
      price: product?.price || 0,
      image: product?.mainImage || "",
      amount: quantityCount || 1,
      sellerId: product?.sellerId || product?.merchantId,
      sellerName: product?.seller?.shopName || product?.merchant?.name,
      merchantId: product?.merchantId,
      merchantName: product?.merchant?.name,
      slug: product?.slug,
    };

    addToCart(cartItem);
    toast.success("Product added to the cart");
    router.push("/checkout");
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={handleAddToCart}
      className="w-[200px] text-lg font-semibold border-2 border-transparent bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 transition-all rounded-xl py-3 max-[500px]:w-full shadow-lg hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
    >
      Buy Now
    </button>
  );
};

export default BuyNowSingleProductBtn;
