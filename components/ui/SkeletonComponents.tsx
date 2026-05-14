// Additional Skeleton Components for common UI patterns
"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rounded",
  width,
  height,
}) => {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-lg",
  };

  return (
    <div
      className={`shimmer ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-5 space-y-3">
        <Skeleton variant="text" className="h-3 w-20" />
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-3/4" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="circular" className="w-3.5 h-3.5" />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton variant="text" className="h-6 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
};

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => {
  return (
    <tr className="border-b border-gray-100">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton variant="text" className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
};

// Stats Card Skeleton
export const StatsCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-8 w-32" />
        </div>
        <Skeleton variant="circular" className="w-12 h-12" />
      </div>
    </div>
  );
};

// Sidebar Skeleton
export const SidebarSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" className="w-5 h-5" />
          <Skeleton variant="text" className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
};

// Form Skeleton
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => {
  return (
    <div className="space-y-4">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-6" />
    </div>
  );
};

// Order Card Skeleton
export const OrderCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="h-5 w-32" />
        <Skeleton variant="rounded" className="h-6 w-20" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="w-16 h-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-48" />
          <Skeleton variant="text" className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
};

// Category Card Skeleton
export const CategoryCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm text-center">
      <Skeleton variant="circular" className="w-16 h-16 mx-auto mb-4" />
      <Skeleton variant="text" className="h-4 w-24 mx-auto" />
    </div>
  );
};

// Notification Skeleton
export const NotificationSkeleton = () => {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg">
      <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
    </div>
  );
};

export default Skeleton;
