"use client";

import { useProductStore, CartGroup } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { FaCheck, FaClock, FaTimes, FaStore } from "react-icons/fa";
import QuantityInputCart from "@/components/QuantityInputCart";
import { sanitize } from "@/lib/sanitize";
import { useEffect, useMemo } from "react";

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

  // Lấy danh sách nhóm theo merchant (memoized)
  const cartGroups = useMemo(() => getCartGroups(), [products]);

  // Tính tổng đơn hàng (memoized)
  const cartTotals = useMemo(() => {
    const subtotal = total;
    const estimatedShipping = cartGroups.reduce((sum, g) => sum + g.shippingFee, 0);
    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + estimatedShipping + tax;
    return { subtotal, estimatedShipping, tax, grandTotal };
  }, [cartGroups, total]);

  // Xử lý xóa sản phẩm
  const handleRemoveItem = (id: string, title?: string) => {
    removeFromCart(id);
    toast.success(`${title || "Product"} removed from cart`);
  };

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (id: string, amount: number) => {
    updateCartAmount(id, amount);
  };

  // Xử lý xóa toàn bộ giỏ hàng
  const handleClearCart = () => {
    if (products.length === 0) return;
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart();
      toast.success("Cart cleared");
    }
  };

  return (
    <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
      <section aria-labelledby="cart-heading" className="lg:col-span-7">
        <h2 id="cart-heading" className="sr-only">
          Items in your shopping cart
        </h2>

        {/* Giỏ hàng trống */}
        {cartGroups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-6">
              Add some products to get started!
            </p>
            <Link
              href="/shop"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Nút xóa toàn bộ giỏ hàng */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClearCart}
                className="text-sm text-red-600 hover:text-red-800 hover:underline"
              >
                Clear Cart
              </button>
            </div>

            {/* Danh sách sản phẩm theo merchant */}
            {cartGroups.map((group: CartGroup) => (
              <div key={group.merchantId} className="mb-6">
                {/* Merchant Header */}
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-t-lg px-4 py-3">
                  <FaStore className="text-blue-500" />
                  <span className="text-sm font-medium text-blue-900">
                    {group.merchantName}
                  </span>
                  <span className="ml-auto text-xs text-blue-600">
                    {group.items.length} item{group.items.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Product List */}
                <ul className="divide-y divide-gray-200 border-x border-b border-gray-200 bg-white rounded-b-lg">
                  {group.items.map((product) => (
                    <li
                      key={product.id}
                      className="flex py-6 sm:py-10 px-4"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          width={192}
                          height={192}
                          src={
                            product?.image
                              ? `/${product.image}`
                              : "/product_placeholder.jpg"
                          }
                          alt={sanitize(product.title)}
                          className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                        />
                      </div>

                      <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                          <div>
                            <div className="flex justify-between">
                              <h3 className="text-sm">
                                <Link
                                  href={`/product/${product.slug || product.id}`}
                                  className="font-medium text-gray-700 hover:text-gray-800"
                                >
                                  {sanitize(product.title)}
                                </Link>
                              </h3>
                            </div>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              ${(product.price / 100).toFixed(2)}
                            </p>
                          </div>

                          <div className="mt-4 sm:mt-0 sm:pr-9">
                            <QuantityInputCart
                              product={product}
                              onQuantityChange={(amount) =>
                                handleQuantityChange(product.id, amount)
                              }
                            />
                            <div className="absolute right-0 top-0">
                              <button
                                onClick={() =>
                                  handleRemoveItem(product.id, product.title)
                                }
                                type="button"
                                className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                              >
                                <span className="sr-only">Remove</span>
                                <FaTimes className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <p className="flex space-x-2 text-sm text-gray-700">
                            {product.amount <= 10 ? (
                              <FaCheck
                                className="h-5 w-5 flex-shrink-0 text-green-500"
                                aria-hidden="true"
                              />
                            ) : (
                              <FaClock
                                className="h-5 w-5 flex-shrink-0 text-gray-300"
                                aria-hidden="true"
                              />
                            )}
                            <span>
                              {product.amount <= 10 ? "In stock" : "Ships in 3 days"}
                            </span>
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            Subtotal:{" "}
                            ${((product.amount * product.price) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Merchant Subtotal */}
                <div className="flex justify-between items-center bg-gray-50 border-x border-b border-gray-200 px-4 py-3 rounded-b-lg">
                  <span className="text-sm text-gray-600">
                    Subtotal from {group.merchantName}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    ${(group.subtotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      {/* Order Summary */}
      <section
        aria-labelledby="summary-heading"
        className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
      >
        <h2
          id="summary-heading"
          className="text-lg font-medium text-gray-900"
        >
          Order summary
        </h2>

        {/* Merchant count */}
        {cartGroups.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>
              Shipping from {cartGroups.length} shop
              {cartGroups.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        <dl className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-600">
              Subtotal ({allQuantity} items)
            </dt>
            <dd className="text-sm font-medium text-gray-900">
              ${(cartTotals.subtotal / 100).toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center text-sm text-gray-600">
              <span>Shipping estimate</span>
            </dt>
            <dd className="text-sm font-medium text-gray-900">
              ${(cartTotals.estimatedShipping / 100).toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center text-sm text-gray-600">
              <span>Tax estimate (5%)</span>
            </dt>
            <dd className="text-sm font-medium text-gray-900">
              ${(cartTotals.tax / 100).toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <dt className="text-base font-medium text-gray-900">Order total</dt>
            <dd className="text-base font-medium text-gray-900">
              ${(cartTotals.grandTotal / 100).toFixed(2)}
            </dd>
          </div>
        </dl>

        {products.length > 0 && (
          <div className="mt-6">
            <Link
              href="/checkout"
              className="block flex justify-center items-center w-full uppercase bg-white px-4 py-3 text-base border border-black border-gray-300 font-bold text-blue-600 shadow-sm hover:bg-black hover:bg-gray-100 focus:outline-none focus:ring-2"
            >
              <span>Checkout</span>
            </Link>
          </div>
        )}

        {/* Multi-merchant notice */}
        {cartGroups.length > 1 && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              Your order will be split into {cartGroups.length} sub-orders,
              one for each shop. Each shop will ship their items separately.
            </p>
          </div>
        )}

        {/* Continue shopping */}
        <div className="mt-4 text-center">
          <Link
            href="/shop"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            or Continue Shopping
          </Link>
        </div>
      </section>
    </form>
  );
};
