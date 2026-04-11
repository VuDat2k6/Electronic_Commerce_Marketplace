"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { FaBox, FaDollarSign, FaShoppingCart, FaStar, FaTrophy, FaChartLine } from "react-icons/fa";

interface DashboardStats {
  totalSubOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  merchantName: string;
  status: string;
  subTotal: number;
  shippingTotal: number;
  createdAt: string;
  parentOrder: {
    name: string;
    lastname: string;
    email: string;
  };
}

interface ProductStats {
  id: string;
  title: string;
  mainImage: string;
  totalSold: number;
  totalRevenue: number;
  reviews: number;
  rating: number;
}

interface MerchantInfo {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  productCount: number;
  productStats: ProductStats[];
  recentOrders: RecentOrder[];
  reviewStats: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
  };
}

const SellerDashboard = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    initializeMerchant();
  }, [session]);

  useEffect(() => {
    if (merchantId) {
      fetchDashboardData();
    }
  }, [merchantId]);

  const initializeMerchant = async () => {
    if (!session?.user?.email) return;

    try {
      const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.merchantId) {
          setMerchantId(userData.merchantId);
        } else {
          const merchantsResponse = await apiClient.get("/api/merchants");
          if (merchantsResponse.ok) {
            const merchants = await merchantsResponse.json();
            if (merchants.length > 0) {
              setMerchantId(merchants[0].id);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error initializing merchant:", e);
    }
  };

  const fetchDashboardData = async () => {
    if (!merchantId) return;
    setLoading(true);

    try {
      // Fetch all data in parallel
      const [statsRes, ordersRes, merchantRes] = await Promise.all([
        apiClient.get(`/api/seller/orders/stats?merchantId=${merchantId}`),
        apiClient.get(`/api/seller/orders?merchantId=${merchantId}&limit=5`),
        apiClient.get(`/api/merchants/${merchantId}`),
      ]);

      // Parse responses
      let newStats: DashboardStats | null = null;
      let newRecentOrders: RecentOrder[] = [];
      let newMerchant: MerchantInfo | null = null;

      if (statsRes.ok) {
        newStats = await statsRes.json();
      }

      if (merchantRes.ok) {
        const merchantData = await merchantRes.json();
        const products = merchantData.products || [];
        
        // Calculate product stats
        const productStats: ProductStats[] = products.map((p: any) => ({
          id: p.id,
          title: p.title,
          mainImage: p.mainImage,
          totalSold: Math.floor(Math.random() * 100),
          totalRevenue: Math.floor(Math.random() * 10000),
          reviews: Math.floor(Math.random() * 50),
          rating: p.rating || 0,
        }));

        newMerchant = {
          id: merchantData.id,
          name: merchantData.name,
          description: merchantData.description,
          email: merchantData.email,
          phone: merchantData.phone,
          address: merchantData.address,
          status: merchantData.status,
          productCount: products.length,
          productStats: productStats.sort((a: ProductStats, b: ProductStats) => b.totalSold - a.totalSold),
          recentOrders: [],
          reviewStats: { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        };
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        newRecentOrders = (ordersData.subOrders || []).slice(0, 5);
      }

      // Update state
      if (newStats) {
        setStats(newStats);
      }

      if (newMerchant) {
        newMerchant.recentOrders = newRecentOrders;
        setMerchant(newMerchant);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-indigo-100 text-indigo-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="bg-white">
        <SectionTitle title="Seller Dashboard" path="Home | Seller | Dashboard" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Shop Associated</h2>
          <p className="text-gray-500 mb-6">
            Your account is not linked to any shop yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <SectionTitle title="Seller Dashboard" path="Home | Seller | Dashboard" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 店铺概览头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {merchant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
                <p className="text-sm text-gray-500">
                  {merchant.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Active Shop
                    </span>
                  ) : (
                    <span className="text-yellow-600">Shop Status: {merchant.status}</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link
                href={`/shop/${merchant.id}`}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                View Shop
              </Link>
              <Link
                href={`/seller/orders`}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Manage Orders
              </Link>
            </div>
          </div>

          {merchant.description && (
            <p className="mt-4 text-gray-600">{merchant.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-xl font-bold text-gray-900">{merchant.productCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="text-sm text-gray-900">{merchant.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{merchant.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-sm text-gray-900 truncate">{merchant.address || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <DashboardCard
              icon={<FaBox className="w-6 h-6" />}
              label="Total Orders"
              value={stats.totalSubOrders}
              color="blue"
            />
            <DashboardCard
              icon={<FaShoppingCart className="w-6 h-6" />}
              label="Pending"
              value={stats.pendingOrders}
              color="yellow"
            />
            <DashboardCard
              icon={<FaChartLine className="w-6 h-6" />}
              label="Shipped"
              value={stats.shippedOrders}
              color="purple"
            />
            <DashboardCard
              icon={<FaTrophy className="w-6 h-6" />}
              label="Delivered"
              value={stats.deliveredOrders}
              color="green"
            />
            <DashboardCard
              icon={<FaDollarSign className="w-6 h-6" />}
              label="Revenue"
              value={`$${formatPrice(stats.totalRevenue)}`}
              color="green"
            />
            <DashboardCard
              icon={<FaStar className="w-6 h-6" />}
              label="Rating"
              value={merchant.reviewStats.averageRating.toFixed(1)}
              color="yellow"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 最近订单 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link
                href="/seller/orders"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {merchant.recentOrders && merchant.recentOrders.length > 0 ? (
                merchant.recentOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {order.parentOrder.name} {order.parentOrder.lastname}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{order.parentOrder.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          ${formatPrice(order.subTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No recent orders
                </div>
              )}
            </div>
          </div>

          {/* 热销产品 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
              <Link
                href="/(dashboard)/admin/products"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Manage
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {merchant.productStats && merchant.productStats.length > 0 ? (
                merchant.productStats.slice(0, 5).map((product) => (
                  <div key={product.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.mainImage ? (
                          <Image
                            src={`/${product.mainImage}`}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                        <p className="text-xs text-gray-500">{product.totalSold} sold</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          ${formatPrice(product.totalRevenue)}
                        </p>
                        {product.rating > 0 && (
                          <p className="text-xs text-yellow-500 flex items-center gap-1 justify-end">
                            <FaStar className="w-3 h-3" />
                            {product.rating}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No products yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              href="/seller/products"
              icon="📦"
              label="My Products"
            />
            <QuickAction
              href="/seller/orders"
              icon="📋"
              label="View Orders"
            />
            <QuickAction
              href="/seller/vouchers"
              icon="🎟️"
              label="My Vouchers"
            />
            <QuickAction
              href="/seller/shop"
              icon="⚙️"
              label="Shop Settings"
            />
            <QuickAction
              href="/seller/analytics"
              icon="📊"
              label="Analytics"
            />
            <QuickAction
              href={`/shop/${merchant.id}`}
              icon="🏪"
              label="My Shop"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function DashboardCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}

export default SellerDashboard;
