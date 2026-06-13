"use client";

import { Copy, QrCode } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentQRCodeProps {
  amount: number;
  customerName?: string;
  orderRef?: string;
}

const BANK_ID = "970422";
const ACCOUNT_NUMBER = "0123456789";
const ACCOUNT_NAME = "TFDTRONIC MARKETPLACE";

const formatPrice = (amount: number) => `${amount.toLocaleString("vi-VN")} VND`;

export default function PaymentQRCode({
  amount,
  customerName,
  orderRef = "TFD CHECKOUT",
}: PaymentQRCodeProps) {
  const transferNote = `${orderRef} ${customerName || "CUSTOMER"}`.trim().slice(0, 80);
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NUMBER}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const copyPaymentInfo = async () => {
    await navigator.clipboard.writeText(
      `Bank: MB Bank\nAccount: ${ACCOUNT_NUMBER}\nName: ${ACCOUNT_NAME}\nAmount: ${formatPrice(amount)}\nContent: ${transferNote}`
    );
    toast.success("Payment information copied");
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Bank transfer QR</p>
            <p className="text-xs text-gray-500">Scan with your banking app</p>
          </div>
        </div>
        <button
          type="button"
          onClick={copyPaymentInfo}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-purple-700 shadow-sm ring-1 ring-purple-100 hover:bg-purple-50"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className="mx-auto h-[180px] w-[180px] overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="TFDTRONIC bank transfer QR code"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Bank</span>
            <span className="font-semibold text-gray-900">MB Bank</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Account</span>
            <span className="font-mono font-semibold text-gray-900">{ACCOUNT_NUMBER}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-purple-700">{formatPrice(amount)}</span>
          </div>
          <div>
            <span className="text-gray-500">Content</span>
            <p className="mt-1 rounded-xl bg-white px-3 py-2 font-mono text-xs font-semibold text-gray-800 ring-1 ring-gray-100">
              {transferNote}
            </p>
          </div>
          <p className="text-xs leading-5 text-gray-500">
            Your order will be created as pending payment. The seller/admin can reconcile the bank transfer before fulfillment.
          </p>
        </div>
      </div>
    </div>
  );
}
