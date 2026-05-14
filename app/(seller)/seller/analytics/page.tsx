"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { FaChartLine, FaBoxOpen, FaDollarSign, FaShoppingBag, FaTrophy, FaChartBar } from "react-icons/fa6";

interface AnalyticsData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: number;
  recentRevenue: number;
  topProducts: any[];
  dailyRevenue: { date: string; revenue: number }[];
  orderStatusBreakdown: Record<string, number>;
  averageOrderValue: number;
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
  <div className={`bg-white rounded-xl shadow p-6 flex items-center gap-x-4 border-l-4 ${color}`}>
    <Icon className="text-3xl text-gray-400" />
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
};

export default function SellerAnalyticsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (status === "loading") return;

      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(`/api/seller/analytics/overview?sellerId=${session.user.id}`);

        if (!res.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const result = await res.json();
        setData(result);
      } catch (e) {
        console.error("Error loading analytics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session?.user?.id, status]);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (!data) {
    return <div className="text-center py-20 text-gray-500">No data available</div>;
  }

  const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.revenue), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaChartLine className="text-green-600" />
          Analytics & Statistics
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={FaDollarSign}
          color="border-green-500"
        />
        <StatCard
          title="Total Orders"
          value={data.totalOrders}
          icon={FaShoppingBag}
          color="border-blue-500"
        />
        <StatCard
          title="Total Products"
          value={data.totalProducts}
          icon={FaBoxOpen}
          color="border-purple-500"
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(data.averageOrderValue)}
          icon={FaChartBar}
          color="border-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Revenue in the Last 7 Days</h2>
          <p className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(data.recentRevenue)}</p>
          <p className="text-gray-500">{data.recentOrders} orders</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order Status</h2>
          <div className="space-y-3">
            {Object.entries(data.orderStatusBreakdown).map(([status, count]) => {
              const labels: Record<string, string> = {
                pending: "Pending",
                processing: "Processing",
                delivered: "Delivered",
                canceled: "Canceled",
              };
              const colors: Record<string, string> = {
                pending: "bg-yellow-500",
                processing: "bg-blue-500",
                delivered: "bg-green-500",
                canceled: "bg-red-500",
              };
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[status] || "bg-gray-400"}`} />
                  <span className="flex-1 text-sm text-gray-600">{labels[status] || status}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-6">Revenue in the Last 30 Days</h2>
        <div className="flex items-end gap-1 h-48">
          {data.dailyRevenue.map((day, index) => {
            const heightPercent = (day.revenue / maxRevenue) * 100;
            const dateLabel = new Date(day.date).toLocaleDateString("en-US", { day: "numeric", month: "short" });
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600 min-h-[2px] relative"
                    style={{ height: `${Math.max(heightPercent, 1)}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {formatCurrency(day.revenue)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 rotate-45 origin-left translate-y-8">
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FaTrophy className="text-yellow-500" />
          Best-Selling Products
        </h2>
        {data.topProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sales data yet</p>
        ) : (
          <div className="space-y-4">
            {data.topProducts.map((item: any, index: number) => (
              <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-700 font-bold rounded-full">
                  {index + 1}
                </div>
                <img
                  src={item.product?.mainImage || "/placeholder.jpg"}
                  alt={item.product?.title}
                  className="w-14 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product?.title || "—"}</p>
                  <p className="text-sm text-gray-500">Sold: {item.quantitySold}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-gray-400">revenue</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}