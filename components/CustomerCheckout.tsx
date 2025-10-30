"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useCart } from "./CartProvider";

interface CustomerCheckoutProps {
  storeId: string;
  storeName: string;
  storeHandle: string;
}

interface PaymentConfig {
  payment_enabled: boolean;
  payment_method: string;
  upi_id?: string;
  paytm_number?: string;
  payment_instructions?: string;
}

export function CustomerCheckout({
  storeId,
  storeName,
  storeHandle,
}: CustomerCheckoutProps) {
  const { items, subtotalCents, clearCart } = useCart();
  const total = Math.round(subtotalCents / 100); // Convert cents to rupees
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(
    null
  );
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const supabase = supabaseBrowser();

  // Load payment configuration
  useEffect(() => {
    const loadPaymentConfig = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select(
          "payment_enabled, payment_method, upi_id, paytm_number, payment_instructions"
        )
        .eq("id", storeId)
        .single();

      if (!error && data) {
        setPaymentConfig(data);
      }
    };

    loadPaymentConfig();
  }, [storeId, supabase]);

  const handlePlaceOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please fill in your name and phone number");
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email || null,
          customer_address: customerInfo.address || null,
          items: items,
          total_amount: total,
          status: "pending_payment",
          payment_method: paymentConfig?.payment_method || "direct",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      setOrderId(order.id);
      setOrderPlaced(true);
      setShowPaymentDetails(true);
      clearCart();

      // Send WhatsApp notification to store owner
      await fetch("/api/notifications/new-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          orderId: order.id,
          customerName: customerInfo.name,
          total,
        }),
      });
    } catch (error: any) {
      alert(`Error placing order: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatWhatsAppMessage = () => {
    const orderItems = items
      .map(
        (item) =>
          `• ${item.title} (₹${Math.round(item.priceCents / 100)} x ${
            item.qty
          } = ₹${Math.round((item.priceCents * item.qty) / 100)})`
      )
      .join("\n");

    return encodeURIComponent(
      `🛒 New Order from ${storeName}\n\n` +
        `Order ID: ${orderId}\n` +
        `Customer: ${customerInfo.name}\n` +
        `Phone: ${customerInfo.phone}\n` +
        `${customerInfo.email ? `Email: ${customerInfo.email}\n` : ""}` +
        `${customerInfo.address ? `Address: ${customerInfo.address}\n` : ""}` +
        `\nItems:\n${orderItems}\n\n` +
        `Total: ₹${total}\n\n` +
        `Payment completed ✅\n` +
        `Please confirm order and share delivery details.`
    );
  };

  if (!paymentConfig?.payment_enabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          💡 Payments are not enabled for this store. Contact the store owner to
          enable payment collection.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">
          Your cart is empty. Add some products to proceed with checkout.
        </p>
      </div>
    );
  }

  if (orderPlaced && showPaymentDetails) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-lg font-semibold text-green-800">
            Order Placed Successfully!
          </h3>
          <p className="text-green-600">Order ID: {orderId}</p>
        </div>

        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-800">Complete Your Payment:</h4>

          {paymentConfig.upi_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-blue-800">UPI Payment:</strong>
                  <p className="text-blue-700 font-mono">
                    {paymentConfig.upi_id}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(paymentConfig.upi_id!)
                  }
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Copy UPI ID
                </button>
              </div>
            </div>
          )}

          {paymentConfig.paytm_number && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-purple-800">Paytm/PhonePe:</strong>
                  <p className="text-purple-700 font-mono">
                    {paymentConfig.paytm_number}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(paymentConfig.paytm_number!)
                  }
                  className="text-purple-600 hover:text-purple-800 text-sm underline"
                >
                  Copy Number
                </button>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <strong className="text-yellow-800">Amount to Pay: ₹{total}</strong>
          </div>

          {paymentConfig.payment_instructions && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                {paymentConfig.payment_instructions}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-4">
            After completing payment, click below to notify the store owner:
          </p>
          <a
            href={`https://wa.me/+919876543210?text=${formatWhatsAppMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
          >
            <span className="mr-2">📱</span>
            Confirm Payment on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">🛒 Checkout - {storeName}</h3>

      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Order Summary:</h4>
        <div className="space-y-1 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.title} x{item.qty}
              </span>
              <span>₹{Math.round((item.priceCents * item.qty) / 100)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-2 pt-2">
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium">Your Information:</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Address (Optional)
          </label>
          <textarea
            value={customerInfo.address}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))
            }
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Street address, city, pincode..."
          />
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
      >
        {isLoading ? "Placing Order..." : `Place Order (₹${total})`}
      </button>

      <p className="text-xs text-gray-500 mt-2 text-center">
        You'll receive payment instructions after placing the order
      </p>
    </div>
  );
}
