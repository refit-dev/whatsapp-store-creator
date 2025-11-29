import { buildWhatsAppUrl } from "../utils/wa";

const url = buildWhatsAppUrl({
  phoneE164: "+919999999999",
  currency: "INR",
  paymentLink: "https://pay.test/link",
  buyer: {
    name: "Test",
    phone: "+91 99999 99999",
    address: "Addr",
    notes: "No onions",
  },
  items: [
    { title: "Bread", qty: 1, priceCents: 4999 },
    { title: "Cake", qty: 2, priceCents: 1299 },
  ],
  storeName: "Demo Store",
  totals: { subtotalCents: 7597, totalCents: 8097, deliveryFeeCents: 500 },
  delivery: { day: "Monday", slot: "9AM-12PM" },
  paymentMethod: "online",
});

if (!url.startsWith("https://wa.me/919999999999?text=")) {
  throw new Error("E164 formatting failed");
}

const decoded = decodeURIComponent(url.split("text=")[1]);
if (!decoded.includes("New order from Test")) {
  throw new Error("Header missing");
}
if (!decoded.includes("- 2 x Cake")) {
  throw new Error("Line items missing");
}
if (!decoded.includes("Subtotal:")) {
  throw new Error("Subtotal missing");
}
if (!decoded.includes("Delivery slot: Monday, 9AM-12PM")) {
  throw new Error("Delivery slot missing");
}
if (!decoded.includes("Payment method:")) {
  throw new Error("Payment method missing");
}
console.log("utils/wa.ts tests passed");
