"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import Image from "next/image";

interface Merchant {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  shippingFee: number;
  avatar: string | null;
  banner: string | null;
}

const SellerShopPage = () => {
  const { data: session } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    shippingFee: 0,
    banner: "",
    avatar: "",
  });

  useEffect(() => {
    initializeMerchant();
  }, [session]);

  const initializeMerchant = async () => {
    if (!session?.user?.email) return;

    try {
      const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.merchantId) {
          setMerchantId(userData.merchantId);
          fetchMerchantData(userData.merchantId);
        } else {
          const merchantsResponse = await apiClient.get("/api/merchants");
          if (merchantsResponse.ok) {
            const merchants = await merchantsResponse.json();
            if (merchants.length > 0) {
              setMerchantId(merchants[0].id);
              fetchMerchantData(merchants[0].id);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.error("Error initializing merchant:", e);
      setLoading(false);
    }
  };

  const fetchMerchantData = async (id: string) => {
    try {
      const response = await apiClient.get(`/api/merchants/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMerchant(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          shippingFee: data.shippingFee || 0,
          banner: data.banner || "",
          avatar: data.avatar || "",
        });
        setPreviewBanner(data.banner);
        setPreviewAvatar(data.avatar);
      }
    } catch (error) {
      console.error("Error fetching merchant data:", error);
      toast.error("Failed to load shop data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;

    setSaving(true);
    try {
      const response = await apiClient.put(`/api/merchants/${merchantId}`, {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        shippingFee: formData.shippingFee,
        banner: formData.banner,
        avatar: formData.avatar,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update shop profile");
      }

      toast.success("Shop profile updated successfully!");
      
      // Update local state
      setMerchant((prev) => prev ? {
        ...prev,
        ...formData,
        status: prev.status,
      } : null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update shop profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (field: "banner" | "avatar", value: string) => {
    setFormData({ ...formData, [field]: value });
    setPreviewBanner(field === "banner" ? value : previewBanner);
    setPreviewAvatar(field === "avatar" ? value : previewAvatar);
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

  if (!merchantId) {
    return (
      <div className="bg-white">
        <SectionTitle title="Shop Settings" path="Home | Seller | Shop Settings" />
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
      <SectionTitle title="Shop Settings" path="Home | Seller | Shop Settings" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Shop Settings</h1>
          <p className="text-sm text-gray-500">Manage your shop profile and settings</p>
        </div>

        {/* Shop Preview Banner */}
        {previewBanner && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <Image
              src={previewBanner}
              alt="Shop Banner"
              width={800}
              height={200}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell customers about your shop..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Your shop address..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Shop Images */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shop Images</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Avatar URL
                </label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => handleImageChange("avatar", e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {previewAvatar && (
                  <div className="mt-2">
                    <Image
                      src={previewAvatar}
                      alt="Avatar Preview"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Banner URL
                </label>
                <input
                  type="text"
                  value={formData.banner}
                  onChange={(e) => handleImageChange("banner", e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended size: 1200x400 pixels
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Settings */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Settings</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Shipping Fee (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingFee}
                onChange={(e) => setFormData({ ...formData, shippingFee: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This fee will be added to each order unless overridden by specific product settings
              </p>
            </div>
          </div>

          {/* Shop Status */}
          {merchant && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shop Status</h2>
              
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  merchant.status === "ACTIVE" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {merchant.status}
                </span>
                <p className="text-sm text-gray-500">
                  {merchant.status === "ACTIVE" 
                    ? "Your shop is visible to customers" 
                    : "Contact admin to activate your shop"}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerShopPage;
