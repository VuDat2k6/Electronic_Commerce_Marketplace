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
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Product {
  id?: string | number;
  title?: string;
  price?: number;
  mainImage?: string;
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

  const handleAddToCart = () => {
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
      onClick={handleAddToCart}
      className="w-[200px] text-lg font-semibold border-2 border-transparent bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 transition-all rounded-xl py-3 max-[500px]:w-full shadow-lg hover:shadow-xl"
    >
      Buy Now
    </button>
  );
};

export default BuyNowSingleProductBtn;