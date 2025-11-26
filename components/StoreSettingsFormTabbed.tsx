"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { PaymentSettings } from "./PaymentSettings";
import { DeliverySettings } from "./DeliverySettings";
import { StoreStatusToggle } from "./StoreStatusToggle";
import MobileVerification from "./MobileVerification";
import { ImageUpload } from "./ImageUpload";
import CategorySelector from "./CategorySelector";
import type { Store } from "@/types/interfaces";

interface StoreSettingsFormProps {
  store: Store | undefined;
  userId: string;
}

type TabType =
  | "basic"
  | "branding"
  | "categories"
  | "status"
  | "verification"
  | "payment"
  | "delivery"
  | "account";

export function StoreSettingsFormTabbed({
  store,
  userId,
}: StoreSettingsFormProps) {
  const sb = supabaseBrowser();

  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [name, setName] = useState(store?.name || "");
  const [handle, setHandle] = useState(store?.handle || "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    store?.whatsapp_e164 || ""
  );
  const [currency, setCurrency] = useState(store?.currency || "USD");
  const [storeMode, setStoreMode] = useState<"order" | "inquiry" | "hybrid">(
    (store as any)?.store_mode || "order"
  );
  const [logoUrl, setLogoUrl] = useState(store?.logo_url || null);
  const [bannerUrl, setBannerUrl] = useState(store?.banner_url || null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesMessage, setCategoriesMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (store) {
      setName(store.name);
      setHandle(store.handle);
      setWhatsappNumber(store.whatsapp_e164 || "");
      setCurrency(store.currency || "USD");
      setStoreMode((store as any)?.store_mode || "order");
      setLogoUrl(store.logo_url || null);
      setBannerUrl(store.banner_url || null);
      loadStoreCategories();
    }
  }, [store]);

  const loadStoreCategories = async () => {
    if (!store?.id) return;

    try {
      const { data } = await sb
        .from("store_categories")
        .select("category_id")
        .eq("store_id", store.id);

      if (data) {
        setSelectedCategories(data.map((sc) => sc.category_id));
      }
    } catch (error) {
      console.error("Error loading store categories:", error);
    }
  };

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

  const handleSaveCategories = async () => {
    if (!store?.id) return;

    setCategoriesLoading(true);
    setCategoriesMessage("");

    try {
      const response = await fetch("/api/store-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          categoryIds: selectedCategories,
          primaryCategoryId: selectedCategories[0], // First selected is primary
        }),
      });

      if (!response.ok) throw new Error("Failed to save categories");

      setCategoriesMessage("✓ Categories saved successfully!");
      setTimeout(() => setCategoriesMessage(""), 3000);
    } catch (error) {
      console.error("Error saving categories:", error);
      setCategoriesMessage("Error: Failed to save categories");
    } finally {
      setCategoriesLoading(false);
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
            store_mode: storeMode,
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
          store_mode: storeMode,
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
    {
      id: "categories" as TabType,
      label: "Categories",
      icon: "🏷️",
      show: !!store,
    },
    { id: "status" as TabType, label: "Status", icon: "🔄", show: !!store },
    {
      id: "verification" as TabType,
      label: "Verify",
      icon: "✓",
      show: !!store,
    },
    { id: "payment" as TabType, label: "Payment", icon: "💳", show: !!store },
    { id: "delivery" as TabType, label: "Delivery", icon: "🚚", show: !!store },
    { id: "account" as TabType, label: "Account", icon: "🗑️", show: true },
  ].filter((tab) => tab.show);

  return (
    <div className="space-y-4">
      {/* Horizontal Scrollable Tab Navigation */}
      <div
        className="bg-gray-50 border border-gray-200 rounded-lg p-2 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex gap-1.5 min-w-max pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200"
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
                  Your URL:{" "}
                  <span className="font-mono text-blue-600">
                    /{handle || "your-store"}
                  </span>
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

              {/* Store Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Mode *
                </label>
                <select
                  value={storeMode}
                  onChange={(e) =>
                    setStoreMode(
                      e.target.value as "order" | "inquiry" | "hybrid"
                    )
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="order">
                    🛒 Order Mode - Traditional e-commerce with Buy Now
                  </option>
                  <option value="inquiry">
                    💬 Inquiry Mode - Express Interest for high-value items
                  </option>
                  <option value="hybrid">
                    🔀 Hybrid Mode - Both order and inquiry options
                  </option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  {storeMode === "order" &&
                    "Customers can add products to cart and checkout"}
                  {storeMode === "inquiry" &&
                    "Customers submit inquiries for products (great for properties, vehicles, B2B)"}
                  {storeMode === "hybrid" &&
                    "Choose per product: allow buying or require inquiry"}
                </p>
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
                  {loading
                    ? "Saving..."
                    : store
                    ? "💾 Save Changes"
                    : "🚀 Create Store"}
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
                  <p className="text-sm font-semibold text-blue-800 mb-3">
                    👀 Preview
                  </p>
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    {bannerUrl && (
                      <img
                        src={bannerUrl}
                        alt="Banner"
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4 flex items-center gap-3">
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      )}
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {name || "Store Name"}
                        </h5>
                        <p className="text-sm text-gray-600">
                          Browse our products
                        </p>
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

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🏷️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Store Categories
                  </h3>
                  <p className="text-sm text-gray-600">
                    Help customers discover your store by selecting relevant
                    categories
                  </p>
                </div>
              </div>

              {/* Category Selector */}
              <CategorySelector
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
                maxSelection={3}
                showSubcategories={false}
                mode="settings"
              />

              {/* Message */}
              {categoriesMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    categoriesMessage.includes("Error")
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-green-50 text-green-800 border border-green-200"
                  }`}
                >
                  {categoriesMessage}
                </div>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveCategories}
                disabled={categoriesLoading || selectedCategories.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3.5 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categoriesLoading ? "Saving..." : "💾 Save Categories"}
              </button>

              {selectedCategories.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  Select at least one category to help customers find your store
                </p>
              )}
            </div>
          </div>
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

        {/* Account/Delete Account Tab */}
        {activeTab === "account" && (
          <div className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">👤</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Account Management
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage your account settings, data privacy, and GDPR rights
                  </p>
                </div>
              </div>

              {/* GDPR Data Rights */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">
                      Your Data Rights (GDPR Compliant)
                    </h4>
                    <p className="text-blue-800 text-sm">
                      You have full control over your personal data. Exercise
                      your rights below:
                    </p>
                  </div>
                </div>

                {/* Export Data */}
                <div className="bg-white border border-blue-200 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">
                        Export My Data
                      </h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Download a complete copy of all your personal data in
                        JSON format. This includes stores, products, orders, and
                        account information.
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/account/export");
                            if (response.ok) {
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `watzy-data-export-${Date.now()}.json`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                              alert(
                                "✅ Your data has been exported successfully!"
                              );
                            } else {
                              alert(
                                "❌ Failed to export data. Please try again."
                              );
                            }
                          } catch (error) {
                            alert("❌ An error occurred while exporting data.");
                            console.error("Export error:", error);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download My Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">
                        Privacy Policy
                      </h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Review our privacy policy to understand how we collect,
                        use, and protect your data.
                      </p>
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-red-900 mb-2">
                      Danger Zone
                    </h4>
                    <p className="text-red-800 mb-4">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>

                    <div className="bg-white border border-red-300 rounded-lg p-4 mb-4">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        What will be deleted:
                      </h5>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        <li>All your stores and products</li>
                        <li>All customer orders and data</li>
                        <li>All uploaded images and files</li>
                        <li>Your account and login credentials</li>
                        <li>Payment and subscription history</li>
                      </ul>
                    </div>

                    <a
                      href="/dashboard/account/delete"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete My Account
                    </a>
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">
                  Need help instead?
                </h5>
                <p className="text-blue-800 text-sm mb-3">
                  If you're experiencing issues, we're here to help! Consider
                  contacting support before deleting your account.
                </p>
                <a
                  href="/dashboard/contact-us"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Contact Support
                </a>
              </div>
            </div>
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
