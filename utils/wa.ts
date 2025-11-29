import { formatMoney } from "../lib/money";

export type WhatsAppItem = {
  title: string;
  qty: number;
  priceCents: number;
};

export type WhatsAppBuyer = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
};

export type WhatsAppTotals = {
  subtotalCents?: number;
  discountCents?: number;
  deliveryFeeCents?: number;
  totalCents?: number;
};

export type WhatsAppDelivery = {
  day?: string | null;
  slot?: string | null;
};

export function buildWhatsAppUrl({
  phoneE164,
  items,
  buyer,
  paymentLink,
  currency,
  paymentMethod,
  storeName,
  totals,
  delivery,
}: {
  phoneE164: string;
  items: WhatsAppItem[];
  buyer: WhatsAppBuyer;
  paymentLink?: string;
  currency: string;
  paymentMethod?: string;
  storeName?: string;
  totals?: WhatsAppTotals;
  delivery?: WhatsAppDelivery;
}): string {
  // Ensure wa.me uses digits only; accept + but strip for wa.me path
  const digitsOnly = phoneE164.replace(/[^0-9]/g, "");

  const computedSubtotal = items.reduce(
    (sum, i) => sum + i.priceCents * i.qty,
    0
  );
  const discount = totals?.discountCents ?? 0;
  const deliveryFee = totals?.deliveryFeeCents ?? 0;
  const subtotalCents = totals?.subtotalCents ?? computedSubtotal;
  const totalCents =
    totals?.totalCents ?? subtotalCents - discount + deliveryFee;

  const formatPaymentMethod = () => {
    switch (paymentMethod) {
      case "online":
        return "Pay now (online)";
      case "whatsapp":
        return "Pay later (WhatsApp)";
      case "cod":
        return "Cash on delivery";
      default:
        return "Payment pending";
    }
  };

  const lines = [
    `New order from ${buyer.name} (${buyer.phone})`,
    ...(storeName ? [`Store: ${storeName}`] : []),
    "",
    "Items:",
    ...items.map(
      (item) =>
        `- ${item.qty} x ${item.title} @ ${formatMoney(
          item.priceCents,
          currency
        )} = ${formatMoney(item.priceCents * item.qty, currency)}`
    ),
    "",
    `Subtotal: ${formatMoney(subtotalCents, currency)}`,
    ...(discount > 0
      ? [`Discount: -${formatMoney(discount, currency)}`]
      : []),
    `Delivery: ${formatMoney(deliveryFee, currency)}`,
    `Total: ${formatMoney(totalCents, currency)}`,
    "",
    ...(delivery?.day || delivery?.slot
      ? [
          `Delivery slot: ${[delivery?.day, delivery?.slot]
            .filter(Boolean)
            .join(", ")}`,
        ]
      : []),
    `Address: ${buyer.address}`,
    "",
    ...(buyer.notes ? ["Notes: " + buyer.notes, ""] : []),
    `Payment method: ${formatPaymentMethod()}`,
    ...(paymentLink ? ["Payment link: " + paymentLink] : []),
    ...(buyer.email ? ["Email: " + buyer.email] : []),
  ];
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${digitsOnly}?text=${text}`;
}
