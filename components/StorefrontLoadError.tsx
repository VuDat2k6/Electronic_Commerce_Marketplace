"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface StorefrontLoadErrorProps {
  resource?: string;
  status?: number;
  backHref?: string;
  backLabel?: string;
}

const StorefrontLoadError = ({
  resource = "products",
  status,
  backHref = "/shop",
  backLabel = "Browse products",
}: StorefrontLoadErrorProps) => {
  const router = useRouter();
  const isRateLimited = status === 429;
  const title = isRateLimited
    ? "Please try again shortly"
    : `Unable to load ${resource}`;
  const message = isRateLimited
    ? "The store is receiving too many requests at the moment. Please wait briefly and retry."
    : "We could not retrieve the latest store data. Please retry or continue browsing.";

  return (
    <div role="alert" className="flex flex-col items-center px-5 py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <AlertCircle className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{message}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          <RefreshCcw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href={backHref}
          className="inline-flex rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
};

export default StorefrontLoadError;
