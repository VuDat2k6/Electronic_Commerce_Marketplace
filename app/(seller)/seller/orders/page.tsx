"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

export default function SellerOrdersPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(`/api/seller/orders?sellerId=${session.user.id}`);
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
    };

    fetchOrders();
  }, [session?.user?.id]);

  const updateStatus = async (itemId: string, status: string) => {
    try {
      const res = await apiClient.request(`/api/seller/orders/${itemId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ sellerId: session?.user?.id, status }),
        headers: { "Content-Type": "application/json" }
      } as any);

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Status updated successfully");
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, order: { ...item.order, status } } : item
      ));
    } catch {
      toast.error("Unable to update status");
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      processing: "bg-yellow-100 text-yellow-800",
      delivered: "bg-green-100 text-green-800",
      canceled: "bg-red-100 text-red-800",
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[status] || ""}`}>{status}</span>;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No orders found yet.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Product</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Quantity</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Price</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Buyer</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.mainImage || "/placeholder.jpg"}
                        alt={item.product?.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span>{item.product?.title || "—"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">{item.quantity}</td>
                  <td className="py-4 px-4">${(item.priceAtPurchase / 100).toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <div>
                      <div>{item.order?.name} {item.order?.lastname}</div>
                      <div className="text-xs text-gray-500">{item.order?.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {item.order?.dateTime ? new Date(item.order.dateTime).toLocaleDateString("en-US") : "—"}
                  </td>
                  <td className="py-4 px-4">{statusBadge(item.order?.status || "")}</td>
                  <td className="py-4 px-4">
                    <select
                      value={item.order?.status || ""}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="processing">Processing</option>
                      <option value="delivered">Delivered</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}