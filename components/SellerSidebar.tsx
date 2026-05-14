// SellerSidebar component - REDESIGNED with Purple-Cyan theme
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdDashboard } from "react-icons/md";
import {
  FaTable,
  FaBagShopping,
  FaUpload,
  FaGear,
  FaChartLine,
  FaTag,
} from "react-icons/fa6";

const navItems = [
  { href: "/seller/dashboard", label: "Dashboard", icon: MdDashboard },
  { href: "/seller/analytics", label: "Analytics", icon: FaChartLine },
  { href: "/seller/products", label: "Products", icon: FaTable },
  { href: "/seller/orders", label: "Orders", icon: FaBagShopping },
  { href: "/seller/vouchers", label: "Voucher", icon: FaTag },
  { href: "/seller/bulk-upload", label: "Bulk Upload", icon: FaUpload },
  { href: "/seller/settings", label: "Shop Settings", icon: FaGear },
];

const SellerSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="xl:w-[280px] bg-gradient-to-b from-purple-700 to-purple-900 h-full max-xl:w-full flex-shrink-0 relative">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-purple-600/30">
        <Link href="/seller/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <MdDashboard className="text-2xl text-white" />
          </div>
          <span className="text-xl font-bold text-white">Seller</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex gap-3 w-full cursor-pointer items-center py-3 px-4 text-white rounded-xl transition-all duration-200
                ${isActive 
                  ? "bg-white/20 border-l-4 border-cyan-400" 
                  : "hover:bg-white/10"}`}
              >
                <Icon className="text-xl flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Back to Home */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-600/30">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default SellerSidebar;
