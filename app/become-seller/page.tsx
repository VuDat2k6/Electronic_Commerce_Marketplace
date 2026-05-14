// BecomeSellerPage - Modern design with gradient theme
"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Store, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Store className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Become a Seller</h1>
          <p className="text-white/80 mt-2">Set up your shop and start selling today</p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { title: "Free to Join", desc: "No upfront costs" },
            { title: "Easy Setup", desc: "Get started quickly" },
            { title: "24/7 Support", desc: "Help when you need it" },
          ].map((item) => (
            <div key={item.title} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <CheckCircle2 className="w-6 h-6 text-green-300 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">{item.title}</p>
              <p className="text-xs text-white/70">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name *</label>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                placeholder="e.g. TechStore VN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Description</label>
              <textarea
                value={form.shopDescription}
                onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none"
                rows={3}
                placeholder="Tell customers about your shop..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={form.shopPhone}
                  onChange={(e) => setForm({ ...form, shopPhone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                  placeholder="+84 123 456 789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input
                  type="text"
                  value={form.shopAddress}
                  onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                  placeholder="Your location"
                />
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-3.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Store className="w-4 h-4" />
                  Register as a Seller
                </>
              )}
            </motion.button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            The admin will review your application within 24 hours.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
