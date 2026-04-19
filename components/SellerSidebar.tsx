// *********************
// Role of the component: Seller sidebar navigation
// Name of the component: SellerSidebar.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <SellerSidebar />
// Input parameters: no input parameters
// Output: Seller sidebar component
// *********************

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
  { href: "/seller/analytics", label: "Phân tích", icon: FaChartLine },
  { href: "/seller/products", label: "Sản phẩm", icon: FaTable },
  { href: "/seller/orders", label: "Đơn hàng", icon: FaBagShopping },
  { href: "/seller/vouchers", label: "Voucher", icon: FaTag },
  { href: "/seller/bulk-upload", label: "Bulk Upload", icon: FaUpload },
  { href: "/seller/settings", label: "Cài đặt shop", icon: FaGear },
];

const SellerSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="xl:w-[280px] bg-green-600 h-full max-xl:w-full flex-shrink-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex gap-x-3 w-full cursor-pointer items-center py-5 pl-5 text-lg text-white
              ${isActive ? "bg-green-800 border-l-4 border-white" : "hover:bg-green-700"}`}
            >
              <Icon className="text-xl flex-shrink-0" />
              <span className="font-normal">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default SellerSidebar;