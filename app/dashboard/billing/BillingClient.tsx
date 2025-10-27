"use client";

import { useState } from "react";
import { useSubscription } from "@/components/SubscriptionProvider";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { ReferralBanner } from "@/components/ReferralBanner";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BillingClient() {
  const { subscription, status, daysRemaining, refreshSubscription } =
    useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

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
          <h1 className="text-3xl font-bold text-gray-900">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription and billing details
          </p>
        </div>

        {/* Subscription Status */}
        <div className="mb-6">
          <SubscriptionStatus />
        </div>

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
                <div className="text-3xl font-bold text-green-600 mt-2">₹0</div>
                <div className="text-gray-600">for 30 days</div>
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
                  ₹259
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
                    {subscription.is_trial ? "₹0.00" : "₹259.00"}
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

      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </main>
  );
}
