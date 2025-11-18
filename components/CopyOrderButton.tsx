"use client";

import { toLocaleString } from "@/lib/currency";

interface CopyOrderButtonProps {
  order: {
    id: string;
    buyer_name: string;
    buyer_phone: string;
    buyer_address: string | null;
    total_cents: number;
    status: string;
  };
  currency: string;
}

export function CopyOrderButton({ order, currency }: CopyOrderButtonProps) {
  const handleCopy = () => {
    const orderDetails =
      `Order #${order.id.slice(0, 8)}\n` +
      `Customer: ${order.buyer_name}\n` +
      `Phone: ${order.buyer_phone}\n` +
      `Address: ${order.buyer_address || "N/A"}\n` +
      `Total: ${toLocaleString((order.total_cents || 0) / 100, currency)}\n` +
      `Status: ${order.status}`;

    navigator.clipboard.writeText(orderDetails);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow"
      title="Copy order details to clipboard"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      Copy Details
    </button>
  );
}
