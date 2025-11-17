"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { PaymentSettings } from "./PaymentSettings";
import { DeliverySettings } from "./DeliverySettings";
import MobileVerification from "./MobileVerification";
import { ImageUpload } from "./ImageUpload";
import type { Store } from "@/types/interfaces";
import {
  sanitizeText,
  sanitizeHandle,
  sanitizePhone,
  sanitizeCurrency,
  sanitizeUrl,
} from "@/lib/sanitize";

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
  const [logoUrl, setLogoUrl] = useState(store?.logo_url || null);
  const [bannerUrl, setBannerUrl] = useState(store?.banner_url || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (store) {
      setName(store.name);
      setHandle(store.handle);
      setWhatsappNumber(store.whatsapp_e164 || "");
      setCurrency(store.currency || "USD");
      setLogoUrl(store.logo_url || null);
      setBannerUrl(store.banner_url || null);
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
      // Sanitize all inputs before saving
      const sanitizedData = {
        name: sanitizeText(name).substring(0, 100),
        handle: sanitizeHandle(handle),
        whatsapp_e164: sanitizePhone(whatsappNumber),
        currency: sanitizeCurrency(currency),
        logo_url: logoUrl ? sanitizeUrl(logoUrl) : null,
        banner_url: bannerUrl ? sanitizeUrl(bannerUrl) : null,
      };

      // Validate required fields
      if (!sanitizedData.name || !sanitizedData.handle) {
        setMessage("Store name and handle are required");
        setLoading(false);
        return;
      }

      if (store) {
        // Update existing store
        const { error } = await sb
          .from("stores")
          .update(sanitizedData)
          .eq("id", store.id);

        if (error) throw error;
        setMessage("Store updated successfully!");
      } else {
        // Create new store
        const { error: storeError } = await sb.from("stores").insert({
          owner_id: userId,
          ...sanitizedData,
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
    <div className="space-y-6">
      {/* Store Basic Settings */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Basic Information
          </h3>

          {/* Store Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Store Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleGenerateHandle}
              required
              placeholder="e.g., Sweet Bakery"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              The name that customers will see
            </p>
          </div>

          {/* Store Handle */}
          <div>
            <label
              htmlFor="handle"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Store Handle (URL) *
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
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
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={handleGenerateHandle}
                className="px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Auto Generate
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Your store URL:{" "}
              <span className="font-mono text-blue-600 font-medium">
                /{handle || "your-store"}
              </span>
            </p>
          </div>

          {/* WhatsApp Number & Currency in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* WhatsApp Number */}
            <div>
              <label
                htmlFor="whatsapp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                WhatsApp Number *
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                required
                placeholder="+919876543210"
                pattern="^\+?[1-9]\d{10,14}$"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-1.5 text-xs text-gray-500">With country code</p>
            </div>

            {/* Currency */}
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Currency *
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="USD">🇺🇸 USD - US Dollar</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - British Pound</option>
                <option value="INR">🇮🇳 INR - Indian Rupee</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Store Visual Identity Section */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎨 Store Branding
          </h3>

          {/* Preview Section */}
          {(logoUrl || bannerUrl) && (
            <div className="mb-4 p-3 sm:p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-800">
                  👀 Preview
                </span>
              </div>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt="Store banner preview"
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt="Store logo preview"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-gray-900 truncate">
                        {name || "Store Name"}
                      </h5>
                      <p className="text-sm text-gray-600">
                        Browse our products
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Logo Upload */}
            <ImageUpload
              label="Store Logo"
              value={logoUrl}
              onChange={setLogoUrl}
              aspectRatio="square"
              imageType="logo"
              description="Upload your store logo. Recommended size: 200x200px (square). Will be displayed as a circle. For best results, use a square image with your logo centered."
            />

            {/* Banner Upload */}
            <ImageUpload
              label="Store Banner"
              value={bannerUrl}
              onChange={setBannerUrl}
              aspectRatio="banner"
              imageType="banner"
              description="Upload a banner image for your store. Recommended size: 1200x400px. This will be displayed at the top of your store page."
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.includes("Error")
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-green-50 text-green-800 border-green-200"
            }`}
          >
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 sm:py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span>{store ? "💾 Update Store" : "🚀 Create Store"}</span>
            )}
          </button>

          {store && handle && (
            <button
              type="button"
              onClick={() => window.open(`/${handle}`, "_blank")}
              className="px-6 py-3.5 sm:py-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              👁️ Preview Store
            </button>
          )}
        </div>

        {/* Phone Verification Section */}
        {store && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200">
            <MobileVerification
              storeId={store.id}
              initialPhone={whatsappNumber}
            />
          </div>
        )}

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
            payment_enabled: store.payment_enabled || false,
            payment_method: store.payment_method || "direct",
            upi_id: store.upi_id || undefined,
            paytm_number: store.paytm_number || undefined,
            payment_instructions: store.payment_instructions || undefined,
          }}
        />
      )}

      {/* Delivery Settings - Only show for existing stores */}
      {store && (
        <DeliverySettings
          storeId={store.id}
          initialEnabled={store.delivery_enabled || false}
          initialType={store.delivery_type || "none"}
          initialSlots={store.delivery_slots || []}
        />
      )}
    </div>
  );
}
