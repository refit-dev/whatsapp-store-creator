import { formatMoney } from "../lib/money";

export type WhatsAppItem = {
  title: string;
  qty: number;
  priceCents: number;
};

export type WhatsAppBuyer = {
  name: string;
  phone: string;
  address: string;
  notes?: string;
};

export function buildWhatsAppUrl({
  phoneE164,
  items,
  buyer,
  paymentLink,
  currency,
  paymentMethod,
}: {
  phoneE164: string;
  items: WhatsAppItem[];
  buyer: WhatsAppBuyer;
  paymentLink?: string;
  currency: string;
  paymentMethod?: string;
}): string {
  // Debug logging - remove after debugging
  console.log("=== buildWhatsAppUrl DEBUG ===");
  console.log("Input phoneE164:", phoneE164);
  console.log("Input buyer:", buyer);
  console.log("Input items:", items);
  console.log("==============================");

  // Ensure wa.me uses digits only; accept + but strip for wa.me path
  const digitsOnly = phoneE164.replace(/[^0-9]/g, "");

  console.log("Digits only result:", digitsOnly);

  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);

  const paymentStatus =
    paymentMethod === "online"
      ? "✅ PAID ONLINE"
      : "💰 Payment Pending (Pay on Delivery)";

  const lines = [
    `🛒 New Order Request`,
    ``,
    ...items.map(
      (item) =>
        `${item.title} ×${item.qty} — ${formatMoney(
          item.priceCents * item.qty,
          currency
        )}`
    ),
    ``,
    `Total: ${formatMoney(subtotal, currency)}`,
    `Payment Status: ${paymentStatus}`,
    ...(buyer.notes ? ["", "Notes: " + buyer.notes] : []),
    ``,
    `Buyer: ${buyer.name}`,
    `Phone: ${buyer.phone}`,
    ...(buyer.address ? ["Address: " + buyer.address] : []),
    ...(paymentLink ? ["", "Payment Link: " + paymentLink] : []),
  ];
  const text = encodeURIComponent(lines.join("\n"));
  const finalUrl = `https://wa.me/${digitsOnly}?text=${text}`;

  console.log("Final WhatsApp URL:", finalUrl);
  console.log("==============================");

  return finalUrl;
}
