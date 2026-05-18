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

import React from "react";
import { useProductStore, ProductInCart } from "@/app/_zustand/store";
import toast from "react-hot-toast";

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

const AddToCartSingleProductBtn = ({ product, quantityCount }: SingleProductBtnProps) => {
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
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="w-[200px] text-lg font-semibold border-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-600 hover:text-white transition-all rounded-xl py-3 max-[500px]:w-full shadow-sm hover:shadow-lg"
    >
      Add to cart
    </button>
  );
};

export default AddToCartSingleProductBtn;