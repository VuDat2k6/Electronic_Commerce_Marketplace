"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { Package, AlertCircle, CheckCircle } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product?: {
    mainImage?: string;
    title?: string;
  };
  order?: {
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
};

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
      const res = await apiClient.get(`/api/seller/orders?sellerId=${userId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }
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
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    setUpdatingId(itemId);
    try {
      const res = await apiClient.request(`/api/seller/orders/${itemId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ sellerId: userId, status }),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Status updated successfully!");
      setItems(prev => prev.map(item =>
        item.id === itemId 
          ? { ...item, order: { ...item.order, status } } 
          : item
      ));
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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
          <Package className="w-10 h-10 text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No orders yet
        </h3>
        <p className="text-gray-500 mb-6">
          When customers place orders, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        <span className="text-sm text-gray-500">{items.length} orders</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600">Product</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600">Quantity</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600">Price</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600">Order Date</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.product?.mainImage || "/placeholder.jpg"}
                          alt={item.product?.title || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium text-gray-800 line-clamp-1 max-w-[200px]">
                        {item.product?.title || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{item.quantity}</td>
                  <td className="py-4 px-4 font-semibold text-purple-600">
                    ${(item.priceAtPurchase / 100).toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-800">
                        {item.order?.name} {item.order?.lastname}
                      </div>
                      <div className="text-xs text-gray-500">{item.order?.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {item.order?.dateTime 
                      ? new Date(item.order.dateTime).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })
                      : "—"}
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(item.order?.status || "pending")}
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={item.order?.status || ""}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      disabled={updatingId === item.id}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="delivered">Delivered</option>
                      <option value="canceled">Cancelled</option>
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
