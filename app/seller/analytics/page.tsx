"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import { FaChartLine, FaBox, FaDollarSign, FaShoppingCart, FaStar, FaEye } from "react-icons/fa";
import { format, subDays } from "date-fns";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
  ordersByStatus: Record<string, number>;
  revenueByDay: DailyRevenue[];
  recentReviews: Review[];
}

interface TopProduct {
  id: string;
  title: string;
  mainImage: string;
  totalSold: number;
  totalRevenue: number;
  rating: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  userId: string;
  createdAt: string;
}

const SellerAnalyticsPage = () => {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<number>(30);

  useEffect(() => {
    initializeMerchant();
  }, [session]);

  useEffect(() => {
    if (merchantId) {
      fetchAnalytics();
    }
  }, [merchantId, dateRange]);

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

  const fetchAnalytics = async () => {
    if (!merchantId) return;
    setLoading(true);

    try {
      // Fetch all data in parallel
      const [ordersRes, merchantRes] = await Promise.all([
        apiClient.get(`/api/seller/orders?merchantId=${merchantId}`),
        apiClient.get(`/api/merchants/${merchantId}`),
      ]);

      if (ordersRes.ok && merchantRes.ok) {
        const ordersData = await ordersRes.json();
        const merchantData = await merchantRes.json();

        const subOrders = ordersData.subOrders || [];
        const products = merchantData.products || [];

        // Calculate total revenue
        const totalRevenue = subOrders.reduce((sum: number, order: any) => {
          return sum + (order.revenue || 0);
        }, 0);

        // Calculate orders by status
        const ordersByStatus: Record<string, number> = {
          PENDING: 0,
          CONFIRMED: 0,
          PROCESSING: 0,
          SHIPPED: 0,
          DELIVERED: 0,
          CANCELLED: 0,
        };

        subOrders.forEach((order: any) => {
          if (order.status in ordersByStatus) {
            ordersByStatus[order.status]++;
          }
        });

        // Calculate revenue by day (last N days)
        const revenueByDay: DailyRevenue[] = [];
        for (let i = dateRange - 1; i >= 0; i--) {
          const date = format(subDays(new Date(), i), "yyyy-MM-dd");
          const dayOrders = subOrders.filter((order: any) => {
            return order.createdAt.startsWith(date);
          });
          const dayRevenue = dayOrders.reduce((sum: number, order: any) => sum + (order.revenue || 0), 0);

          revenueByDay.push({
            date,
            revenue: dayRevenue,
            orders: dayOrders.length,
          });
        }

        // Calculate top products (simulated based on order data)
        const productSales: Record<string, TopProduct> = {};
        subOrders.forEach((order: any) => {
          order.products?.forEach((item: any) => {
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                id: item.productId,
                title: item.productNameSnapshot || "Unknown",
                mainImage: item.productImageSnapshot || "",
                totalSold: 0,
                totalRevenue: 0,
                rating: 0,
              };
            }
            productSales[item.productId].totalSold += item.quantity;
            productSales[item.productId].totalRevenue += item.quantity * item.unitPriceSnapshot;
          });
        });

        const topProducts = Object.values(productSales)
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 5);

        // Get reviews for merchant products
        const reviews: Review[] = [];
        products.forEach((product: any) => {
          if (product.reviews) {
            product.reviews.forEach((review: any) => {
              reviews.push(review);
            });
          }
        });

        // Calculate average rating
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        setAnalytics({
          totalRevenue,
          totalOrders: subOrders.length,
          totalProducts: products.length,
          averageOrderValue: subOrders.length > 0 ? totalRevenue / subOrders.length : 0,
          topProducts,
          ordersByStatus,
          revenueByDay,
          recentReviews: reviews.slice(0, 5),
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "MMM dd");
  };

  const getMaxRevenue = () => {
    if (!analytics?.revenueByDay) return 0;
    return Math.max(...analytics.revenueByDay.map(d => d.revenue), 1);
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

  if (!merchantId && !loading) {
    return (
      <div className="bg-white">
        <SectionTitle title="Analytics" path="Home | Seller | Analytics" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Shop Associated</h2>
          <p className="text-gray-500 mb-6">
            Your account is not linked to any shop yet. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <SectionTitle title="Analytics" path="Home | Seller | Analytics" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-sm text-gray-500">Track your shop performance</p>
          </div>
          
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === days
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaDollarSign className="w-6 h-6 opacity-80" />
                  <span className="text-sm opacity-80">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold">${formatPrice(analytics.totalRevenue)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaShoppingCart className="w-6 h-6 opacity-80" />
                  <span className="text-sm opacity-80">Total Orders</span>
                </div>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaChartLine className="w-6 h-6 opacity-80" />
                  <span className="text-sm opacity-80">Avg. Order Value</span>
                </div>
                <p className="text-2xl font-bold">${formatPrice(analytics.averageOrderValue)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <FaStar className="w-6 h-6 opacity-80" />
                  <span className="text-sm opacity-80">Avg. Rating</span>
                </div>
                <p className="text-2xl font-bold">
                  {analytics.recentReviews.length > 0 
                    ? (analytics.recentReviews.reduce((s, r) => s + r.rating, 0) / analytics.recentReviews.length).toFixed(1)
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Chart */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
                <div className="space-y-2">
                  {analytics.revenueByDay.slice(-14).map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-16">{formatDate(day.date)}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.max((day.revenue / getMaxRevenue()) * 100, 2)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-20 text-right">
                        ${formatPrice(day.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders by Status */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h2>
                <div className="space-y-3">
                  {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              status === "DELIVERED" ? "bg-green-500" :
                              status === "CANCELLED" ? "bg-red-500" :
                              "bg-blue-500"
                            }`}
                            style={{ width: `${analytics.totalOrders > 0 ? (count / analytics.totalOrders) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Top Products */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {analytics.topProducts.length > 0 ? (
                    analytics.topProducts.map((product, index) => (
                      <div key={product.id} className="p-4 flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? "bg-yellow-100 text-yellow-600" :
                          index === 1 ? "bg-gray-100 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-600" :
                          "bg-gray-50 text-gray-500"
                        }`}>
                          {index + 1}
                        </span>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.mainImage ? (
                            <img
                              src={`/${product.mainImage}`}
                              alt={product.title}
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
                          <p className="text-sm font-bold text-green-600">${formatPrice(product.totalRevenue)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">No sales data yet</div>
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {analytics.recentReviews.length > 0 ? (
                    analytics.recentReviews.map((review) => (
                      <div key={review.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating ? "text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(review.createdAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">No reviews yet</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">No analytics data available</div>
        )}
      </div>
    </div>
  );
};

export default SellerAnalyticsPage;
