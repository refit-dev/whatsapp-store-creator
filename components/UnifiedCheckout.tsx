"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useCart } from "./CartProvider";
import { buildWhatsAppUrl } from "@/utils/wa";
import { isValidPhoneInternational } from "@/lib/validations";
import { ConfirmWhatsAppButton } from "./ConfirmWhatsAppButton";

interface UnifiedCheckoutProps {
  storeId: string;
  storeName: string;
  storeHandle: string;
  whatsappNumber: string;
  currency: string;
}

interface PaymentConfig {
  payment_enabled: boolean;
  payment_method: string;
  upi_id?: string;
  paytm_number?: string;
  payment_instructions?: string;
}

interface DeliveryConfig {
  delivery_enabled: boolean;
  delivery_type: string;
  delivery_slots: string[];
}

export function UnifiedCheckout({
  storeId,
  storeName,
  storeHandle,
  whatsappNumber,
  currency,
}: UnifiedCheckoutProps) {
  const { items, subtotalCents, clearCart } = useCart();
  const total = Math.round(subtotalCents / 100); // Convert cents to currency units

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(
    null
  );
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig | null>(
    null
  );
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    specialInstructions: "",
    deliverySlot: "",
    deliveryDay: "",
    deliveryTime: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<
    "online" | "whatsapp" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [whatsappOpened, setWhatsappOpened] = useState(false);

  const supabase = supabaseBrowser();

  // Load payment and delivery configuration
  useEffect(() => {
    const loadConfigs = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select(
          "payment_enabled, payment_method, upi_id, paytm_number, payment_instructions, delivery_enabled, delivery_type, delivery_slots"
        )
        .eq("id", storeId)
        .single();

      if (!error && data) {
        setPaymentConfig({
          payment_enabled: data.payment_enabled,
          payment_method: data.payment_method,
          upi_id: data.upi_id,
          paytm_number: data.paytm_number,
          payment_instructions: data.payment_instructions,
        });

        // Parse delivery_slots if it's a string (JSONB from database)
        let parsedSlots = data.delivery_slots || [];
        if (typeof data.delivery_slots === "string") {
          try {
            parsedSlots = JSON.parse(data.delivery_slots);
          } catch (e) {
            console.error("Error parsing delivery_slots:", e);
            parsedSlots = [];
          }
        }

        // Auto-migrate mixed old data to day_and_time format
        let finalType = data.delivery_type || "none";
        let finalSlots = Array.isArray(parsedSlots) ? parsedSlots : [];

        if (finalSlots.length > 0 && !finalSlots[0]?.includes("|")) {
          // Check if we have mixed days and time slots (old format)
          const days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const hasDays = finalSlots.some((slot) => days.includes(slot));
          const hasTimeSlots = finalSlots.some(
            (slot) =>
              slot.includes("AM") || slot.includes("PM") || slot.includes("-")
          );

          if (hasDays && hasTimeSlots) {
            // Mixed data detected - separate and convert to day_and_time format
            const daySlots = finalSlots.filter((slot) => days.includes(slot));
            const timeSlots = finalSlots.filter(
              (slot) =>
                slot.includes("AM") || slot.includes("PM") || slot.includes("-")
            );

            // Create combinations
            finalSlots = daySlots.flatMap((day) =>
              timeSlots.map((time) => `${day}|${time}`)
            );
            finalType = "day_and_time";

            console.log("🔄 Auto-migrated mixed data:", {
              daySlots,
              timeSlots,
              combinations: finalSlots.length,
            });
          }
        }

        setDeliveryConfig({
          delivery_enabled: data.delivery_enabled || false,
          delivery_type: finalType,
          delivery_slots: finalSlots,
        });

        // Debug log
        console.log("Delivery Config Loaded:", {
          enabled: data.delivery_enabled,
          type: finalType,
          slots: finalSlots,
        });
      }
    };

    loadConfigs();
  }, [storeId, supabase]);

  // Helper to combine delivery slot info with notes
  const getOrderNotes = () => {
    let notes = "";

    if (deliveryConfig?.delivery_type === "day_and_time") {
      // Separate day and time dropdowns
      if (customerInfo.deliveryDay && customerInfo.deliveryTime) {
        notes += `Delivery: ${customerInfo.deliveryDay}, ${customerInfo.deliveryTime}\n\n`;
      }
    } else if (customerInfo.deliverySlot) {
      // Single dropdown for days or time_slots
      const label =
        deliveryConfig?.delivery_type === "days"
          ? "Delivery Day"
          : "Delivery Time";
      notes += `${label}: ${customerInfo.deliverySlot}\n\n`;
    }

    if (customerInfo.specialInstructions) {
      notes += customerInfo.specialInstructions;
    }

    return notes.trim();
  };

  const handlePayNow = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please fill in your name and phone number");
      return;
    }

    if (!isValidPhoneInternational(customerInfo.phone)) {
      alert(
        "Please enter a valid phone number. For India: 10-digit starting with 6-9 or +91XXXXXXXXXX. For other countries: use international format with + and country code."
      );
      return;
    }

    if (!customerInfo.address) {
      alert("Please provide a delivery address");
      return;
    }

    // Check delivery slot if required
    if (
      deliveryConfig?.delivery_enabled &&
      deliveryConfig.delivery_type !== "immediate" &&
      deliveryConfig.delivery_slots.length > 0 &&
      !customerInfo.deliverySlot
    ) {
      alert(
        `Please select a ${
          deliveryConfig.delivery_type === "days"
            ? "delivery day"
            : "delivery time slot"
        }`
      );
      return;
    }

    // Allow zero value orders for free products/samples

    setIsLoading(true);

    try {
      const totalAmount = subtotalCents || 0;
      const isZeroValueOrder = totalAmount === 0;

      // Create order with online payment method via API (to trigger inventory reduction)
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeHandle: storeHandle,
          buyer: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address,
            notes: getOrderNotes(),
          },
          items: items.map((item) => ({
            productId: item.id,
            title: item.title,
            priceCents: item.priceCents,
            qty: item.qty,
          })),
          paymentMethod: "online",
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }
      const order = await orderRes.json();

      // Update status to paid if it's a zero value order
      if (isZeroValueOrder) {
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);
      }

      setOrderId(order.id);
      setOrderPlaced(true);

      // For ₹0 orders, send to WhatsApp immediately
      if (isZeroValueOrder) {
        // Send order to WhatsApp for free orders
        const whatsappUrl = buildWhatsAppUrl({
          phoneE164: whatsappNumber,
          items: items.map((item) => ({
            title: item.title,
            qty: item.qty,
            priceCents: item.priceCents,
          })),
          buyer: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email, // Include email if provided
            address: customerInfo.address,
            notes: getOrderNotes(),
          },
          currency,
          paymentMethod: "online",
        });

        window.open(whatsappUrl, "_blank");

        // Show success message instead of payment details
        setShowPaymentDetails(false);
        clearCart(); // Clear cart only for free orders

        alert(
          "Free order sent to WhatsApp! The store owner will contact you shortly."
        );
      } else {
        // For paid orders, show payment details
        setShowPaymentDetails(true);
        // Don't clear cart yet - keep it for payment details display
      }

      // Send WhatsApp notification to store owner about new order
      await fetch("/api/notifications/new-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          orderId: order.id,
          customerName: customerInfo.name,
          total,
          paymentMethod: "online",
        }),
      });
    } catch (error: any) {
      console.error("Online payment error:", error);
      alert(`Error processing payment: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleWhatsAppOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please fill in your name and phone number");
      return;
    }

    if (!customerInfo.address || customerInfo.address.trim() === "") {
      alert("Please fill in your delivery address");
      return;
    }

    if (!isValidPhoneInternational(customerInfo.phone)) {
      alert(
        "Please enter a valid phone number. For India: 10-digit starting with 6-9 or +91XXXXXXXXXX. For other countries: use international format with + and country code."
      );
      return;
    }

    // Allow zero value orders for free products/samples

    setIsLoading(true);

    try {
      // Check delivery slot if required
      if (
        deliveryConfig?.delivery_enabled &&
        deliveryConfig.delivery_type !== "immediate" &&
        deliveryConfig.delivery_slots.length > 0 &&
        !customerInfo.deliverySlot
      ) {
        alert(
          `Please select a ${
            deliveryConfig.delivery_type === "days"
              ? "delivery day"
              : "delivery time slot"
          }`
        );
        setIsLoading(false);
        return;
      }

      // Create order with WhatsApp payment method
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeHandle: storeHandle,
          buyer: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address,
            notes: getOrderNotes(),
          },
          items: items.map((item) => ({
            productId: item.id,
            title: item.title,
            priceCents: item.priceCents,
            qty: item.qty,
          })),
          paymentMethod: "whatsapp",
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }
      const order = await orderRes.json();

      // Mark order as opened and redirect to WhatsApp
      try {
        await fetch("/api/orders/opened", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
      } catch (error) {
        console.log("Failed to mark order as opened:", error);
      }

      // Generate WhatsApp URL
      const waUrl = buildWhatsAppUrl({
        phoneE164: whatsappNumber,
        items: items.map((i) => ({
          title: i.title,
          qty: i.qty,
          priceCents: i.priceCents,
        })),
        buyer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email, // Include email if provided
          address: customerInfo.address,
          notes: getOrderNotes(),
        },
        paymentLink: undefined, // No payment link for WhatsApp orders
        currency: currency,
        paymentMethod: "whatsapp",
      });

      clearCart();

      // Open WhatsApp
      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank");

        // Show confirmation UI
        setWhatsappOpened(true);
        setOrderId(order.id);
      }
    } catch (error: any) {
      console.error("WhatsApp order error:", error);
      alert(error.message || "Failed to send order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatWhatsAppMessage = () => {
    const orderItems = items
      .map(
        (item) =>
          `• ${item.title} (${currency === "INR" ? "₹" : "$"}${Math.round(
            item.priceCents / 100
          )} x ${item.qty} = ${currency === "INR" ? "₹" : "$"}${Math.round(
            (item.priceCents * item.qty) / 100
          )})`
      )
      .join("\\n");

    const paymentStatus =
      paymentMethod === "online"
        ? "✅ PAID ONLINE"
        : "💰 Payment Pending (Pay on Delivery)";

    return encodeURIComponent(
      `🛒 New Order from ${storeName}\\n\\n` +
        `Order ID: ${orderId}\\n` +
        `Customer: ${customerInfo.name}\\n` +
        `Phone: ${customerInfo.phone}\\n` +
        `${customerInfo.email ? `Email: ${customerInfo.email}\\n` : ""}` +
        `${customerInfo.address ? `Address: ${customerInfo.address}\\n` : ""}` +
        `\\nItems:\\n${orderItems}\\n\\n` +
        `Total: ${currency === "INR" ? "₹" : "$"}${total}\\n` +
        `Payment Status: ${paymentStatus}\\n\\n` +
        `${
          customerInfo.specialInstructions
            ? `Special Instructions: ${customerInfo.specialInstructions}\\n\\n`
            : ""
        }` +
        `Please confirm order and share delivery details.`
    );
  };

  // If cart is empty (allow zero value products)
  if (items.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">🛒</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your cart is empty
        </h3>
        <p className="text-gray-600">
          Add some products to proceed with checkout.
        </p>
      </div>
    );
  }

  // Show WhatsApp confirmation UI after order is created and WhatsApp is opened
  if (whatsappOpened && orderId) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            WhatsApp Opened!
          </h3>
          <p className="text-gray-600">Your order details have been prepared</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex gap-3">
            <div className="text-2xl">📝</div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Next Steps:</h4>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Send the pre-filled message in WhatsApp</li>
                <li>Wait for the store to confirm your order</li>
                <li>Click the button below after sending</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Import and use the confirmation button */}
        <ConfirmWhatsAppButton
          orderId={orderId}
          onConfirmed={() => {
            // Optional: redirect or show success message
            setTimeout(() => {
              window.location.href = `/${storeHandle}`;
            }, 2000);
          }}
        />

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Order ID: <span className="font-mono">{orderId.slice(0, 8)}</span>
          </p>
        </div>
      </div>
    );
  }

  // Show payment details after online order placement
  if (orderPlaced && showPaymentDetails && paymentMethod === "online") {
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

          {paymentConfig?.upi_id && (
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

          {paymentConfig?.paytm_number && (
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
            <strong className="text-yellow-800">
              Amount to Pay: {currency === "INR" ? "₹" : "$"}
              {total}
            </strong>
          </div>

          {paymentConfig?.payment_instructions && (
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
            href={`https://wa.me/${whatsappNumber.replace(
              /\\D/g,
              ""
            )}?text=${formatWhatsAppMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              // Clear cart after user goes to WhatsApp (assumes payment completion)
              setTimeout(() => {
                clearCart();
              }, 2000); // Small delay to ensure WhatsApp opens
            }}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center touch-target text-base md:py-3 md:px-4"
          >
            <span className="mr-2">📱</span>
            Confirm Payment on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Main checkout form
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-4 md:mb-6 text-gray-900">
        🛒 Complete Your Order
      </h3>

      {/* Order Summary */}
      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3 text-gray-800">Order Summary</h4>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700 truncate mr-2">
                {item.title} × {item.qty}
              </span>
              <span className="text-gray-900 font-medium whitespace-nowrap">
                {currency === "INR" ? "₹" : "$"}
                {Math.round((item.priceCents * item.qty) / 100)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>
              {currency === "INR" ? "₹" : "$"}
              {total}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-4 mb-4 md:mb-6">
        <h4 className="font-medium text-gray-800">Your Information</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="+91 98765 43210 or +1 234 567 8900"
            className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (Optional)
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Address *
          </label>
          <textarea
            value={customerInfo.address}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))
            }
            rows={3}
            className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base resize-none"
            placeholder="Street address, city, state, pincode..."
          />
        </div>

        {/* Delivery Slot Selection */}
        {deliveryConfig?.delivery_enabled ? (
          deliveryConfig.delivery_type !== "immediate" &&
          deliveryConfig.delivery_slots.length > 0 ? (
            <div className="space-y-4">
              {deliveryConfig.delivery_type === "day_and_time" ? (
                // Two Separate Dropdowns: Day AND Time
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Delivery Day *
                    </label>
                    <select
                      value={customerInfo.deliveryDay}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          deliveryDay: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      required
                    >
                      <option value="">-- Select Day --</option>
                      {(() => {
                        // Extract unique days from "Monday|9AM-12PM" format
                        const days = new Set<string>();
                        deliveryConfig.delivery_slots.forEach((slot) => {
                          const [day] = slot.split("|");
                          if (day) days.add(day);
                        });
                        return Array.from(days).map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Delivery Time *
                    </label>
                    <select
                      value={customerInfo.deliveryTime}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          deliveryTime: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                      required
                    >
                      <option value="">-- Select Time --</option>
                      {(() => {
                        // Extract unique times from "Monday|9AM-12PM" format
                        const times = new Set<string>();
                        deliveryConfig.delivery_slots.forEach((slot) => {
                          const [, time] = slot.split("|");
                          if (time) times.add(time);
                        });
                        return Array.from(times).map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </>
              ) : deliveryConfig.delivery_type === "days" ? (
                // Only Day Selection
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Day *
                  </label>
                  <select
                    value={customerInfo.deliverySlot}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        deliverySlot: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                    required
                  >
                    <option value="">-- Select Day --</option>
                    {deliveryConfig.delivery_slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                // Time Slots Selection
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Time *
                  </label>
                  <select
                    value={customerInfo.deliverySlot}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        deliverySlot: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                    required
                  >
                    <option value="">-- Select Time Slot --</option>
                    {deliveryConfig.delivery_slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : deliveryConfig.delivery_type === "immediate" ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-xl">⚡</span>
                <p className="text-sm font-medium">
                  Immediate Delivery - Your order will be delivered ASAP!
                </p>
              </div>
            </div>
          ) : null
        ) : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            value={customerInfo.specialInstructions}
            onChange={(e) =>
              setCustomerInfo((prev) => ({
                ...prev,
                specialInstructions: e.target.value,
              }))
            }
            rows={2}
            className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base resize-none"
            placeholder="Any special requests or delivery instructions..."
          />
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-4 md:mb-6">
        <h4 className="font-medium text-gray-800 mb-3">
          Choose Payment Method
        </h4>

        <div className="space-y-3">
          {/* Pay Later (WhatsApp) Option */}
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all touch-target ${
              paymentMethod === "whatsapp"
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => setPaymentMethod("whatsapp")}
          >
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="whatsapp"
                checked={paymentMethod === "whatsapp"}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "online" | "whatsapp")
                }
                className="mr-3 w-5 h-5"
              />
              <div className="flex items-center">
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <div className="font-medium text-gray-900">Pay Later</div>
                  <div className="text-sm text-gray-600">
                    Send order to WhatsApp, pay when you receive
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Pay Now Option (only if enabled and configured) */}
          {paymentConfig?.payment_enabled &&
            (paymentConfig?.upi_id || paymentConfig?.paytm_number) && (
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === "online"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => setPaymentMethod("online")}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "online" | "whatsapp")
                    }
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        Pay Now Online
                      </div>
                      <div className="text-sm text-gray-600">
                        Pay with UPI/Paytm, then order goes to WhatsApp
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            )}
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-3">
        {paymentMethod === null ? (
          <div className="text-center py-4">
            <p className="text-gray-500">
              Please select a payment method to continue
            </p>
          </div>
        ) : paymentMethod === "online" ? (
          <button
            onClick={handlePayNow}
            disabled={isLoading || !customerInfo.name || !customerInfo.phone}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center touch-target text-base md:py-3 md:px-4"
          >
            <span className="mr-2">💳</span>
            {isLoading
              ? "Processing..."
              : `Pay Now - ${currency === "INR" ? "₹" : "$"}${total}`}
          </button>
        ) : (
          <button
            onClick={handleWhatsAppOrder}
            disabled={isLoading || !customerInfo.name || !customerInfo.phone}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center touch-target text-base md:py-3 md:px-4"
          >
            <span className="mr-2">📱</span>
            {isLoading ? "Sending..." : "Send Order to WhatsApp"}
          </button>
        )}

        {paymentMethod && (
          <p className="text-xs text-gray-500 text-center">
            {paymentMethod === "online"
              ? "After payment, your order details will be sent to the store via WhatsApp"
              : "Your order will be sent via WhatsApp. Pay when you receive your items."}
          </p>
        )}
      </div>
    </div>
  );
}
