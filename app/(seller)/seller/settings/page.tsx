"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

export default function SellerSettingsPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    shopName: "",
    shopDescription: "",
    shopPhone: "",
    shopAddress: "",
  });
  const [shopStatus, setShopStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(`/api/seller/settings?sellerId=${session.user.id}`);

        if (!res.ok) {
          throw new Error("Failed to fetch settings");
        }

        const data = await res.json();
        setForm({
          shopName: data.shopName || "",
          shopDescription: data.shopDescription || "",
          shopPhone: data.shopPhone || "",
          shopAddress: data.shopAddress || "",
        });
        setShopStatus(data.shopStatus || "");
      } catch {
        toast.error("Unable to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error("Seller information not found");
      return;
    }

    if (!form.shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.put("/api/seller/settings", {
        sellerId: session.user.id,
        ...form,
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error while saving");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      SUSPENDED: "bg-red-100 text-red-800",
    };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || ""}`}>{status}</span>;
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Shop Settings</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Shop Status</label>
          <div>{statusBadge(shopStatus)}</div>
          {shopStatus === "PENDING" && (
            <p className="text-sm text-yellow-600 mt-2">Your shop is pending admin approval.</p>
          )}
          {shopStatus === "SUSPENDED" && (
            <p className="text-sm text-red-600 mt-2">Your shop has been suspended. Contact the admin for more information.</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shop Name *</label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="e.g. TechStore VN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shop Description</label>
            <textarea
              value={form.shopDescription}
              onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="A short description of your shop..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="text"
              value={form.shopPhone}
              onChange={(e) => setForm({ ...form, shopPhone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={form.shopAddress}
              onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}