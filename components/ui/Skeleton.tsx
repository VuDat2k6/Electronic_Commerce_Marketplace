// Enhanced Skeleton Component with shimmer animation
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

export default Skeleton;
