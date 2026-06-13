import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export async function GET() {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const seriesStart = startOfDay(new Date(now));
  seriesStart.setDate(seriesStart.getDate() - 11);

  const [
    totalUsers,
    activeSellers,
    pendingSellers,
    totalProducts,
    publishedProducts,
    archivedProducts,
    totalOrders,
    monthlyOrders,
    totalRevenueResult,
    monthlyRevenueResult,
    recentOrders,
    seriesOrders,
    soldProducts,
    categoryCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "seller", shopStatus: "ACTIVE" } }),
    prisma.user.count({ where: { role: "seller", shopStatus: "PENDING" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "ARCHIVED" } }),
    prisma.customer_order.count(),
    prisma.customer_order.count({ where: { dateTime: { gte: startOfMonth } } }),
    prisma.customer_order.aggregate({ _sum: { total: true } }),
    prisma.customer_order.aggregate({
      where: { dateTime: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.customer_order.findMany({
      orderBy: { dateTime: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        status: true,
        total: true,
        dateTime: true,
      },
    }),
    prisma.customer_order.findMany({
      where: { dateTime: { gte: seriesStart } },
      select: { total: true, dateTime: true },
    }),
    prisma.subOrderProduct.findMany({
      take: 1000,
      include: {
        product: { select: { title: true } },
        subOrder: { select: { status: true } },
      },
    }),
    prisma.category.count(),
  ]);

  const revenueByDay = new Map<string, number>();
  const days = Array.from({ length: 12 }, (_, index) => {
    const date = startOfDay(new Date(seriesStart));
    date.setDate(seriesStart.getDate() + index);
    const key = dateKey(date);
    revenueByDay.set(key, 0);
    return { date, key };
  });

  for (const order of seriesOrders) {
    const key = dateKey(order.dateTime);
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + order.total);
  }

  const maxRevenue = Math.max(...Array.from(revenueByDay.values()), 0);
  const revenueSeries = days.map(({ date, key }) => {
    const revenue = revenueByDay.get(key) || 0;
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue,
      height: maxRevenue > 0 ? Math.max(6, Math.round((revenue / maxRevenue) * 100)) : 0,
    };
  });

  const productMap = new Map<string, { name: string; sold: number; revenue: number }>();
  for (const item of soldProducts) {
    const name = item.productNameSnapshot || item.product?.title || "Product";
    const current = productMap.get(name) || { name, sold: 0, revenue: 0 };
    current.sold += item.quantity;
    current.revenue += item.quantity * item.unitPriceSnapshot;
    productMap.set(name, current);
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)
    .slice(0, 5);

  return NextResponse.json({
    stats: {
      totalUsers,
      activeSellers,
      pendingSellers,
      totalProducts,
      publishedProducts,
      archivedProducts,
      categoryCount,
      totalOrders,
      monthlyOrders,
      totalRevenue: totalRevenueResult._sum.total || 0,
      monthlyRevenue: monthlyRevenueResult._sum.total || 0,
    },
    revenueSeries,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      displayId: `#${order.id.slice(0, 8).toUpperCase()}`,
      customer: [order.name, order.lastname].filter(Boolean).join(" ") || order.email || "Customer",
      total: order.total,
      status: order.status,
      date: order.dateTime,
    })),
    topProducts,
  });
}
