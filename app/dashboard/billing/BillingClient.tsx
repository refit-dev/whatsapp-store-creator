"use client";

import { useState } from "react";
import { useSubscription } from "@/components/SubscriptionProvider";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { ReferralBanner } from "@/components/ReferralBanner";
import { useCurrency } from "@/components/CurrencyProvider";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { formatPrice } from "@/lib/currency-utils";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BillingClient() {
  const { subscription, status, daysRemaining, refreshSubscription } =
    useSubscription();
  const { currency, prices } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      // Create Razorpay subscription
      const subscriptionResponse = await fetch(
        "/api/razorpay/create-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user_" + Date.now(), // You should use actual user ID
            userEmail: "user@example.com", // You should use actual user email
            userName: "User", // You should use actual user name
            phone: "", // Optional phone number
          }),
        }
      );

      if (!subscriptionResponse.ok) {
        throw new Error("Failed to create subscription");
      }

      const { subscriptionId, shortUrl } = await subscriptionResponse.json();

      // Redirect to Razorpay's hosted checkout page for subscription
      if (shortUrl) {
        window.open(shortUrl, "_blank");

        // You can also poll for subscription status
        setTimeout(async () => {
          try {
            await refreshSubscription();
          } catch (error) {
            console.log("Status refresh failed:", error);
          }
        }, 5000);
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Subscription creation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) {
      alert("No active subscription to cancel.");
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          result.message ||
            "Subscription cancelled successfully. You can continue using the service until the end of your current billing period."
        );
        await refreshSubscription();
        setShowCancelModal(false);
      } else {
        throw new Error(result.error || "Cancellation failed");
      }
    } catch (error) {
      console.error("Cancellation error:", error);
      alert(
        "Failed to cancel subscription. Please try again or contact support."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Billing & Subscription
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your subscription and billing details
              </p>
            </div>
            <div className="md:w-48">
              <CurrencySwitcher />
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="mb-6">
          <SubscriptionStatus />
        </div>

        {/* Subscription Management - Only show for active paid subscriptions */}
        {subscription && status === "active" && !subscription.is_trial && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Subscription Management
            </h2>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-4">
              <div>
                <div className="font-semibold text-lg">Pro Plan</div>
                <div className="text-gray-600">{prices.monthly}/month</div>
                <div className="text-sm text-gray-500">
                  Active until{" "}
                  {new Date(subscription.ends_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600 font-medium mb-2">
                  ✅ Active
                </div>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    Good to know
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    If you cancel your subscription, you'll continue to have
                    access to all Pro features until the end of your current
                    billing period. After that, your account will automatically
                    switch to read-only mode.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referral Banner */}
        <ReferralBanner />

        {/* Pricing Plans */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Pricing Plans
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Trial */}
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Free Trial</h3>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {currency === "USD" ? "$0" : "₹0"}
                </div>
                <div className="text-gray-600">for 14 days</div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Unlimited products</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>WhatsApp integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Order management</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Basic analytics</span>
                </li>
              </ul>

              <button
                disabled={status === "trial"}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {status === "trial" ? "Current Plan" : "Already Used"}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-500 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Pro Plan</h3>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {prices.monthly}
                </div>
                <div className="text-gray-600">per month</div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Everything in Free Trial</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Priority support</span>
                </li>
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={isProcessing || status === "active"}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? "Processing..."
                  : status === "active"
                  ? "Current Plan"
                  : status === "trial"
                  ? "Upgrade Now"
                  : "Subscribe"}
              </button>

              {currency === "USD" && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Payment will be processed in INR (₹259) via Razorpay
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Billing History */}
        {subscription && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Billing History
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-semibold">
                    {subscription.is_trial ? "Free Trial" : "Pro Plan"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(subscription.starts_at).toLocaleDateString()} -{" "}
                    {new Date(subscription.ends_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {subscription.is_trial
                      ? currency === "USD"
                        ? "$0.00"
                        : "₹0.00"
                      : prices.monthly}
                  </div>
                  <div className="text-sm text-gray-600">
                    {subscription.status === "active" ? "Active" : "Expired"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cancel Subscription?
              </h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to cancel your Pro subscription? This
                action cannot be undone.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <div className="text-sm font-medium text-amber-900">
                    What happens next:
                  </div>
                  <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                    <li>
                      Your Pro features remain active until{" "}
                      {subscription
                        ? new Date(subscription.ends_at).toLocaleDateString()
                        : "the end of your billing period"}
                    </li>
                    <li>No further charges will be made</li>
                    <li>You can reactivate anytime</li>
                    <li>Your store data will be preserved</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isCancelling ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </main>
  );
}
