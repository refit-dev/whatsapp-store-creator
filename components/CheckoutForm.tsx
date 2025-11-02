"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { buildWhatsAppUrl } from "@/utils/wa";
import { isValidPhoneInternational } from "@/lib/validations";

export function CheckoutForm({
  store,
  redirectToWhatsApp,
}: {
  store: {
    handle: string;
    whatsapp_e164: string;
    currency: string;
    is_payments_enabled?: boolean;
  };
  redirectToWhatsApp?: (orderId: string, paymentUrl?: string) => void;
}) {
  const { items, subtotalCents, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== CHECKOUT FORM SUBMIT TRIGGERED ===");
    console.log("Store data in CheckoutForm:", store);
    console.log("Items in cart:", items);
    console.log("======================================");

    if (!items.length) return;

    // Validate phone number (India local 10-digit or international E.164 with +)
    if (!isValidPhoneInternational(formData.phone)) {
      alert(
        "Please enter a valid phone number. For India: 10-digit starting with 6-9 or +91XXXXXXXXXX. For other countries: use international format with + and country code."
      );
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeHandle: store.handle,
          buyer: formData,
          items: items.map((item) => ({
            productId: item.id,
            title: item.title,
            priceCents: item.priceCents,
            qty: item.qty,
          })),
        }),
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const order = await orderRes.json();

      // Get payment link if enabled
      let paymentUrl: string | undefined;
      if (store.is_payments_enabled) {
        const payRes = await fetch("/api/payment-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeHandle: store.handle,
            orderId: order.id,
            amountCents: subtotalCents,
            currency: store.currency,
          }),
        });

        if (payRes.ok) {
          const { url } = await payRes.json();
          paymentUrl = url;
        }
      }

      // Mark opened and redirect to WhatsApp
      try {
        await fetch("/api/orders/opened", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
      } catch {}

      const waUrl = buildWhatsAppUrl({
        phoneE164: store.whatsapp_e164,
        items: items.map((i) => ({
          title: i.title,
          qty: i.qty,
          priceCents: i.priceCents,
        })),
        buyer: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
        },
        paymentLink: paymentUrl,
        currency: store.currency,
      });

      // Debug logging - remove after debugging
      console.log("=== WHATSAPP URL DEBUG ===");
      console.log("Store WhatsApp number:", store.whatsapp_e164);
      console.log("Store handle:", store.handle);
      console.log("Generated WhatsApp URL:", waUrl);
      console.log("=========================");

      clearCart();
      if (typeof window !== "undefined") {
        window.location.href = waUrl;
      } else if (redirectToWhatsApp) {
        redirectToWhatsApp(order.id, paymentUrl);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Your Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData((d) => ({ ...d, name: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) =>
              setFormData((d) => ({ ...d, phone: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="+91 98765 43210 or +1 234 567 8900"
            pattern="^(?:\+91[6-9]\d{9}|[6-9]\d{9}|\+[1-9]\d{9,14})$"
            title="For India: 10-digit starting with 6-9 or +91XXXXXXXXXX. For others: + followed by country code and number (10-15 digits total)."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Delivery Address *
          </label>
          <textarea
            required
            value={formData.address}
            onChange={(e) =>
              setFormData((d) => ({ ...d, address: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            rows={3}
            placeholder="123 Main St, City, State 12345"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((d) => ({ ...d, notes: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            rows={2}
            placeholder="Any special requests?"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !items.length}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Order on WhatsApp
              </>
            )}
          </button>

          {!store.is_payments_enabled && (
            <p className="text-center text-sm text-gray-600 mt-3">
              💬 Your order will be sent via WhatsApp. Payment details will be
              shared by the seller.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
