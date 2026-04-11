"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface SubOrderProduct {
  id: string;
  productId: string;
  quantity: number;
  productNameSnapshot: string;
  productImageSnapshot: string | null;
  unitPriceSnapshot: number;
  merchantIdSnapshot: string;
  merchantNameSnapshot: string;
  product?: {
    id: string;
    slug: string;
    mainImage: string;
  };
}

interface SubOrder {
  id: string;
  merchantId: string;
  merchantNameSnapshot: string;
  status: string;
  subTotal: number;
  shippingTotal: number;
  trackingNumber: string | null;
  createdAt: string;
  products: SubOrderProduct[];
  merchant?: { id: string; name: string };
}

interface Order {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  adress: string;
  apartment: string;
  city: string;
  country: string;
  postalCode: string;
  status: string;
  total: number;
  dateTime: string | null;
  subOrders: SubOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  PARTIALLY_FULFILLED: "bg-orange-100 text-orange-800",
  PARTIALLY_CANCELLED: "bg-orange-100 text-orange-800",
  PAID: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PARTIALLY_FULFILLED: "Partially Fulfilled",
  PARTIALLY_CANCELLED: "Partially Cancelled",
  PAID: "Paid",
};

const AccountOrdersPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, [session]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 获取用户 ID
      let customerId = "";
      if (session?.user?.email) {
        try {
          const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            customerId = userData.id;
          }
        } catch (e) {
          console.error("Error fetching user:", e);
        }
      }

      if (!customerId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // 设置 header 并获取订单
      const response = await fetch(`/api/account/orders`, {
        headers: {
          "x-customer-id": customerId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white">
        <SectionTitle title="My Orders" path="Home | Account | Orders" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
          <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <SectionTitle title="My Orders" path="Home | Account | Orders" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {orders.map((order) => {
            const isExpanded = expandedOrders.has(order.id);
            const totalItems = order.subOrders.reduce(
              (sum, so) => sum + so.products.reduce((s, p) => s + p.quantity, 0),
              0
            );

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                {/* 订单头部 */}
                <div
                  className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Order ID</p>
                      <p className="text-sm font-mono text-gray-900 truncate max-w-[180px]">
                        {order.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Date</p>
                      <p className="text-sm text-gray-900">{formatDate(order.dateTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${formatPrice(order.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Items</p>
                      <p className="text-sm text-gray-900">{totalItems} item(s)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* 订单详情（展开） */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {/* 收货地址 */}
                    <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
                      <p className="text-sm text-gray-600">
                        {order.name} {order.lastname}
                        <br />
                        {order.adress}
                        {order.apartment ? `, ${order.apartment}` : ""}
                        <br />
                        {order.city}, {order.country} {order.postalCode}
                        <br />
                        {order.phone}
                      </p>
                    </div>

                    {/* 子订单列表 */}
                    <div className="divide-y divide-gray-200">
                      {order.subOrders.map((subOrder) => (
                        <div key={subOrder.id} className="p-6">
                          {/* 子订单头部 */}
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/shop/${subOrder.merchantId}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {subOrder.merchant?.name || subOrder.merchantNameSnapshot}
                              </Link>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  STATUS_COLORS[subOrder.status] || "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {STATUS_LABELS[subOrder.status] || subOrder.status}
                              </span>
                            </div>
                            
                            {subOrder.trackingNumber && (
                              <div className="text-sm">
                                <span className="text-gray-500">Tracking: </span>
                                <span className="font-mono text-gray-900">
                                  {subOrder.trackingNumber}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 子订单商品 */}
                          <div className="space-y-3">
                            {subOrder.products.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 bg-gray-50 rounded-lg p-3"
                              >
                                <div className="flex-shrink-0">
                                  {item.productImageSnapshot ? (
                                    <Image
                                      src={`/${item.productImageSnapshot}`}
                                      alt={item.productNameSnapshot}
                                      width={64}
                                      height={64}
                                      className="rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.productNameSnapshot}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Qty: {item.quantity} × ${formatPrice(item.unitPriceSnapshot)}
                                  </p>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  ${formatPrice(item.unitPriceSnapshot * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 子订单小计 */}
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                            <div className="text-right space-y-1">
                              <div className="flex justify-between gap-8 text-sm">
                                <span className="text-gray-500">Subtotal:</span>
                                <span className="text-gray-900">
                                  ${formatPrice(subOrder.subTotal)}
                                </span>
                              </div>
                              {subOrder.shippingTotal > 0 && (
                                <div className="flex justify-between gap-8 text-sm">
                                  <span className="text-gray-500">Shipping:</span>
                                  <span className="text-gray-900">
                                    ${formatPrice(subOrder.shippingTotal)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between gap-8 text-sm font-medium">
                                <span>SubOrder Total:</span>
                                <span className="text-blue-600">
                                  ${formatPrice(subOrder.subTotal + subOrder.shippingTotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 订单总览 */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Order Total (incl. all shops)
                          </p>
                          <p className="text-xl font-bold text-gray-900">
                            ${formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AccountOrdersPage;
