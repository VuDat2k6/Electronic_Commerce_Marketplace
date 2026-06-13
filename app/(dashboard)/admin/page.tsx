"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardSidebar } from "@/components";
import {
  AlertTriangle,
  ChevronRight,
  Grid3X3,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardData {
  stats: {
    totalUsers: number;
    activeSellers: number;
    pendingSellers: number;
    totalProducts: number;
    publishedProducts: number;
    archivedProducts: number;
    categoryCount: number;
    totalOrders: number;
    monthlyOrders: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  revenueSeries: Array<{
    label: string;
    revenue: number;
    height: number;
  }>;
  recentOrders: Array<{
    id: string;
    displayId: string;
    customer: string;
    total: number;
    status: string;
    date: string;
  }>;
  topProducts: Array<{
    name: string;
    sold: number;
    revenue: number;
  }>;
}

const statusColors: Record<string, string> = {
  processing: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-700",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

const statCards = (data: DashboardData) => [
  {
    label: "Total Users",
    value: formatNumber(data.stats.totalUsers),
    icon: Users,
    gradient: "from-purple-500 to-purple-600",
    hint: `${formatNumber(data.stats.activeSellers)} active sellers`,
  },
  {
    label: "Orders This Month",
    value: formatNumber(data.stats.monthlyOrders),
    icon: ShoppingCart,
    gradient: "from-cyan-500 to-cyan-600",
    hint: `${formatNumber(data.stats.totalOrders)} total orders`,
  },
  {
    label: "Monthly Revenue",
    value: formatPrice(data.stats.monthlyRevenue),
    icon: Store,
    gradient: "from-green-500 to-green-600",
    hint: `${formatPrice(data.stats.totalRevenue)} lifetime`,
  },
  {
    label: "Published Products",
    value: formatNumber(data.stats.publishedProducts),
    icon: Package,
    gradient: "from-pink-500 to-pink-600",
    hint: `${formatNumber(data.stats.totalProducts)} total products`,
  },
];

const AdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load admin dashboard");

        setDashboard(await response.json());
      } catch {
        setError("Unable to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start bg-gray-50 max-xl:flex-col">
      <DashboardSidebar />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 lg:text-3xl">Overview</h1>
          <p className="mt-1 text-gray-500">Live platform data from orders, users, products, and sellers.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading || !dashboard ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {statCards(dashboard).map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className={`bg-gradient-to-br ${stat.gradient} p-6 text-white`}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                    <p className="mt-1 text-sm text-white/80">{stat.label}</p>
                    <p className="mt-3 text-xs font-medium text-white/75">{stat.hint}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-3">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-800">12-Day Revenue</h3>
                  <span className="text-sm text-gray-500">{formatPrice(dashboard.stats.monthlyRevenue)} this month</span>
                </div>
                <div className="p-6">
                  <div className="flex h-64 items-end justify-between gap-2">
                    {dashboard.revenueSeries.map((point) => (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                        <motion.div
                          className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-cyan-400"
                          initial={{ height: 0 }}
                          animate={{ height: `${point.height}%` }}
                          title={`${point.label}: ${formatPrice(point.revenue)}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-400">
                    {dashboard.revenueSeries.map((point) => (
                      <span key={point.label}>{point.label}</span>
                    ))}
                  </div>
                  {dashboard.revenueSeries.every((point) => point.revenue === 0) && (
                    <p className="mt-4 text-center text-sm text-gray-500">No revenue recorded in this period.</p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 text-white">
                <div className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-100">Operational Queue</p>
                      <h3 className="mt-1 text-4xl font-bold">{dashboard.stats.pendingSellers}</h3>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                      <AlertTriangle className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    <Link href="/admin/sellers" className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 hover:bg-white/20">
                      <span>Pending seller approvals</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link href="/admin/products" className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 hover:bg-white/20">
                      <span>{dashboard.stats.archivedProducts} archived products</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link href="/admin/categories" className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 hover:bg-white/20">
                      <span>{dashboard.stats.categoryCount} categories</span>
                      <Grid3X3 className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                  <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dashboard.recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">No orders yet.</td>
                        </tr>
                      ) : (
                        dashboard.recentOrders.map((order) => (
                          <tr key={order.id} className="transition-colors hover:bg-gray-50/60">
                            <td className="px-6 py-4 font-medium text-purple-600">{order.displayId}</td>
                            <td className="px-6 py-4 text-gray-700">{order.customer}</td>
                            <td className="px-6 py-4 font-medium text-gray-800">{formatPrice(order.total)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status] || statusColors.processing}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-800">Best Selling Products</h3>
                  <Link href="/admin/products" className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {dashboard.topProducts.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-gray-500">No product sales yet.</div>
                  ) : (
                    dashboard.topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50/60">
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sold} sold</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">{formatPrice(product.revenue)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
