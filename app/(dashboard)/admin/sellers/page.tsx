"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
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
      toast.error("Lỗi khi tải danh sách sellers");
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
      const res = await apiClient.patch(`/api/admin/sellers/${id}/approve`);
      if (res.ok) {
        toast.success("Đã duyệt seller thành công!");
        fetchSellers();
      } else {
        toast.error("Lỗi khi duyệt seller");
      }
    } catch {
      toast.error("Lỗi khi duyệt seller");
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm("Bạn có chắc muốn tạm ngưng seller này?")) return;
    try {
      const res = await apiClient.patch(`/api/admin/sellers/${id}/suspend`, { reason: "Vi phạm điều khoản sử dụng" });
      if (res.ok) {
        toast.success("Đã tạm ngưng seller!");
        fetchSellers();
      } else {
        toast.error("Lỗi khi tạm ngưng seller");
      }
    } catch {
      toast.error("Lỗi khi tạm ngưng seller");
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Sellers</h1>
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
              {f === "ALL" ? "Tất cả" : f === "PENDING" ? "Chờ duyệt" : f === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : filteredSellers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Không có seller nào</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{seller.shopName || "Chưa có tên"}</div>
                    <div className="text-sm text-gray-500">{seller.shopPhone || "Chưa có SĐT"}</div>
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
                        Chi tiết
                      </Link>
                      {seller.shopStatus === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(seller.id)}
                          className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg"
                        >
                          Duyệt
                        </button>
                      )}
                      {seller.shopStatus === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => handleSuspend(seller.id)}
                          className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
                        >
                          Tạm ngưng
                        </button>
                      )}
                      {seller.shopStatus === "SUSPENDED" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(seller.id)}
                          className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg"
                        >
                          Kích hoạt lại
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
  );
};

export default AdminSellersPage;