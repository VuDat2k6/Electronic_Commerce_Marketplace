"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { FaBoxOpen, FaBagShopping, FaDollarSign, FaClock } from "react-icons/fa6";
import { Package, ShoppingBag, TrendingUp, Clock, Plus, Upload, Ticket, ChevronRight, DollarSign as DollarIcon, Eye } from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalOrderItems: number;
  totalRevenue: number;
  todayOrderCount: number;
  pendingOrderCount: number;
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className={`p-6 bg-gradient-to-br ${color} text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-6 h-6" />
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full bg-white/20">
          <TrendingUp className="w-3.5 h-3.5" />
          +12%
        </span>
      </div>
      <h3 className="text-3xl font-bold">{value}</h3>
      <p className="text-white/80 text-sm mt-1">{title}</p>
    </div>
  </div>
);

const quickActions = [
  { 
    title: "Add New Product", 
    description: "Create a new product in your store",
    icon: Plus,
    href: "/seller/products/new",
    color: "from-purple-500 to-purple-600"
  },
  { 
    title: "Bulk Import", 
    description: "Import multiple products via CSV file",
    icon: Upload,
    href: "/seller/bulk-upload",
    color: "from-cyan-500 to-cyan-600"
  },
  { 
    title: "Create Voucher", 
    description: "Set up discount codes for your store",
    icon: Ticket,
    href: "/seller/vouchers/new",
    color: "from-pink-500 to-pink-600"
  },
];

const recentOrders = [
  { id: "ORD001", customer: "John Smith", items: 2, total: 2990000, status: "PENDING" },
  { id: "ORD002", customer: "Sarah Johnson", items: 1, total: 4500000, status: "CONFIRMED" },
  { id: "ORD003", customer: "Michael Brown", items: 3, total: 1890000, status: "PROCESSING" },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-cyan-100 text-cyan-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
};

const formatPrice = (price: number) => {
  return `$${(price / 100).toFixed(2)}`;
};

export default function SellerDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/api/seller/dashboard?sellerId=${session.user.id}`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-cyan-500 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white rounded-full" />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">Good morning! 👋</h1>
          <p className="text-purple-100">Here is your store overview for today</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={FaBoxOpen} color="from-purple-500 to-purple-600" />
        <StatCard title="New Orders" value={stats?.totalOrderItems ?? 0} icon={FaBagShopping} color="from-cyan-500 to-cyan-600" />
        <StatCard title="Monthly Revenue" value={`$${((stats?.totalRevenue ?? 0) / 100).toFixed(1)}`} icon={FaDollarSign} color="from-green-500 to-green-600" />
        <StatCard title="Pending Orders" value={stats?.pendingOrderCount ?? 0} icon={FaClock} color="from-pink-500 to-pink-600" />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`bg-gradient-to-br ${action.color} rounded-2xl p-6 text-white hover:shadow-xl hover:scale-[1.02] transition-all group`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <action.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">{action.title}</h3>
            <p className="text-white/80 text-sm mt-1">{action.description}</p>
            <div className="flex items-center gap-1 text-white text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Get Started <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
          <Link href="/seller/orders" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Products</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 font-medium text-purple-600">{order.id}</td>
                  <td className="px-6 py-4 text-gray-700">{order.customer}</td>
                  <td className="px-6 py-4 text-gray-600">{order.items} products</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{formatPrice(order.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/seller/orders/${order.id}`} className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue This Week */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">This Week&apos;s Revenue</h3>
            <Link href="/seller/analytics" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View Details
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-green-600 mb-2">$4,520</p>
            <div className="flex items-center justify-center gap-1 text-green-600 text-sm mt-4">
              <TrendingUp className="w-4 h-4" />
              <span>+18% compared to last week</span>
            </div>
          </div>
        </div>

        {/* Store Views */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Store Views</h3>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-purple-600 mb-2">1,234</p>
            <p className="text-gray-500">views</p>
            <div className="flex items-center justify-center gap-1 text-green-600 text-sm mt-4">
              <Eye className="w-4 h-4" />
              <span>+25% compared to last week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
