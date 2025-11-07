"use client";

import { useSubscription } from "./SubscriptionProvider";
import { useCurrency } from "./CurrencyProvider";
import { useState } from "react";
import Link from "next/link";

export function SubscriptionStatus() {
  const {
    subscription,
    status,
    daysRemaining,
    isLoading,
    refreshSubscription,
  } = useSubscription();
  const { prices } = useCurrency();
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      // Call the function to give free trial
      const response = await fetch("/api/subscription/start-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Refresh subscription data
        await refreshSubscription();
      } else {
        console.error("Failed to start trial");
      }
    } catch (error) {
      console.error("Error starting trial:", error);
    } finally {
      setIsStartingTrial(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  if (status === "none") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">
              Start Your Free Trial
            </h3>
            <p className="text-blue-700 text-sm">
              Get 30 days free access to all features
            </p>
          </div>
          <button
            onClick={handleStartTrial}
            disabled={isStartingTrial}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isStartingTrial ? "Starting..." : "Start Trial"}
          </button>
        </div>
      </div>
    );
  }

  if (status === "trial") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">🎉</span>
              <h3 className="font-semibold text-green-900">
                Free Trial Active
              </h3>
            </div>
            <p className="text-green-700 text-sm">
              {daysRemaining} days remaining • Upgrade to continue after trial
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">✅</span>
              <h3 className="font-semibold text-blue-900">Pro Plan Active</h3>
            </div>
            <p className="text-blue-700 text-sm">
              Renews in {daysRemaining} days • {prices.monthly}/month
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Manage
          </Link>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <h3 className="font-semibold text-red-900">
                Subscription Expired
              </h3>
            </div>
            <p className="text-red-700 text-sm">
              Renew your subscription to continue using all features
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Renew Now
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
