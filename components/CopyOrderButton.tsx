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
      className="text-blue-600 hover:text-blue-800 font-medium"
    >
      Copy Details
    </button>
  );
}
