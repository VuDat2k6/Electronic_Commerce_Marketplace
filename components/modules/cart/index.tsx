// CartModule - Clean, modern design
"use client";

import { useProductStore as useCartStore, CartGroup } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const CartModule = () => {
  const {
    products,
    removeFromCart,
    total,
    allQuantity,
    getCartGroups,
    updateCartAmount,
    clearCart,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartGroups = getCartGroups();

  const cartTotals = useMemo(() => {
    const subtotal = total;
    const estimatedShipping = cartGroups.reduce((sum, g) => sum + (g.shippingFee || 50000), 0);
    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + estimatedShipping + tax;
    return { subtotal, estimatedShipping, tax, grandTotal };
  }, [cartGroups, total]);

  const handleRemoveItem = async (id: string, title?: string) => {
    setRemovingId(id);
    await new Promise(resolve => setTimeout(resolve, 200));
    removeFromCart(id);
    toast.success(`${title || "Product"} removed`);
    setRemovingId(null);
  };

  const handleQuantityChange = (id: string, amount: number) => {
    if (amount < 1) return;
    updateCartAmount(id, amount);
  };

  const handleClearCart = () => {
    if (products.length === 0) return;
    toast.success("Cart cleared");
    clearCart();
  };

  const formatPrice = (cents: number) => {
    return cents.toLocaleString('vi-VN') + '₫';
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 h-8 w-44 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        {cartGroups.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {cartGroups.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some products to get started</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors">
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartGroups.map((group: CartGroup) => (
              <div key={group.sellerId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Store Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <Store className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700">{group.sellerName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{group.items.length} items</span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {group.items.map((product) => (
                    <div key={product.id} className={`p-5 flex gap-4 ${removingId === product.id ? "opacity-50" : ""}`}>
                      <Link href={`/product/${product.slug || product.id}`} className="flex-shrink-0">
                        <Image width={96} height={96} src={product?.image ? (product.image.startsWith('http') || product.image.startsWith('/') ? product.image : `/${product.image}`) : "/product_placeholder.jpg"} alt={product.title} className="w-24 h-24 rounded-xl object-cover" />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-4">
                          <div className="flex-1">
                            <Link href={`/product/${product.slug || product.id}`}>
                              <h3 className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2">{product.title}</h3>
                            </Link>
                            <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(product.price)}</p>
                          </div>
                          <button onClick={() => handleRemoveItem(product.id, product.title)} disabled={removingId === product.id} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleQuantityChange(product.id, product.amount - 1)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-10 text-center font-medium">{product.amount}</span>
                            <button onClick={() => handleQuantityChange(product.id, product.amount + 1)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-semibold text-gray-900">{formatPrice(product.amount * product.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Order Summary</h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({allQuantity} items)</span>
                  <span className="font-medium">{formatPrice(cartTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">{formatPrice(cartTotals.estimatedShipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (5%)</span>
                  <span className="font-medium">{formatPrice(cartTotals.tax)}</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(cartTotals.grandTotal)}</span>
                </div>

                <Link href="/checkout" className="w-full mt-6 py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link href="/shop" className="w-full py-3 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
