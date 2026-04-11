"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import Image from "next/image";
import toast from "react-hot-toast";

interface SubOrderProduct {
  id: string;
  quantity: number;
  productNameSnapshot: string;
  productImageSnapshot: string | null;
  unitPriceSnapshot: number;
  product?: {
    id: string;
    slug: string;
    mainImage: string;
  };
}

interface ParentOrder {
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
  dateTime: string | null;
  status: string;
  total: number;
}

interface SubOrder {
  id: string;
  merchantId: string;
  status: string;
  subTotal: number;
  shippingTotal: number;
  trackingNumber: string | null;
  shippingProvider: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  revenue: number;
  parentOrder: ParentOrder;
  products: SubOrderProduct[];
}

interface Stats {
  totalSubOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const SellerOrdersPage = () => {
  const { data: session } = useSession();
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<SubOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingProvider, setShippingProvider] = useState("");

  useEffect(() => {
    initializeMerchant();
  }, [session]);

  useEffect(() => {
    if (merchantId) {
      fetchSubOrders();
      fetchStats();
    }
  }, [merchantId, statusFilter]);

  const initializeMerchant = async () => {
    if (!session?.user?.email) return;

    try {
      const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        // 尝试获取用户关联的商户
        if (userData.merchantId) {
          setMerchantId(userData.merchantId);
        } else {
          // 如果用户没有关联商户，获取第一个活跃商户（演示用）
          const merchantsResponse = await apiClient.get("/api/merchants");
          if (merchantsResponse.ok) {
            const merchants = await merchantsResponse.json();
            if (merchants.length > 0) {
              setMerchantId(merchants[0].id);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error initializing merchant:", e);
    }
  };

  const fetchSubOrders = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      let url = `/api/seller/orders?merchantId=${merchantId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await apiClient.get(url);
      if (!response.ok) throw new Error("Failed to fetch orders");
      
      const data = await response.json();
      setSubOrders(data.subOrders || []);
    } catch (error) {
      console.error("Error fetching sub orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!merchantId) return;
    try {
      const response = await apiClient.get(`/api/seller/orders/stats?merchantId=${merchantId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateSubOrderStatus = async (
    subOrderId: string,
    newStatus: string,
    trackingData?: { trackingNumber?: string; shippingProvider?: string }
  ) => {
    if (!merchantId) return;
    setUpdatingStatus(subOrderId);
    
    try {
      const response = await apiClient.put(`/api/seller/orders/${subOrderId}/status`, {
        status: newStatus,
        merchantId,
        trackingNumber: trackingData?.trackingNumber,
        shippingProvider: trackingData?.shippingProvider,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }
      
      toast.success(`Order status updated to ${newStatus}`);
      setShowStatusModal(null);
      setTrackingNumber("");
      setShippingProvider("");
      fetchSubOrders();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  if (!merchantId && !loading) {
    return (
      <div className="bg-white">
        <SectionTitle title="Seller Orders" path="Home | Seller | Orders" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Shop Associated</h2>
          <p className="text-gray-500 mb-6">
            Your account is not linked to any shop yet. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <SectionTitle title="Seller Orders" path="Home | Seller | Orders" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total" value={stats.totalSubOrders} color="gray" />
            <StatCard label="Pending" value={stats.pendingOrders} color="yellow" />
            <StatCard label="Shipped" value={stats.shippedOrders} color="purple" />
            <StatCard label="Delivered" value={stats.deliveredOrders} color="green" />
            <StatCard label="Cancelled" value={stats.cancelledOrders} color="red" />
            <StatCard label="Revenue" value={`$${formatPrice(stats.totalRevenue)}`} color="blue" />
          </div>
        )}

        {/* 状态筛选 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Sub-Orders ({subOrders.length})
          </h2>
          <div className="flex gap-2 flex-wrap">
            {["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
              (status) => (
                <button
                  key={status || "ALL"}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status || "All"}
                </button>
              )
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : subOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No orders found for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {subOrders.map((subOrder) => {
              const isExpanded = expandedOrders.has(subOrder.id);
              const nextStatuses = STATUS_TRANSITIONS[subOrder.status] || [];

              return (
                <div
                  key={subOrder.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                  {/* 子订单头部 */}
                  <div
                    className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleOrder(subOrder.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Sub-Order ID</p>
                          <p className="text-xs font-mono text-gray-900 truncate max-w-[150px]">
                            {subOrder.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Parent Order</p>
                          <p className="text-xs font-mono text-gray-900 truncate max-w-[150px]">
                            {subOrder.parentOrder.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Date</p>
                          <p className="text-sm text-gray-900">{formatDate(subOrder.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Revenue</p>
                          <p className="text-sm font-bold text-green-600">
                            ${formatPrice(subOrder.revenue)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[subOrder.status] || "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          {STATUS_LABELS[subOrder.status] || subOrder.status}
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
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* 买家信息 */}
                      <div className="grid md:grid-cols-2 gap-6 p-6 bg-white">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Details</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium text-gray-900">
                                {subOrder.parentOrder.name} {subOrder.parentOrder.lastname}
                              </span>
                            </p>
                            <p>{subOrder.parentOrder.email}</p>
                            <p>{subOrder.parentOrder.phone}</p>
                            <p>
                              {subOrder.parentOrder.adress}
                              {subOrder.parentOrder.apartment ? `, ${subOrder.parentOrder.apartment}` : ""}
                            </p>
                            <p>
                              {subOrder.parentOrder.city}, {subOrder.parentOrder.country}{" "}
                              {subOrder.parentOrder.postalCode}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Shipping Info</h3>
                          {subOrder.trackingNumber ? (
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="text-gray-500">Provider: </span>
                                <span className="text-gray-900">{subOrder.shippingProvider || "N/A"}</span>
                              </p>
                              <p>
                                <span className="text-gray-500">Tracking: </span>
                                <span className="font-mono text-blue-600">{subOrder.trackingNumber}</span>
                              </p>
                              {subOrder.shippedAt && (
                                <p>
                                  <span className="text-gray-500">Shipped: </span>
                                  <span className="text-gray-900">{formatDate(subOrder.shippedAt)}</span>
                                </p>
                              )}
                              {subOrder.deliveredAt && (
                                <p>
                                  <span className="text-gray-500">Delivered: </span>
                                  <span className="text-green-600">{formatDate(subOrder.deliveredAt)}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No tracking information yet</p>
                          )}
                        </div>
                      </div>

                      {/* 商品列表 */}
                      <div className="px-6 pb-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Items in This Sub-Order</h3>
                        <div className="space-y-3">
                          {subOrder.products.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 bg-gray-50 rounded-lg p-3"
                            >
                              {item.productImageSnapshot ? (
                                <Image
                                  src={`/${item.productImageSnapshot}`}
                                  alt={item.productNameSnapshot}
                                  width={56}
                                  height={56}
                                  className="rounded-md object-cover"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                                  No Image
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.productNameSnapshot}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity} × ${formatPrice(item.unitPriceSnapshot)}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                ${formatPrice(item.unitPriceSnapshot * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* 小计 */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                          <div className="text-right space-y-1">
                            <div className="flex justify-between gap-8 text-sm">
                              <span className="text-gray-500">Subtotal:</span>
                              <span>${formatPrice(subOrder.subTotal)}</span>
                            </div>
                            <div className="flex justify-between gap-8 text-sm">
                              <span className="text-gray-500">Shipping:</span>
                              <span>${formatPrice(subOrder.shippingTotal)}</span>
                            </div>
                            <div className="flex justify-between gap-8 text-base font-bold">
                              <span>Total:</span>
                              <span className="text-green-600">${formatPrice(subOrder.revenue)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        {nextStatuses.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
                            {nextStatuses.map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  if (status === "SHIPPED") {
                                    setShowStatusModal(subOrder);
                                  } else {
                                    updateSubOrderStatus(subOrder.id, status);
                                  }
                                }}
                                disabled={updatingStatus === subOrder.id}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                  status === "CANCELLED"
                                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                }`}
                              >
                                {updatingStatus === subOrder.id ? "Updating..." : `Mark as ${status}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 发货弹窗 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ship Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter tracking information for Sub-Order: {showStatusModal.id.slice(0, 8)}...
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Provider
                </label>
                <input
                  type="text"
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  placeholder="e.g., UPS, FedEx, DHL"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(null);
                  setTrackingNumber("");
                  setShippingProvider("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateSubOrderStatus(showStatusModal.id, "SHIPPED", {
                    trackingNumber: trackingNumber || undefined,
                    shippingProvider: shippingProvider || undefined,
                  })
                }
                disabled={updatingStatus === showStatusModal.id}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {updatingStatus === showStatusModal.id ? "Updating..." : "Confirm Shipped"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-xs uppercase opacity-75">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default SellerOrdersPage;
