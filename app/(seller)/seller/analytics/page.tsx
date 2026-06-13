"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { FaChartLine, FaBoxOpen, FaDollarSign, FaTrophy, FaChartBar, FaCartShopping } from "react-icons/fa6";

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

interface DailyRevenuePoint {
  date: string;
  revenue: number;
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

const formatCurrency = (price: number) => {
  return price.toLocaleString("vi-VN") + "₫";
};

const formatCompactCurrency = (price: number) => {
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}B`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
  return String(price);
};

const formatDateLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" });

function RevenueBarChart({ data }: { data: DailyRevenuePoint[] }) {
  const maxRevenue = Math.max(...data.map((day) => day.revenue), 0);
  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);
  const labelIndexes = new Set(
    data
      .map((_, index) => index)
      .filter((index) => index === 0 || index === data.length - 1 || index % 5 === 0),
  );
  const yTicks = [1, 0.75, 0.5, 0.25, 0];

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center text-sm text-gray-500">
        Revenue data is not available yet.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">30-day total</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <p className="text-sm text-gray-500">Peak day: {formatCurrency(maxRevenue)}</p>
      </div>

      <div className="grid grid-cols-[52px_1fr] gap-3">
        <div className="relative h-64 text-xs text-gray-400">
          {yTicks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2"
              style={{ bottom: `${tick * 100}%` }}
            >
              {formatCompactCurrency(maxRevenue * tick)}
            </span>
          ))}
        </div>

        <div>
          <div className="relative h-64 overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white px-2 pt-4">
            {yTicks.map((tick) => (
              <div
                key={tick}
                className="absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{ bottom: `${tick * 100}%` }}
              />
            ))}

            <div className="relative z-10 flex h-full items-end gap-1.5">
              {data.map((day) => {
                const hasRevenue = day.revenue > 0;
                const heightPercent = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                const barHeight = hasRevenue ? Math.max(heightPercent, 8) : 2;

                return (
                  <div key={day.date} className="group flex h-full min-w-0 flex-1 items-end justify-center">
                    <div
                      className={`relative w-full max-w-8 rounded-t-md transition-all duration-200 ${
                        hasRevenue
                          ? "bg-gradient-to-t from-green-600 to-emerald-400 shadow-sm group-hover:from-green-700 group-hover:to-emerald-500"
                          : "bg-gray-200"
                      }`}
                      style={{ height: `${barHeight}%` }}
                      aria-label={`${formatDateLabel(day.date)} revenue ${formatCurrency(day.revenue)}`}
                    >
                      {hasRevenue && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
                          <span className="block">{formatDateLabel(day.date)}</span>
                          <span className="block text-green-200">{formatCurrency(day.revenue)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="mt-3 grid gap-1.5 text-[11px] text-gray-400"
            style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
          >
            {data.map((day, index) => (
              <span key={day.date} className="min-w-0 text-center">
                {labelIndexes.has(index) ? formatDateLabel(day.date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Displays the seller analytics dashboard and fetches the current seller's analytics data.
 *
 * Renders summary statistic cards, recent revenue and order-status breakdowns, a 30-day revenue bar chart,
 * and a best-selling products list. While data is loading it shows a centered loading message; if no data is
 * available it shows a "No data available" notice.
 *
 * @returns The seller analytics dashboard as a JSX element
 */
export default function SellerAnalyticsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as any)?.id;

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (status === "loading") return;

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(`/api/seller/analytics/overview?sellerId=${userId}`);

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
  }, [userId, status]);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (!data) {
    return <div className="text-center py-20 text-gray-500">No data available</div>;
  }

  return (
    <div className="space-y-8">
      <div>
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
          icon={FaCartShopping}
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
        <RevenueBarChart data={data.dailyRevenue} />
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
                <Image
                  src={item.product?.mainImage || "/placeholder.jpg"}
                  alt={item.product?.title || "Product image"}
                  width={56}
                  height={56}
                  className="w-14 h-14 object-cover rounded"
                  unoptimized
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
