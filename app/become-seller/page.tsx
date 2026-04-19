"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

export default function BecomeSellerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: "",
    shopDescription: "",
    shopPhone: "",
    shopAddress: "",
  });
  const [loading, setLoading] = useState(false);

  // If the user is already a seller, redirect to seller dashboard
  useEffect(() => {
    if (session?.user?.role === "seller") {
      router.replace("/seller/dashboard");
    }
  }, [session?.user?.role, router]);

  if (session?.user?.role === "seller") {
    return null;
  }

  const handleSubmit = async () => {
    if (!form.shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Please log in first");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post("/api/seller/register", {
        userId: session.user.id,
        ...form,
      });

      if (res.status === 201) {
        toast.success("Registration successful! Please wait for admin approval.");
        router.push("/");
      } else {
        const err = await res.json();
        toast.error(err.error || "Registration failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-5">
      <h1 className="text-3xl font-bold mb-2">Become a Seller</h1>
      <p className="text-gray-500 mb-8">
        Fill in your shop information. The admin will review it within 24 hours.
      </p>

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
            onChange={(e) =>
              setForm({ ...form, shopDescription: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
            placeholder="Write a short description of your shop..."
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
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Register as a Seller"}
        </button>
      </div>
    </div>
  );
}