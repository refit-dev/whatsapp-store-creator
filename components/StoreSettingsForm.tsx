"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { PaymentSettings } from "./PaymentSettings";
import type { Store } from "@/types/interfaces";

interface StoreSettingsFormProps {
  store: Store | undefined;
  userId: string;
}

export function StoreSettingsForm({ store, userId }: StoreSettingsFormProps) {
  const sb = supabaseBrowser();

  const [name, setName] = useState(store?.name || "");
  const [handle, setHandle] = useState(store?.handle || "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    store?.whatsapp_e164 || ""
  );
  const [currency, setCurrency] = useState(store?.currency || "USD");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (store) {
      setName(store.name);
      setHandle(store.handle);
      setWhatsappNumber(store.whatsapp_e164 || "");
      setCurrency(store.currency || "USD");
    }
  }, [store]);

  const handleGenerateHandle = () => {
    if (name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 30);
      setHandle(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (store) {
        // Update existing store
        const { error } = await sb
          .from("stores")
          .update({
            name,
            handle,
            whatsapp_e164: whatsappNumber,
            currency,
          })
          .eq("id", store.id);

        if (error) throw error;
        setMessage("Store updated successfully!");
      } else {
        // Create new store
        const { error: storeError } = await sb.from("stores").insert({
          owner_id: userId,
          name,
          handle,
          whatsapp_e164: whatsappNumber,
          currency,
        });

        if (storeError) throw storeError;

        setMessage("Store created successfully! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving store:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Store Basic Settings */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Store Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleGenerateHandle}
            required
            placeholder="e.g., Sweet Bakery"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            The name that customers will see
          </p>
        </div>

        {/* Store Handle */}
        <div>
          <label
            htmlFor="handle"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Store Handle (URL)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) =>
                setHandle(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                )
              }
              required
              pattern="^[a-z0-9-]+$"
              placeholder="sweet-bakery"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleGenerateHandle}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Generate
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Your store will be at:{" "}
            <span className="font-mono text-blue-600">/{handle}</span>
          </p>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label
            htmlFor="whatsapp"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            WhatsApp Number
          </label>
          <input
            id="whatsapp"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            required
            placeholder="+12345678901"
            pattern="^\+?[1-9]\d{10,14}$"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Include country code (e.g., +1 for USA, +91 for India)
          </p>
        </div>

        {/* Currency */}
        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CNY">CNY - Chinese Yuan</option>
          </select>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.includes("Error")
                ? "bg-red-50 text-red-800"
                : "bg-green-50 text-green-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : store ? "Update Store" : "Create Store"}
        </button>

        {store && (
          <a
            href="/dashboard"
            className="block w-full text-center py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </a>
        )}
      </form>

      {/* Payment Settings - Only show for existing stores */}
      {store && (
        <PaymentSettings
          storeId={store.id}
          initialSettings={{
            payment_enabled: (store as any).payment_enabled || false,
            payment_method: (store as any).payment_method || "direct",
            upi_id: (store as any).upi_id || undefined,
            paytm_number: (store as any).paytm_number || undefined,
            payment_instructions:
              (store as any).payment_instructions || undefined,
          }}
        />
      )}
    </div>
  );
}
