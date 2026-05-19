"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "cyan" | "pink";
  size?: "sm" | "md";
  className?: string;
}

/**
 * Renders a pill-style badge as a <span> with configurable visual variant and size.
 *
 * @param children - Content displayed inside the badge.
 * @param variant - Visual style key; one of "default", "success", "warning", "danger", "info", "purple", "cyan", "pink". Defaults to "default".
 * @param size - Size key; one of "sm" or "md". Defaults to "md".
 * @param className - Additional CSS classes to apply to the badge container.
 * @returns A JSX <span> element styled as a badge.
 */
export function Badge({ children, variant = "default", size = "md", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-zinc-100 text-zinc-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-cyan-100 text-cyan-700",
    purple: "bg-purple-100 text-purple-700",
    cyan: "bg-cyan-100 text-cyan-700",
    pink: "bg-pink-100 text-pink-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/**
 * Render a badge representing the provided status string.
 *
 * The function maps known status codes to a styled variant and human-readable label.
 *
 * @param status - The status code to display (e.g., `"PENDING"`, `"CONFIRMED"`, `"DELIVERED"`). Known codes are mapped to predefined variants and labels; unknown values are shown as the label with the default variant.
 * @returns A `Badge` element configured with a variant and label corresponding to `status`.
 */
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    PENDING: { variant: "warning", label: "Pending" },
    CONFIRMED: { variant: "cyan", label: "Confirmed" },
    PROCESSING: { variant: "purple", label: "Processing" },
    SHIPPED: { variant: "cyan", label: "Shipped" },
    DELIVERED: { variant: "success", label: "Delivered" },
    CANCELLED: { variant: "danger", label: "Cancelled" },
  };

  const config = statusMap[status] || { variant: "default", label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
