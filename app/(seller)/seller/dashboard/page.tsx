"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { FaBoxOpen, FaBagShopping, FaDollarSign, FaClock } from "react-icons/fa6";

interface DashboardStats {
  totalProducts: number;
  totalOrderItems: number;
  totalRevenue: number;
  todayOrderCount: number;
  pendingOrderCount: number;
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className={`bg-white rounded-xl shadow p-6 flex items-center gap-x-4 border-l-4 ${color}`}>
    <Icon className="text-4xl text-gray-400" />
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

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

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={FaBoxOpen} color="border-blue-500" />
        <StatCard title="Total Orders" value={stats?.totalOrderItems ?? 0} icon={FaBagShopping} color="border-green-500" />
        <StatCard title="Revenue ($)" value={`$${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}`} icon={FaDollarSign} color="border-yellow-500" />
        <StatCard title="Today's Orders" value={stats?.todayOrderCount ?? 0} icon={FaBagShopping} color="border-purple-500" />
        <StatCard title="Pending Orders" value={stats?.pendingOrderCount ?? 0} icon={FaClock} color="border-red-500" />
      </div>
    </div>
  );
}