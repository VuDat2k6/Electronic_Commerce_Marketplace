"use client";

import React from "react";
import Link from "next/link";
import { DashboardSidebar } from "@/components";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Eye,
  TrendingUp,
  Download,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  {
    label: "Total Users",
    value: "12,456",
    change: "+12%",
    changeType: "up" as const,
    icon: Users,
    gradient: "from-purple-500 to-purple-600",
  },
  {
    label: "Monthly Orders",
    value: "3,789",
    change: "+8%",
    changeType: "up" as const,
    icon: ShoppingCart,
    gradient: "from-cyan-500 to-cyan-600",
  },
  {
    label: "Monthly Revenue",
    value: "89.000.000₫",
    change: "+24%",
    changeType: "up" as const,
    icon: DollarSign,
    gradient: "from-green-500 to-green-600",
  },
  {
    label: "Total Products",
    value: "1,234",
    change: "-3%",
    changeType: "down" as const,
    icon: Package,
    gradient: "from-pink-500 to-pink-600",
  },
];

const recentOrders = [
  { id: "ORD001", customer: "Nguyen Van A", total: 29900000, status: "COMPLETED", date: "2 hours ago" },
  { id: "ORD002", customer: "Tran Thi B", total: 45000000, status: "PROCESSING", date: "3 hours ago" },
  { id: "ORD003", customer: "Le Van C", total: 18900000, status: "PENDING", date: "5 hours ago" },
  { id: "ORD004", customer: "Pham Thi D", total: 32000000, status: "SHIPPED", date: "6 hours ago" },
  { id: "ORD005", customer: "Hoang Van E", total: 8900000, status: "COMPLETED", date: "8 hours ago" },
];

const topProducts = [
  { name: "4K IP Camera", sold: 234, revenue: 6996600000 },
  { name: "Smart Lock", sold: 156, revenue: 7020000000 },
  { name: "Alarm System", sold: 89, revenue: 1682100000 },
  { name: "WiFi Extender", sold: 67, revenue: 596300000 },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-cyan-100 text-cyan-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const formatPrice = (price: number) => {
  return (price / 100).toLocaleString('vi-VN') + '₫';
};

const AdminDashboardPage = () => {
  return (
    <div className="bg-gray-50 flex justify-start max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />

      <div className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Overview</h1>
            <p className="text-gray-500 mt-1">Welcome back!</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-600 transition-all shadow-md hover:shadow-lg">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-lg"
            >
              <div className={`p-6 bg-gradient-to-br ${stat.gradient} text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full bg-white/20 ${
                    stat.changeType === 'up' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {stat.changeType === 'up' ? (
                      <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5" />
                    )}
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
                <p className="text-white/80 text-sm mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts & Tables Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">30-Day Revenue</h3>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                <option>30 days</option>
                <option>7 days</option>
                <option>90 days</option>
              </select>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-between gap-2">
                {[65, 45, 78, 52, 90, 68, 85, 72, 88, 56, 74, 92].map((height, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-t-lg transition-all cursor-pointer"
                    style={{ height: `${height}%` }}
                    whileHover={{ scaleY: 1.05 }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-400">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
              </div>
            </div>
          </div>

          {/* Visitors Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl overflow-hidden text-white"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-purple-100 text-sm">Visitors Today</p>
                  <h3 className="text-4xl font-bold mt-1">1,247</h3>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-7 h-7" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-300 mb-4">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+12.5% compared to yesterday</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Desktop</span>
                  <span className="font-medium">62%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: "62%" }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Mobile</span>
                  <span className="font-medium">35%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/70 rounded-full" style={{ width: "35%" }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Orders & Top Products */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
              <Link href="/admin/orders" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-purple-600">{order.id}</td>
                      <td className="px-6 py-4 text-gray-700">{order.customer}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{formatPrice(order.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Best Selling Products</h3>
              <Link href="/admin/products" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {topProducts.map((product, index) => (
                <div key={product.name} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-200 text-gray-600" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">{formatPrice(product.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
