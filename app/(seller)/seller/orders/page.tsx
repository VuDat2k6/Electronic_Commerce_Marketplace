"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle, Package } from "lucide-react";

interface OrderItem {
  id: string;
  source?: "legacyOrderItem" | "subOrderProduct";
  subOrderId?: string;
  quantity: number;
  priceAtPurchase: number;
  product?: {
    id?: string;
    mainImage?: string;
    title?: string;
    slug?: string;
  };
  order?: {
    id?: string;
    name?: string;
    lastname?: string;
    email?: string;
    dateTime?: string;
    status?: string;
  };
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle },
  processing: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
  delivered: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  canceled: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
  PENDING: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle },
  CONFIRMED: { color: "bg-cyan-100 text-cyan-800 border-cyan-200", icon: CheckCircle },
  PROCESSING: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
  SHIPPED: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: Package },
  DELIVERED: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  CANCELLED: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const getImageSrc = (image?: string) => {
  if (!image) return "/product_placeholder.jpg";
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `/${image}`;
};

const formatStatusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

export default function SellerOrdersPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get("/api/seller/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      setItems(data.items || []);
    } catch {
      toast.error("Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (itemId: string, status: string) => {
    if (!(session?.user as any)?.id) return;

    setUpdatingId(itemId);
    try {
      const res = await apiClient.patch(`/api/seller/orders/${itemId}/status`, { status });
      if (!res.ok) throw new Error("Failed to update status");

      toast.success("Status updated successfully!");
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, order: { ...item.order, status } } : item,
        ),
      );
    } catch {
      toast.error("Unable to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {formatStatusLabel(status)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
          <Package className="h-10 w-10 text-purple-400" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-800">No orders yet</h3>
        <p className="mb-6 text-gray-500">When customers place orders, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Seller Orders</h1>
        <span className="text-sm text-gray-500">{items.length} order items</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Product</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Order</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Quantity</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Order Date</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={getImageSrc(item.product?.mainImage)}
                          alt={item.product?.title || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="line-clamp-1 max-w-[220px] font-medium text-gray-800">
                        {item.product?.title || "Product"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-gray-500">
                    #{String(item.order?.id || item.subOrderId || item.id).slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-4 font-semibold text-purple-600">
                    {(item.priceAtPurchase || 0).toLocaleString("vi-VN")} VND
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-800">
                        {item.order?.name} {item.order?.lastname}
                      </div>
                      <div className="text-xs text-gray-500">{item.order?.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {item.order?.dateTime
                      ? new Date(item.order.dateTime).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(item.order?.status || "PENDING")}</td>
                  <td className="px-4 py-4">
                    <select
                      value={(item.order?.status || "PENDING").toUpperCase()}
                      onChange={(event) => updateStatus(item.id, event.target.value)}
                      disabled={updatingId === item.id}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
