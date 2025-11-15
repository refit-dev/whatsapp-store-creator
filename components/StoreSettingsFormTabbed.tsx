"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { PaymentSettings } from "./PaymentSettings";
import { DeliverySettings } from "./DeliverySettings";
import { StoreStatusToggle } from "./StoreStatusToggle";
import MobileVerification from "./MobileVerification";
import { ImageUpload } from "./ImageUpload";
import type { Store } from "@/types/interfaces";

interface StoreSettingsFormProps {
  store: Store | undefined;
  userId: string;
}

type TabType = "basic" | "branding" | "status" | "verification" | "payment" | "delivery";

export function StoreSettingsFormTabbed({ store, userId }: StoreSettingsFormProps) {
  const sb = supabaseBrowser();
  
  const [activeTab, setActiveTab] = useState<TabType>("basic");
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
      if (store) {
        const { error } = await sb
          .from("stores")
          .update({
            name,
            handle,
            whatsapp_e164: whatsappNumber,
            currency,
            logo_url: logoUrl,
            banner_url: bannerUrl,
          })
          .eq("id", store.id);

        if (error) throw error;
        setMessage("✓ Store updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const { error: storeError } = await sb.from("stores").insert({
          owner_id: userId,
          name,
          handle,
          whatsapp_e164: whatsappNumber,
          currency,
          logo_url: logoUrl,
          banner_url: bannerUrl,
        });

        if (storeError) throw storeError;

        setMessage("✓ Store created! Redirecting...");
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

  const tabs = [
    { id: "basic" as TabType, label: "Basic", icon: "📋", show: true },
    { id: "branding" as TabType, label: "Branding", icon: "🎨", show: true },
    { id: "status" as TabType, label: "Status", icon: "🔄", show: !!store },
    { id: "verification" as TabType, label: "Verify", icon: "✓", show: !!store },
    { id: "payment" as TabType, label: "Payment", icon: "💳", show: !!store },
    { id: "delivery" as TabType, label: "Delivery", icon: "🚚", show: !!store },
  ].filter(tab => tab.show);

  return (
    <div className="space-y-4">
      {/* Horizontal Scrollable Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-[400px]">
        {/* Basic Information Tab */}
        {activeTab === "basic" && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📋</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Essential details about your store
                  </p>
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleGenerateHandle}
                  required
                  placeholder="e.g., Sweet Bakery"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Store Handle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Handle (URL) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) =>
                      setHandle(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    required
                    placeholder="sweet-bakery"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateHandle}
                    className="px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Your URL: <span className="font-mono text-blue-600">/{handle || "your-store"}</span>
                </p>
              </div>

              {/* WhatsApp & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    required
                    placeholder="+919876543210"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="GBP">🇬🇧 GBP</option>
                    <option value="INR">🇮🇳 INR</option>
                    <option value="CAD">🇨🇦 CAD</option>
                    <option value="AUD">🇦🇺 AUD</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.includes("Error")
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-green-50 text-green-800 border border-green-200"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "Saving..." : store ? "💾 Save Changes" : "🚀 Create Store"}
                </button>
                {store && handle && (
                  <button
                    type="button"
                    onClick={() => window.open(`/${handle}`, "_blank")}
                    className="px-6 py-3.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
                  >
                    👁️ Preview
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Branding Tab */}
        {activeTab === "branding" && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Store Branding
                  </h3>
                  <p className="text-sm text-gray-600">
                    Customize your store's appearance
                  </p>
                </div>
              </div>

              {/* Preview */}
              {(logoUrl || bannerUrl) && (
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-sm font-semibold text-blue-800 mb-3">👀 Preview</p>
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    {bannerUrl && (
                      <img src={bannerUrl} alt="Banner" className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4 flex items-center gap-3">
                      {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                      )}
                      <div>
                        <h5 className="font-semibold text-gray-900">{name || "Store Name"}</h5>
                        <p className="text-sm text-gray-600">Browse our products</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <ImageUpload
                label="Store Logo"
                value={logoUrl}
                onChange={setLogoUrl}
                aspectRatio="square"
                imageType="logo"
                description="200x200px, displayed as circle"
              />

              <ImageUpload
                label="Store Banner"
                value={bannerUrl}
                onChange={setBannerUrl}
                aspectRatio="banner"
                imageType="banner"
                description="1200x400px, displayed at top"
              />

              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.includes("Error")
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-green-50 text-green-800 border border-green-200"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? "Saving..." : "💾 Save Branding"}
              </button>
            </div>
          </form>
        )}

        {/* Store Status Tab */}
        {activeTab === "status" && store && (
          <div className="p-4 sm:p-6">
            <StoreStatusToggle
              storeId={store.id}
              initialIsActive={store.is_active ?? true}
            />
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === "verification" && store && (
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3 pb-4 border-b mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  Phone Verification
                </h3>
                <p className="text-sm text-gray-600">
                  Verify your WhatsApp number
                </p>
              </div>
            </div>
            <MobileVerification
              storeId={store.id}
              initialPhone={whatsappNumber}
            />
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === "payment" && store && (
          <div className="p-4 sm:p-6">
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
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === "delivery" && store && (
          <div className="p-4 sm:p-6">
            <DeliverySettings
              storeId={store.id}
              initialEnabled={store.delivery_enabled || false}
              initialType={store.delivery_type || "none"}
              initialSlots={store.delivery_slots || []}
            />
          </div>
        )}
      </div>

      {/* Back Link */}
      {store && (
        <div className="text-center">
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
