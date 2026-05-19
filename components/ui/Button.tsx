"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent" | "purple";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-sm hover:shadow-md focus:ring-primary-500",
      secondary:
        "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 focus:ring-zinc-500",
      ghost:
        "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-500",
      danger:
        "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md focus:ring-red-500",
      accent:
        "bg-gradient-to-r from-primary-500 to-accent-cyan text-white hover:shadow-lg focus:ring-primary-500",
      purple:
        "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 shadow-sm hover:shadow-md focus:ring-primary-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
