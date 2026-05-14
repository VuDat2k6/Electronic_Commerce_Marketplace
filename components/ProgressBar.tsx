"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";

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
