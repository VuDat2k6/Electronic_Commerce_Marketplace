// Page Transition Component - Wraps page content with smooth animations
"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * Wraps page content to animate transitions when the route (pathname) changes.
 *
 * Keys the animated wrapper by the current pathname so the wrapper remounts on navigation
 * and applies the `pageVariants` enter/exit/initial animation states.
 *
 * @param children - The page content to be animated during route transitions
 * @returns The children wrapped in a motion-enabled container that animates on pathname change
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Fade In Section Component - For scroll-triggered animations
interface FadeInSectionProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Reveals content with a configurable fade-and-slide animation when it enters the viewport.
 *
 * @param children - Content to animate into view
 * @param direction - Entry direction: `"up"`, `"down"`, `"left"`, `"right"`, or `"none"` (no translation)
 * @param delay - Seconds to wait before the animation starts
 * @param duration - Animation duration in seconds
 * @param className - CSS class names applied to the wrapper element
 * @returns A motion-enabled wrapper that animates its children to `opacity: 1` and `x/y: 0` when scrolled into view
 */
export function FadeInSection({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className = "",
}: FadeInSectionProps) {
  const directionVariants = {
    up: { opacity: 0, y: 40 },
    down: { opacity: 0, y: -40 },
    left: { opacity: 0, x: 40 },
    right: { opacity: 0, x: -40 },
    none: { opacity: 0 },
  };

  return (
    <motion.div
      initial={directionVariants[direction]}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger Container - For staggered children animations
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

/**
 * Renders a motion wrapper that reveals its children with a staggered entrance when the container enters the viewport.
 *
 * @param staggerDelay - Delay in seconds between the start times of each child's animation
 * @param className - Additional CSS class names applied to the wrapper
 * @returns A motion-enabled div that animates its children using a staggered reveal when scrolled into view
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = "",
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger Item - Individual item in stagger container
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Animates a single child to participate in a parent staggered reveal.
 *
 * @param children - Element(s) to animate
 * @param className - Optional additional CSS class names applied to the wrapper
 * @returns A motion.div that applies the staggered enter animation to `children`
 */
export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Scale In Component - For modal/popup animations
interface ScaleInProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Animates mounting and unmounting of its children with a combined scale and fade effect.
 *
 * @param isOpen - Controls whether the animated wrapper (and its children) is mounted; defaults to `true`.
 * @param className - Optional CSS class applied to the animated wrapper.
 * @returns The animated wrapper element that mounts `children` when `isOpen` is true.
 */
export function ScaleIn({
  children,
  isOpen = true,
  className = "",
}: ScaleInProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Slide In Component - For slide-in panels/drawers
interface SlideInProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "top" | "bottom";
  isOpen?: boolean;
  className?: string;
}

/**
 * Animates its children sliding in and out from a chosen edge.
 *
 * @param children - Content to render inside the sliding container
 * @param direction - Edge from which the content will enter and exit: `"left"`, `"right"`, `"top"`, or `"bottom"`
 * @param isOpen - Controls whether the sliding container is mounted and visible
 * @param className - CSS classes applied to the animated wrapper
 * @returns A motion-enabled wrapper element that mounts when `isOpen` is truthy and applies slide-in/out animations from `direction`
 */
export function SlideIn({
  children,
  direction = "right",
  isOpen = true,
  className = "",
}: SlideInProps) {
  const directionVariants = {
    left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
    right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
    top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
    bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={directionVariants[direction].initial}
          animate={directionVariants[direction].animate}
          exit={directionVariants[direction].exit}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
