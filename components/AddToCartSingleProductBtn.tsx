// *********************
// Role of the component: Button for adding product to the cart on the single product page
// Name of the component: AddToCartSingleProductBtn.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <AddToCartSingleProductBtn product={product} quantityCount={quantityCount}  />
// Input parameters: SingleProductBtnProps interface
// Output: Button with adding to cart functionality
// *********************
"use client";

import React, { useEffect, useState } from "react";
import { useProductStore, ProductInCart } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

const AddToCartSingleProductBtn = ({ product, quantityCount }: SingleProductBtnProps) => {
  const addToCart = useProductStore((state) => state.addToCart);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isInteractive, setIsInteractive] = useState(false);
  const isDisabled = !isInteractive || status === "loading";

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  const handleAddToCart = () => {
    if (!session?.user) {
      toast.error("Please login to add to cart");
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
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={handleAddToCart}
      className="w-[200px] text-lg font-semibold border-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-600 hover:text-white transition-all rounded-xl py-3 max-[500px]:w-full shadow-sm hover:shadow-lg disabled:cursor-wait disabled:opacity-60"
    >
      Add to cart
    </button>
  );
};

export default AddToCartSingleProductBtn;
