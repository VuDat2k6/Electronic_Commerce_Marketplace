// DashboardSidebar component - REDESIGNED with Purple theme
"use client";

import React from "react";
import { MdDashboard } from "react-icons/md";
import { FaTable, FaRegUser, FaBagShopping, FaStore, FaUpload } from "react-icons/fa6";
import { MdCategory, MdSettings } from "react-icons/md";

import Link from "next/link";

const navItems = [
  { href: "/admin", icon: MdDashboard, label: "Dashboard" },
  { href: "/admin/orders", icon: FaBagShopping, label: "Orders" },
  { href: "/admin/products", icon: FaTable, label: "Products" },
  { href: "/admin/categories", icon: MdCategory, label: "Categories" },
  { href: "/admin/users", icon: FaRegUser, label: "Users" },
  { href: "/admin/sellers", icon: FaStore, label: "Sellers" },
  { href: "/admin/settings", icon: MdSettings, label: "Settings" },
];

const DashboardSidebar = () => {
  return (
    <div className="xl:w-[280px] bg-gradient-to-b from-purple-700 to-purple-900 h-full max-xl:w-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-purple-600/30">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <MdDashboard className="text-2xl text-white" />
          </div>
          <span className="text-xl font-bold text-white">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
          >
            <item.icon className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
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

export default DashboardSidebar;
