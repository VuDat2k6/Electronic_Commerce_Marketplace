"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Renders a styled card container for grouping content.
 *
 * @param children - Content to render inside the card
 * @param className - Additional CSS classes appended to the card container
 * @param hover - If `true`, enables hover styles (shadow, border, transition, and pointer)
 * @param padding - Controls internal padding; one of `"none"`, `"sm"`, `"md"`, or `"lg"`
 * @returns The rendered card element with applied border, background, rounding, optional hover styles, and the selected padding
 */
export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        bg-white rounded-2xl border border-zinc-200/60 shadow-sm
        ${hover ? "hover:shadow-lg hover:border-zinc-300/80 transition-all duration-300 cursor-pointer" : ""}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Renders a card header container with horizontal padding, vertical padding, and a bottom border.
 *
 * @param children - Content to render inside the header
 * @param className - Additional CSS classes appended to the header container
 * @returns A div element styled as a card header that wraps `children`
 */
export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-b border-zinc-100 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Renders a card body section with default padding and optional extra classes.
 *
 * @param children - Content to display inside the card body.
 * @param className - Additional CSS classes to append to the container.
 * @returns The card body element with padding applied.
 */
export function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

/**
 * Renders a styled footer section for a Card component.
 *
 * @param children - Content to display inside the footer
 * @param className - Additional CSS classes appended to the footer container
 * @returns The footer element containing `children`, with top border and muted background styling
 */
export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 ${className}`}>
      {children}
    </div>
  );
}
