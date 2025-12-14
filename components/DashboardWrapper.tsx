"use client";

import { SubscriptionProvider } from "./SubscriptionProvider";
import { AutoTrialInitializer } from "./AutoTrialInitializer";
import { AccessGuard } from "./AccessGuard";
import { CurrencyProvider } from "./CurrencyProvider";
import { OnboardingProvider } from "./OnboardingProvider";
import { AdaptiveOnboardingTour } from "./AdaptiveOnboardingTour";
import { useOnboarding } from "./OnboardingProvider";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useOnboarding();

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <AdaptiveOnboardingTour />
      {children}
    </>
  );
}

/**
 * Client-side wrapper for dashboard pages that provides subscription context,
 * auto-trial initialization, and access protection
 */
export function DashboardWrapper({ children }: DashboardWrapperProps) {
  return (
    <CurrencyProvider>
      <SubscriptionProvider>
        <OnboardingProvider>
          <AutoTrialInitializer />
          <AccessGuard>
            <DashboardContent>{children}</DashboardContent>
          </AccessGuard>
        </OnboardingProvider>
      </SubscriptionProvider>
    </CurrencyProvider>
  );
}
