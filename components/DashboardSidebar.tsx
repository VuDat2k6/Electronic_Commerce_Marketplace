// DashboardSidebar - Modern design with gradient purple theme
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Grid3X3, Users, Store, Settings, ArrowLeft } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Grid3X3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/sellers", label: "Sellers", icon: Store },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-purple-700 to-purple-900 h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-purple-500/30">
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/20 text-white border-l-4 border-pink-400"
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
      <div className="p-4 border-t border-purple-500/30">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-purple-200 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
