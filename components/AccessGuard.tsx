"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "./SubscriptionProvider";
import { useCurrency } from "./CurrencyProvider";

interface AccessGuardProps {
  children: React.ReactNode;
  redirectPath?: string;
  allowTrialAccess?: boolean;
}

/**
 * Component that protects content based on subscription status
 * Redirects expired users to billing page unless they're on allowed pages
 */
export function AccessGuard({
  children,
  redirectPath = "/dashboard/billing",
  allowTrialAccess = true,
}: AccessGuardProps) {
  const { status, daysRemaining, isLoading } = useSubscription();
  const { prices } = useCurrency();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Allow access for active subscriptions
    if (status === "active") return;

    // Allow trial access if enabled and user has trial
    if (allowTrialAccess && status === "trial") return;

    // Redirect expired users to billing page
    if (status === "expired") {
      router.push(redirectPath);
      return;
    }

    // If user has no subscription at all, let auto-trial handle it
    // Don't redirect - let AutoTrialInitializer do its job
    if (status === "none") {
      return; // Let the user stay on the current page while auto-trial works
    }
  }, [status, isLoading, router, redirectPath, allowTrialAccess]);

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-sm text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your subscription...</p>
        </div>
      </div>
    );
  }

  // Show expired access message
  if (status === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Trial Expired
          </h2>
          <p className="text-gray-600 mb-6">
            Your 30-day free trial has ended. Upgrade to Pro to continue
            accessing your dashboard and managing your store.
          </p>
          <button
            onClick={() => router.push("/dashboard/billing")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full"
          >
            Upgrade to Pro - {prices.monthly}/month
          </button>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required to start
          </p>
        </div>
      </div>
    );
  }

  // Show trial warning for last few days
  if (status === "trial" && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-orange-50 border-b border-orange-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-orange-600">⚠️</div>
              <div>
                <div className="font-semibold text-orange-900">
                  Trial ending in {daysRemaining} day
                  {daysRemaining !== 1 ? "s" : ""}
                </div>
                <div className="text-sm text-orange-700">
                  Upgrade now to keep your store running without interruption
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard/billing")}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm"
            >
              Upgrade Now
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Allow access for all other cases
  return <>{children}</>;
}
