// BecomeSellerPage - Modern design with gradient theme
"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Store, CheckCircle2, Clock3, Home, ShieldAlert } from "lucide-react";

type AccountStatus = {
  id: string;
  email: string | null;
  role: string;
  shopStatus: string | null;
  shopName: string | null;
};

function SellerStatusNotice({
  status,
  shopName,
  title,
  message,
}: {
  status: string | null;
  shopName?: string | null;
  title?: string;
  message?: string;
}) {
  const isSuspended = status === "SUSPENDED";
  const Icon = isSuspended ? ShieldAlert : Clock3;
  const fallbackTitle = isSuspended ? "Shop suspended" : "Shop awaiting approval";
  const fallbackMessage = isSuspended
    ? `Your shop${shopName ? ` "${shopName}"` : ""} is temporarily disabled. Seller tools, product listings, vouchers, bulk upload, and checkout for this shop are blocked until an admin reactivates it.`
    : `Your shop${shopName ? ` "${shopName}"` : ""} is waiting for admin approval. Seller tools will unlock after the shop is approved.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-2xl"
      >
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${isSuspended ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
          <Icon className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Seller account
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          {title || fallbackTitle}
        </h1>
        <p className="mt-3 text-gray-600">
          {message || fallbackMessage}
        </p>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-purple-700 hover:to-pink-600"
        >
          <Home className="h-4 w-4" />
          Back to store
        </button>
      </motion.div>
    </div>
  );
}

export default function BecomeSellerPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: "",
    shopDescription: "",
    shopPhone: "",
    shopAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [statusError, setStatusError] = useState(false);

  const sessionUser = session?.user as any;

  useEffect(() => {
    let cancelled = false;

    const fetchAccountStatus = async () => {
      if (status === "loading") return;
      if (status === "unauthenticated") {
        setStatusLoading(false);
        return;
      }

      setStatusLoading(true);
      setStatusError(false);

      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to verify account status");

        const data = await res.json();
        const currentUser = data?.user as AccountStatus | undefined;
        if (!currentUser || cancelled) return;

        setAccountStatus(currentUser);
        if (
          currentUser.role !== sessionUser?.role ||
          currentUser.shopStatus !== sessionUser?.shopStatus
        ) {
          await update({
            role: currentUser.role,
            shopStatus: currentUser.shopStatus,
          });
        }
      } catch {
        if (!cancelled) {
          setStatusError(true);
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    };

    fetchAccountStatus();

    return () => {
      cancelled = true;
    };
  }, [sessionUser?.role, sessionUser?.shopStatus, status, update]);

  useEffect(() => {
    if (statusLoading || statusError) return;
    if (accountStatus?.role === "seller" && accountStatus.shopStatus === "ACTIVE") {
      router.replace("/seller/dashboard");
    }
    if (accountStatus?.role === "seller" && accountStatus.shopStatus !== "ACTIVE") {
      router.replace("/seller/status");
    }
  }, [accountStatus?.role, accountStatus?.shopStatus, router, statusError, statusLoading]);

  if (statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white" />
      </div>
    );
  }

  if (statusError && sessionUser?.role === "seller") {
    return (
      <SellerStatusNotice
        status="PENDING"
        title="Unable to verify seller status"
        message="We could not confirm your current shop status. Please refresh the page before using seller tools."
      />
    );
  }

  if (accountStatus?.role === "seller" && accountStatus.shopStatus === "ACTIVE") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white" />
      </div>
    );
  }

  if (accountStatus?.role === "seller" && accountStatus.shopStatus !== "ACTIVE") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white" />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!form.shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    if (!(session?.user as any)?.id) {
      toast.error("Please log in first");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post("/api/seller/register", {
        userId: (session?.user as any)?.id,
        ...form,
      });

      if (res.status === 201) {
        await update({ role: "seller", shopStatus: "PENDING" });
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
