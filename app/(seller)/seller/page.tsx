"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/seller/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
    </div>
  );
}
