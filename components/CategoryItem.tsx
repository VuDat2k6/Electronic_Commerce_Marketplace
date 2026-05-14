// CategoryItem component - REDESIGNED with Purple theme
"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

interface CategoryItemProps {
  children: ReactNode;
  title: string;
  href: string;
}

const CategoryItem = ({ title, children, href }: CategoryItemProps) => {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center gap-y-3 cursor-pointer bg-white py-6 px-4 text-gray-700 rounded-2xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:from-purple-200 group-hover:to-cyan-200 transition-all">
          {children}
        </div>
        <h3 className="font-semibold text-sm text-center">{title}</h3>
      </div>
    </Link>
  );
};

export default CategoryItem;
