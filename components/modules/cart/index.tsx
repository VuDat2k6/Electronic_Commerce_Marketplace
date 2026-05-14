"use client";

import { useProductStore, CartGroup } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { FaCheck, FaClock, FaTimes, FaStore } from "react-icons/fa";
import QuantityInputCart from "@/components/QuantityInputCart";
import { sanitize } from "@/lib/sanitize";
import { useMemo, useState } from "react";
import { ShoppingCart, Trash2, ArrowRight, Package } from "lucide-react";

export const CartModule = () => {
  const {
    products,
    removeFromCart,
    total,
    allQuantity,
    getCartGroups,
    updateCartAmount,
    clearCart,
  } = useProductStore();

  const [removingId, setRemovingId] = useState<string | null>(null);

  const cartGroups = useMemo(() => getCartGroups(), [products]);

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
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
      {/* Left: Cart Items */}
      <section className="lg:col-span-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Items in Cart {cartGroups.length > 0 && `(${allQuantity})`}
          </h2>
          {cartGroups.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Remove All
            </button>
          )}
        </div>

        {/* Empty Cart */}
        {cartGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Your Cart is Empty
            </h3>
            <p className="text-gray-500 mb-6">
              Add some products to your cart to continue shopping!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium rounded-xl hover:from-purple-700 hover:to-cyan-600 transition-colors shadow-md hover:shadow-lg"
            >
              <Package className="w-5 h-5" />
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {cartGroups.map((group: CartGroup) => (
              <div key={group.merchantId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
                {/* Merchant Header */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-cyan-50 px-5 py-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FaStore className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-800">{group.merchantName}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    {group.items.length} items
                  </span>
                </div>

                {/* Product List */}
                <div className="divide-y divide-gray-100">
                  {group.items.map((product) => (
                    <div
                      key={product.id}
                      className={`p-5 flex gap-5 hover:bg-gray-50/50 transition-colors ${
                        removingId === product.id ? "opacity-50" : ""
                      }`}
                    >
                      {/* Image */}
                      <Link href={`/product/${product.slug || product.id}`} className="flex-shrink-0">
                        <Image
                          width={120}
                          height={120}
                          src={product?.image ? `/${product.image}` : "/product_placeholder.jpg"}
                          alt={sanitize(product.title)}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-4">
                          <div className="flex-1">
                            <Link href={`/product/${product.slug || product.id}`}>
                              <h3 className="font-medium text-gray-800 hover:text-purple-600 transition-colors line-clamp-2">
                                {sanitize(product.title)}
                              </h3>
                            </Link>
                            <p className="text-lg font-bold text-purple-600 mt-1">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(product.id, product.title)}
                            disabled={removingId === product.id}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <FaTimes className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Stock Status */}
                          <div className="flex items-center gap-2 text-sm">
                            {product.amount <= 10 ? (
                              <>
                                <FaCheck className="w-4 h-4 text-green-500" />
                                <span className="text-green-600">In Stock</span>
                              </>
                            ) : (
                              <>
                                <FaClock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500">Delivery in 3 days</span>
                              </>
                            )}
                          </div>

                          {/* Quantity & Subtotal */}
                          <div className="flex items-center gap-4">
                            <QuantityInputCart
                              product={product}
                              onQuantityChange={(amount) => handleQuantityChange(product.id, amount)}
                            />
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Subtotal</p>
                              <p className="font-semibold text-gray-800">
                                {formatPrice(product.amount * product.price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Merchant Subtotal */}
                <div className="flex justify-between items-center bg-gray-50 px-5 py-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Subtotal from {group.merchantName}</span>
                  <span className="font-semibold text-gray-800">{formatPrice(group.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Right: Order Summary */}
      <section className="lg:col-span-5 mt-8 lg:mt-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-cyan-50">
            <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
            {cartGroups.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Shipping from {cartGroups.length} stores
              </p>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Subtotal ({allQuantity} items)
              </span>
              <span className="font-medium text-gray-800">{formatPrice(cartTotals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-800">{formatPrice(cartTotals.estimatedShipping)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tax (5%)</span>
              <span className="font-medium text-gray-800">{formatPrice(cartTotals.tax)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800">Total</span>
              <span className="text-2xl font-bold text-purple-600">{formatPrice(cartTotals.grandTotal)}</span>
            </div>

            {products.length > 0 && (
              <Link
                href="/checkout"
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}

            {/* Multi-merchant notice */}
            {cartGroups.length > 1 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  Your order will be split into {cartGroups.length} sub-orders,
                  each shipped separately by the respective store.
                </p>
              </div>
            )}

            {/* Continue Shopping */}
            <div className="text-center pt-2">
              <Link
                href="/shop"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1 transition-colors"
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
