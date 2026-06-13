"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Initializes and controls an nprogress loading bar tied to route and search-parameter changes.
 *
 * Configures NProgress, starts the progress bar on mount/update, schedules completion after 300ms,
 * and ensures the progress bar is stopped and any pending timer is cleared on cleanup.
 *
 * @returns Null (the component renders nothing)
 */
export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ 
      showSpinner: false,
      trickle: true,
      trickleSpeed: 200,
      minimum: 0.1,
      easing: 'ease',
      speed: 500,
    });

    const handleStart = () => NProgress.start();
    const handleDone = () => NProgress.done();

    handleStart();

    const timer = setTimeout(() => {
      handleDone();
    }, 300);

    return () => {
      clearTimeout(timer);
      handleDone();
    };
  }, [pathname, searchParams]);

  return null;
}
