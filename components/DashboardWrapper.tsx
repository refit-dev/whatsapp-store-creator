"use client";

import { SubscriptionProvider } from "./SubscriptionProvider";
import { AutoTrialInitializer } from "./AutoTrialInitializer";
import { AccessGuard } from "./AccessGuard";
import { CurrencyProvider } from "./CurrencyProvider";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper for dashboard pages that provides subscription context,
 * auto-trial initialization, and access protection
 */
export function DashboardWrapper({ children }: DashboardWrapperProps) {
  return (
    <CurrencyProvider>
      <SubscriptionProvider>
        <AutoTrialInitializer />
        <AccessGuard>{children}</AccessGuard>
      </SubscriptionProvider>
    </CurrencyProvider>
  );
}
