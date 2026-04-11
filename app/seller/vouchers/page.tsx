"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { format } from "date-fns";

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  merchantId: string | null;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

const SellerVouchersPage = () => {
  const { data: session } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    perUserLimit: 1,
    startsAt: format(new Date(), "yyyy-MM-dd"),
    expiresAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    isActive: true,
  });

  useEffect(() => {
    initializeMerchant();
  }, [session]);

  useEffect(() => {
    if (merchantId) {
      fetchVouchers();
    }
  }, [merchantId, filterActive]);

  const initializeMerchant = async () => {
    if (!session?.user?.email) return;

    try {
      const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.merchantId) {
          setMerchantId(userData.merchantId);
        } else {
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

  const fetchVouchers = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const response = await apiClient.get("/api/vouchers");
      if (response.ok) {
        const data = await response.json();
        // Filter vouchers that belong to this merchant or are platform-wide
        let merchantVouchers = data.filter((v: Voucher) => 
          v.merchantId === merchantId || v.merchantId === null
        );
        
        // Filter by active status
        if (filterActive === true) {
          merchantVouchers = merchantVouchers.filter((v: Voucher) => v.isActive && new Date(v.expiresAt) > new Date());
        } else if (filterActive === false) {
          merchantVouchers = merchantVouchers.filter((v: Voucher) => !v.isActive || new Date(v.expiresAt) <= new Date());
        }
        
        setVouchers(merchantVouchers);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const openAddModal = () => {
    setEditingVoucher(null);
    setFormData({
      code: generateCode(),
      title: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 0,
      perUserLimit: 1,
      startsAt: format(new Date(), "yyyy-MM-dd"),
      expiresAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      title: voucher.title,
      description: voucher.description || "",
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue || 0,
      maxDiscount: voucher.maxDiscount || 0,
      usageLimit: voucher.usageLimit || 0,
      perUserLimit: voucher.perUserLimit,
      startsAt: format(new Date(voucher.startsAt), "yyyy-MM-dd"),
      expiresAt: format(new Date(voucher.expiresAt), "yyyy-MM-dd"),
      isActive: voucher.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;

    try {
      const payload = {
        ...formData,
        merchantId: formData.code ? merchantId : null, // If creating new, it's merchant-specific
        minOrderValue: formData.minOrderValue > 0 ? formData.minOrderValue * 100 : null,
        maxDiscount: formData.maxDiscount > 0 ? formData.maxDiscount * 100 : null,
        usageLimit: formData.usageLimit > 0 ? formData.usageLimit : null,
      };

      let response;
      if (editingVoucher) {
        response = await apiClient.put(`/api/vouchers/${editingVoucher.id}`, payload);
      } else {
        response = await apiClient.post("/api/vouchers", payload);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save voucher");
      }

      toast.success(editingVoucher ? "Voucher updated successfully" : "Voucher created successfully");
      setShowModal(false);
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save voucher");
    }
  };

  const toggleVoucherStatus = async (voucherId: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.put(`/api/vouchers/${voucherId}`, {
        isActive: !currentStatus,
      });
      
      if (!response.ok) throw new Error("Failed to update voucher");
      
      toast.success(`Voucher ${!currentStatus ? "activated" : "deactivated"}`);
      fetchVouchers();
    } catch (error) {
      toast.error("Failed to update voucher status");
    }
  };

  const deleteVoucher = async (voucherId: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;

    try {
      const response = await apiClient.delete(`/api/vouchers/${voucherId}`);
      
      if (!response.ok) throw new Error("Failed to delete voucher");
      
      toast.success("Voucher deleted successfully");
      fetchVouchers();
    } catch (error) {
      toast.error("Failed to delete voucher");
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  if (!merchantId && !loading) {
    return (
      <div className="bg-white">
        <SectionTitle title="My Vouchers" path="Home | Seller | Vouchers" />
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
      <SectionTitle title="My Vouchers" path="Home | Seller | Vouchers" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Vouchers</h1>
            <p className="text-sm text-gray-500">Manage your shop discount vouchers</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <FaPlus className="w-4 h-4" />
            Create Voucher
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { label: "All", value: null },
            { label: "Active", value: true },
            { label: "Inactive/Expired", value: false },
          ].map((filter) => (
            <button
              key={String(filter.value)}
              onClick={() => setFilterActive(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterActive === filter.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Vouchers Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No vouchers found. Create your first voucher!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((voucher) => {
              const expired = isExpired(voucher.expiresAt);
              const isUsable = voucher.isActive && !expired && voucher.usedCount < (voucher.usageLimit || Infinity);
              
              return (
                <div
                  key={voucher.id}
                  className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
                    !isUsable ? "border-gray-200 opacity-75" : "border-blue-200"
                  }`}
                >
                  <div className={`p-4 ${isUsable ? "bg-blue-50" : "bg-gray-50"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{voucher.title}</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          {voucher.discountType === "PERCENTAGE" 
                            ? `${voucher.discountValue}% OFF` 
                            : `$${formatPrice(voucher.discountValue)} OFF`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isUsable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>
                        {expired ? "Expired" : voucher.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Code:</span>
                        <span className="font-mono font-medium text-gray-900">{voucher.code}</span>
                      </div>
                      
                      {voucher.minOrderValue && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Min. Order:</span>
                          <span className="text-gray-900">${formatPrice(voucher.minOrderValue)}</span>
                        </div>
                      )}
                      
                      {voucher.maxDiscount && voucher.discountType === "PERCENTAGE" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Max Discount:</span>
                          <span className="text-gray-900">${formatPrice(voucher.maxDiscount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Usage:</span>
                        <span className="text-gray-900">
                          {voucher.usedCount} / {voucher.usageLimit || "∞"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Per User:</span>
                        <span className="text-gray-900">{voucher.perUserLimit}x</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Expires:</span>
                        <span className={`${expired ? "text-red-600" : "text-gray-900"}`}>
                          {format(new Date(voucher.expiresAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleVoucherStatus(voucher.id, voucher.isActive)}
                        className={`p-2 rounded-lg ${
                          voucher.isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={voucher.isActive ? "Deactivate" : "Activate"}
                      >
                        {voucher.isActive ? (
                          <FaToggleOn className="w-5 h-5" />
                        ) : (
                          <FaToggleOff className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(voucher)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteVoucher(voucher.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingVoucher ? "Edit Voucher" : "Create New Voucher"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voucher Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Summer Sale 20% Off"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, code: generateCode() })}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {formData.discountType === "PERCENTAGE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Discount (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                      placeholder="Leave empty for no limit"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Value (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
                    placeholder="Leave empty for no minimum"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                      placeholder="Leave empty for unlimited"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Per User Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.perUserLimit}
                      onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Voucher is active
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  {editingVoucher ? "Update Voucher" : "Create Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerVouchersPage;
