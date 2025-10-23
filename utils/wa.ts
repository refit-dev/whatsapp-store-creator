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
  currency
}: {
  phoneE164: string;
  items: WhatsAppItem[];
  buyer: WhatsAppBuyer;
  paymentLink?: string;
  currency: string;
}): string {
  // Ensure wa.me uses digits only; accept + but strip for wa.me path
  const digitsOnly = phoneE164.replace(/[^0-9]/g, "");

  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);

  const lines = [
    `🛒 New Order Request`,
    ``,
    ...items.map(
      (item) => `${item.title} ×${item.qty} — ${formatMoney(item.priceCents * item.qty, currency)}`
    ),
    ``,
    `Total: ${formatMoney(subtotal, currency)}`,
    ...(buyer.notes ? ["Notes: " + buyer.notes] : []),
    ``,
    `Buyer: ${buyer.name}`,
    `Phone: ${buyer.phone}`,
    ...(buyer.address ? ["Address: " + buyer.address] : []),
    ...(paymentLink ? ["", "Payment Link: " + paymentLink] : []),
  ];
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${digitsOnly}?text=${text}`;
}
