"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { FaTag, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

interface Voucher {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(cents);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

async function readApiError(res: Response, fallback: string) {
  try {
    const err = await res.json();
    return err.message || err.error || err.details || fallback;
  } catch {
    return fallback;
  }
}

export default function SellerVouchersPage() {
  const { data: session, status } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
  });
  const [saving, setSaving] = useState(false);

  const userId = (session?.user as any)?.id;

  const fetchVouchers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/seller/vouchers?sellerId=${userId}`);
      const data = await res.json();
      setVouchers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Unable to load vouchers");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchVouchers();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchVouchers]);

  const resetForm = () => {
    setForm({
      code: "", title: "", description: "",
      discountType: "PERCENTAGE", discountValue: "",
      minOrderValue: "", maxDiscount: "",
      usageLimit: "", expiresAt: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setForm({
      code: voucher.code,
      title: voucher.title,
      description: voucher.description || "",
      discountType: voucher.discountType,
      discountValue: String(voucher.discountValue),
      minOrderValue: voucher.minOrderValue ? String(voucher.minOrderValue) : "",
      maxDiscount: voucher.maxDiscount ? String(voucher.maxDiscount) : "",
      usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : "",
      expiresAt: voucher.expiresAt.split("T")[0],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.title.trim() || !form.discountValue) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        sellerId: (session?.user as any)?.id,
        ...form,
        discountValue: parseInt(form.discountValue),
        minOrderValue: form.minOrderValue ? parseInt(form.minOrderValue) : null,
        maxDiscount: form.maxDiscount ? parseInt(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
      };

      let res;
      if (editingId) {
        res = await apiClient.request(`/api/seller/vouchers/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        } as any);
      } else {
        res = await apiClient.request("/api/seller/vouchers", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        } as any);
      }

      if (res.ok || res.status === 201) {
        toast.success(editingId ? "Voucher updated successfully" : "Voucher created successfully");
        resetForm();
        fetchVouchers();
      } else {
        toast.error(await readApiError(res, "Error while saving"));
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;
    try {
      const res = await apiClient.request(`/api/seller/vouchers/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ sellerId: (session?.user as any)?.id }),
        headers: { "Content-Type": "application/json" }
      } as any);
      if (res.status === 204) {
        toast.success("Voucher deleted successfully");
        fetchVouchers();
      } else {
        toast.error(await readApiError(res, "Unable to delete"));
      }
    } catch {
      toast.error("Error while deleting");
    }
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const res = await apiClient.request(`/api/seller/vouchers/${voucher.id}`, {
        method: "PUT",
        body: JSON.stringify({ sellerId: (session?.user as any)?.id, isActive: !voucher.isActive }),
        headers: { "Content-Type": "application/json" }
      } as any);
      if (res.ok) {
        toast.success(voucher.isActive ? "Voucher disabled" : "Voucher enabled");
        fetchVouchers();
      }
    } catch {
      toast.error("Error while updating");
    }
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaTag className="text-green-600" />
          Voucher Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <FaPlus />
          Create Voucher
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Voucher" : "Create New Voucher"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Voucher Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                  className="w-full px-4 py-2 border rounded-lg uppercase"
                  placeholder="E.g. SUMMER20"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="E.g. Summer 20% Off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value *</label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder={form.discountType === "PERCENTAGE" ? "E.g. 20" : "E.g. 50000"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Order Value (VND)</label>
                  <input
                    type="number"
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="E.g. 100000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Discount (VND)</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="E.g. 100000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Leave blank = unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiration Date *</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher List */}
      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow">
          No vouchers available yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Code</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Title</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Discount</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Usage</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Expires</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className={`border-t hover:bg-gray-50 ${isExpired(v.expiresAt) ? "bg-red-50" : ""}`}>
                  <td className="py-4 px-4">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono font-semibold text-sm">{v.code}</code>
                  </td>
                  <td className="py-4 px-4 font-medium">{v.title}</td>
                  <td className="py-4 px-4">
                    <span className="text-green-600 font-semibold">
                      {v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-500">
                    {v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ""}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <span className={isExpired(v.expiresAt) ? "text-red-500" : "text-gray-500"}>
                      {formatDate(v.expiresAt)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(v)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        v.isActive && !isExpired(v.expiresAt)
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {v.isActive && !isExpired(v.expiresAt) ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(v)} className="text-blue-500 hover:underline text-sm flex items-center gap-1">
                        <FaEdit /> Edit
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:underline text-sm flex items-center gap-1">
                        <FaTrash /> Delete
                      </button>
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
}
