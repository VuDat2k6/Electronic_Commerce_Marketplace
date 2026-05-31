// DashboardSidebar - Modern design with gradient purple theme
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Grid3X3, Users, Store, Settings, ArrowLeft, ShieldAlert } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Order Oversight", icon: ShoppingBag },
  { href: "/admin/products", label: "Moderation", icon: ShieldAlert },
  { href: "/admin/categories", label: "Categories", icon: Grid3X3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sellers", label: "Seller Approval", icon: Store },
  { href: "/admin/settings", label: "Platform Settings", icon: Settings },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col bg-gradient-to-r from-purple-700 to-purple-900 xl:sticky xl:top-0 xl:h-screen xl:w-64 xl:bg-gradient-to-b">
      {/* Header */}
      <div className="border-b border-purple-500/30 px-4 py-4 xl:px-6 xl:py-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg">Admin</span>
            <p className="text-xs text-purple-200">Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex gap-2 overflow-x-auto p-3 xl:flex-1 xl:flex-col xl:space-y-1 xl:overflow-y-auto xl:p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="shrink-0">
              <div
                className={`flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/20 text-white xl:border-l-4 xl:border-pink-400"
                    : "text-purple-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="hidden border-t border-purple-500/30 p-4 xl:block">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-4 py-3 text-purple-200 transition-all hover:bg-white/10 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
