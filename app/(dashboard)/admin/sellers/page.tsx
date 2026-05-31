"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

interface Seller {
  id: string;
  email: string;
  shopName: string | null;
  shopDescription: string | null;
  shopPhone: string | null;
  shopAddress: string | null;
  shopStatus: string;
  shopApprovedAt: string | null;
  shopCreatedAt: string | null;
  _count: { products: number };
}

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "SUSPENDED">("ALL");

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/sellers");

      if (!res.ok) {
        throw new Error("Failed to fetch sellers");
      }

      const data = await res.json();
      setSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error loading sellers list");
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      console.log('Sending approve request for id:', id);
      const res = await apiClient.patch(`/api/admin/sellers/${id}/approve`);
      console.log('Approve response status:', res.status);
      if (res.ok) {
        toast.success("Seller approved successfully!");
        fetchSellers();
      } else {
        const text = await res.text();
        console.error("Error approving seller:", text);
        toast.error("Error approving seller");
      }
    } catch (e) {
      console.error("Exception approving seller:", e);
      toast.error("Error approving seller");
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this seller?")) return;
    try {
      const res = await apiClient.patch(`/api/admin/sellers/${id}/suspend`, { reason: "Terms of service violation" });
      if (res.ok) {
        toast.success("Seller suspended!");
        fetchSellers();
      } else {
        toast.error("Error suspending seller");
      }
    } catch {
      toast.error("Error suspending seller");
    }
  };

  const filteredSellers = sellers.filter((s) => {
    if (filter === "ALL") return true;
    return s.shopStatus === filter;
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACTIVE: "bg-green-100 text-green-800",
      SUSPENDED: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white flex justify-start max-w-screen-2xl mx-auto h-full max-xl:flex-col max-xl:h-fit max-xl:gap-y-4">
      <DashboardSidebar />
      <div className="w-full">
        <div className="flex justify-between items-center mb-6 px-5 pt-5">
        <h1 className="text-2xl font-bold">Sellers Management</h1>
        <div className="flex gap-2">
          {(["ALL", "PENDING", "ACTIVE", "SUSPENDED"] as const).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "ALL" ? "All" : f === "PENDING" ? "Pending" : f === "ACTIVE" ? "Active" : "Suspended"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredSellers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No sellers found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{seller.shopName || "No name set"}</div>
                    <div className="text-sm text-gray-500">{seller.shopPhone || "No phone set"}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{seller.email}</td>
                  <td className="px-6 py-4 text-center">{seller._count.products}</td>
                  <td className="px-6 py-4">{statusBadge(seller.shopStatus)}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {seller.shopCreatedAt ? new Date(seller.shopCreatedAt).toLocaleDateString("vi-VN") : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/sellers/${seller.id}`}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        Details
                      </Link>
                      {seller.shopStatus === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(seller.id)}
                          className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg"
                        >
                          Approve
                        </button>
                      )}
                      {seller.shopStatus === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleSuspend(seller.id)}
                          className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
                        >
                          Suspend
                        </button>
                      )}
                      {seller.shopStatus === "SUSPENDED" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(seller.id)}
                          className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
};

export default AdminSellersPage;