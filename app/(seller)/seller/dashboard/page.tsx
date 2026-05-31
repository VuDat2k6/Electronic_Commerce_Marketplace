"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { FaBagShopping, FaBoxOpen, FaClock, FaDollarSign } from "react-icons/fa6";
import { ChevronRight, Eye, Package, Plus, Ticket, TrendingUp, Upload } from "lucide-react";

interface RecentOrder {
  id: string;
  displayId: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  date: string;
}

interface DashboardStats {
  totalProducts: number;
  totalOrderItems: number;
  totalOrders?: number;
  totalRevenue: number;
  monthlyRevenue?: number;
  weeklyRevenue?: number;
  weeklyRevenueChangePercent?: number | null;
  todayOrderCount: number;
  pendingOrderCount: number;
  recentOrders?: RecentOrder[];
  storeViewsLast7Days?: number;
  storeViewsChangePercent?: number | null;
}

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  trendLabel?: string;
}

const StatCard = ({ title, value, icon: Icon, color, trendLabel }: StatCardProps) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className={`bg-gradient-to-br ${color} p-6 text-white`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="h-6 w-6" />
        </div>
        {trendLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-sm font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            {trendLabel}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold">{value}</h3>
      <p className="mt-1 text-sm text-white/80">{title}</p>
    </div>
  </div>
);

const quickActions = [
  {
    title: "Add New Product",
    description: "Create a new product in your store",
    icon: Plus,
    href: "/seller/products/new",
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Bulk Import",
    description: "Import multiple products via CSV file",
    icon: Upload,
    href: "/seller/bulk-upload",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    title: "Create Voucher",
    description: "Set up discount codes for your store",
    icon: Ticket,
    href: "/seller/vouchers",
    color: "from-pink-500 to-pink-600",
  },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-cyan-100 text-cyan-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELED: "bg-red-100 text-red-700",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);

const formatChange = (value?: number | null) => {
  if (value === null || value === undefined) return "No previous week data";
  if (value === 0) return "No change from last week";
  return `${value > 0 ? "+" : ""}${value}% compared to last week`;
};

export default function SellerDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = (session?.user as any)?.id;
  const recentOrders = stats?.recentOrders || [];

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setError("");
        const res = await apiClient.get(`/api/seller/dashboard?sellerId=${userId}`);
        if (!res.ok) throw new Error("Failed to load dashboard");

        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Error loading dashboard:", e);
        setError("Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 bg-gray-50 p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative">
          <h1 className="mb-2 text-3xl font-bold">Good morning!</h1>
          <p className="text-purple-100">Here is your store overview for today</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={FaBoxOpen} color="from-purple-500 to-purple-600" />
        <StatCard title="Orders Today" value={stats?.todayOrderCount ?? 0} icon={FaBagShopping} color="from-cyan-500 to-cyan-600" />
        <StatCard title="Monthly Revenue" value={formatPrice(stats?.monthlyRevenue ?? stats?.totalRevenue ?? 0)} icon={FaDollarSign} color="from-green-500 to-green-600" />
        <StatCard title="Pending Orders" value={stats?.pendingOrderCount ?? 0} icon={FaClock} color="from-pink-500 to-pink-600" />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group rounded-2xl bg-gradient-to-br ${action.color} p-6 text-white transition-all hover:scale-[1.02] hover:shadow-xl`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition-transform group-hover:scale-110">
              <action.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">{action.title}</h3>
            <p className="mt-1 text-sm text-white/80">{action.description}</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Get Started <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
          <Link href="/seller/orders" className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Products</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                      <Package className="h-6 w-6 text-purple-500" />
                    </div>
                    <p className="font-semibold text-gray-800">No orders yet</p>
                    <p className="mt-1 text-sm text-gray-500">New customer orders will appear here.</p>
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-6 py-4 font-medium text-purple-600">{order.displayId}</td>
                    <td className="px-6 py-4 text-gray-700">{order.customer}</td>
                    <td className="px-6 py-4 text-gray-600">{order.items} {order.items === 1 ? "product" : "products"}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status] || statusColors.PENDING}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href="/seller/orders" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">This Week&apos;s Revenue</h3>
            <Link href="/seller/analytics" className="text-sm font-medium text-purple-600 hover:text-purple-700">
              View Details
            </Link>
          </div>
          <div className="py-8 text-center">
            <p className="mb-2 text-4xl font-bold text-green-600">{formatPrice(stats?.weeklyRevenue ?? 0)}</p>
            <div className="mt-4 flex items-center justify-center gap-1 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>{formatChange(stats?.weeklyRevenueChangePercent)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Store Views</h3>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="py-8 text-center">
            <p className="mb-2 text-4xl font-bold text-purple-600">{stats?.storeViewsLast7Days ?? 0}</p>
            <p className="text-gray-500">views</p>
            <div className="mt-4 flex items-center justify-center gap-1 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>View tracking will appear after analytics is enabled.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
