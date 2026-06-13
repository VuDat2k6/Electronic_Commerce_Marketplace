"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const LoadingSpinner = ({ size = "md", text, fullScreen = false }: LoadingSpinnerProps) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        className={`${sizeClasses[size]} animate-spin text-purple-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Loading overlay for modals/dropdowns
export const LoadingOverlay = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <svg
        className="w-6 h-6 animate-spin text-purple-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
};

export default LoadingSpinner;

// Full page loading state
export const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

// Inline loading for buttons/inputs
export const InlineLoader = ({ className = "" }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
