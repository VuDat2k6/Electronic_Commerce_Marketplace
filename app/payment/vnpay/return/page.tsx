"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type PaymentResult = {
  valid: boolean;
  status: string;
  orderId: string | null;
  amount: number;
};

export default function VnpayReturnPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    fetch(`/api/payments/vnpay/return?${searchParams.toString()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then(setResult)
      .catch(() => setResult({ valid: false, status: "ERROR", orderId: null, amount: 0 }));
  }, [searchParams]);

  if (!result) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </main>
    );
  }

  const successful = result.valid && result.status === "COMPLETED";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16">
      <section className="w-full rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {successful ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-red-500" />
        )}
        <h1 className="mt-5 text-2xl font-bold text-gray-950">
          {successful ? "Payment successful" : "Payment is not confirmed"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {successful
            ? `VNPay confirmed payment for order ${result.orderId}.`
            : "The payment was cancelled, failed, or is still waiting for VNPay confirmation."}
        </p>
        <Link
          href="/account/orders"
          className="mt-7 inline-flex rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700"
        >
          View my orders
        </Link>
      </section>
    </main>
  );
}
