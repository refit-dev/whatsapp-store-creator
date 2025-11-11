import { supabaseServer } from "@/lib/supabase-server";
import { CartProvider } from "@/components/CartProvider";
import { CartSummary } from "@/components/CartSummary";
import { UnifiedCheckout } from "@/components/UnifiedCheckout";
import Link from "next/link";

export default async function CheckoutPage({
  params,
}: {
  params: { handle: string };
}) {
  const supabase = supabaseServer();
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select(
      "id, handle, name, logo_url, banner_url, currency, whatsapp_e164, is_payments_enabled"
    )
    .eq("handle", params.handle)
    .single();

  if (storeError) {
    console.error("Store fetch error:", storeError);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Store
          </h1>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Store Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            This store doesn't exist or has been removed
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Create a clean store object with only serializable properties
  const cleanStore = {
    handle: store.handle,
    name: store.name,
    currency: store.currency,
    whatsapp_e164: store.whatsapp_e164 || "",
  };

  return (
    <CartProvider storeHandle={params.handle}>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/${params.handle}`}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Store
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Checkout
            </h1>
            <p className="text-gray-600 mt-2">
              Complete your order and send it via WhatsApp
            </p>
          </div>

          {/* Checkout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="order-2 lg:order-1">
              <UnifiedCheckout
                storeId={store.id}
                storeName={store.name}
                storeHandle={store.handle}
                whatsappNumber={store.whatsapp_e164 || ""}
                currency={store.currency || "INR"}
              />
            </div>

            <div className="order-1 lg:order-2">
              <CartSummary currency={store.currency} />
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="text-3xl">🔒</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Secure & Private
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your order is sent directly to the seller via WhatsApp. Your
                  information is not stored on our servers and is only used to
                  prepare your order message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </CartProvider>
  );
}
