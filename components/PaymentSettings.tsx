"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface PaymentSettingsProps {
  storeId: string;
  initialSettings?: {
    payment_enabled: boolean;
    payment_method: string;
    upi_id?: string;
    paytm_number?: string;
    payment_instructions?: string;
  };
  onUpdate?: () => void;
}

export function PaymentSettings({
  storeId,
  initialSettings,
  onUpdate,
}: PaymentSettingsProps) {
  const [settings, setSettings] = useState({
    payment_enabled: initialSettings?.payment_enabled || false,
    payment_method: initialSettings?.payment_method || "direct",
    upi_id: initialSettings?.upi_id || "",
    paytm_number: initialSettings?.paytm_number || "",
    payment_instructions:
      initialSettings?.payment_instructions ||
      "Please send payment to the above details and share screenshot on WhatsApp for order confirmation.",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = supabaseBrowser();

  const handleSave = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          payment_enabled: settings.payment_enabled,
          payment_method: settings.payment_method,
          upi_id: settings.upi_id || null,
          paytm_number: settings.paytm_number || null,
          payment_instructions: settings.payment_instructions || null,
        })
        .eq("id", storeId);

      if (error) throw error;

      setMessage("Payment settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
      onUpdate?.();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="text-2xl mr-2">💳</span>
        Payment Settings
      </h3>

      {/* Payment Toggle */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={settings.payment_enabled}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                payment_enabled: e.target.checked,
              }))
            }
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
          />
          <div>
            <span className="font-medium text-blue-900">Enable Payments</span>
            <p className="text-sm text-blue-700 mt-1">
              Allow customers to pay directly through your store. This adds a
              "Buy Now" button to your products.
            </p>
          </div>
        </label>
      </div>

      {settings.payment_enabled && (
        <>
          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="direct"
                  checked={settings.payment_method === "direct"}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      payment_method: e.target.value,
                    }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2">Direct Payment (UPI/Paytm) - Free</span>
              </label>
              <label className="flex items-center opacity-50">
                <input
                  type="radio"
                  value="gateway"
                  disabled
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2">
                  Payment Gateway (Coming Soon) - Auto-collect with cards, UPI,
                  wallets
                </span>
              </label>
            </div>
          </div>

          {settings.payment_method === "direct" && (
            <div className="space-y-4">
              {/* UPI ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={settings.upi_id}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, upi_id: e.target.value }))
                  }
                  placeholder="yourname@paytm or yourname@phonepe"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Most popular payment method in India
                </p>
              </div>

              {/* Paytm Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paytm/PhonePe Number
                </label>
                <input
                  type="text"
                  value={settings.paytm_number}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      paytm_number: e.target.value,
                    }))
                  }
                  placeholder="+91 9876543210"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alternative payment option for customers
                </p>
              </div>

              {/* Payment Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Instructions for Customers
                </label>
                <textarea
                  value={settings.payment_instructions}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      payment_instructions: e.target.value,
                    }))
                  }
                  placeholder="Instructions for customers on how to complete payment..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be shown to customers during checkout
                </p>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Customer Preview:
                </h4>
                <div className="text-sm space-y-2">
                  {settings.upi_id && (
                    <div className="bg-blue-100 p-2 rounded">
                      <strong>UPI:</strong> {settings.upi_id}
                    </div>
                  )}
                  {settings.paytm_number && (
                    <div className="bg-purple-100 p-2 rounded">
                      <strong>Paytm/PhonePe:</strong> {settings.paytm_number}
                    </div>
                  )}
                  {settings.payment_instructions && (
                    <div className="bg-yellow-100 p-2 rounded">
                      <strong>Instructions:</strong>{" "}
                      {settings.payment_instructions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Save Button */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? "Saving..." : "Save Payment Settings"}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            message.includes("Error")
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-green-50 text-green-800 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
