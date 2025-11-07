"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "./SubscriptionProvider";

/**
 * Component that automatically starts trials for new users
 * Should be included in dashboard layout to ensure all new users get trials
 */
export function AutoTrialInitializer() {
  const { subscription, status, isLoading, refreshSubscription } =
    useSubscription();
  const [hasChecked, setHasChecked] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Only run once when component mounts and subscription data is loaded
    if (isLoading || hasChecked) return;

    // If user has no subscription, try to auto-start trial
    if (status === "none") {
      startAutoTrial();
    } else {
      setHasChecked(true);
    }
  }, [isLoading, status, hasChecked]);

  const startAutoTrial = async () => {
    setIsStarting(true);

    // Set a maximum timeout of 5 seconds for auto-trial
    const timeoutId = setTimeout(() => {
      setIsStarting(false);
      setHasChecked(true);
    }, 5000);

    try {
      const response = await fetch("/api/subscription/auto-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh subscription data to reflect the new trial
        await refreshSubscription();
        console.log("Auto-trial started successfully");
      } else {
        console.log(
          "Auto-trial not needed or failed:",
          result.message || result.error
        );
      }
    } catch (error) {
      console.error("Error starting auto-trial:", error);
      // Don't block user flow if auto-trial fails
    } finally {
      clearTimeout(timeoutId);
      setIsStarting(false);
      setHasChecked(true);
    }
  };

  // This component works completely silently in the background
  // No UI is shown to avoid interrupting the user experience
  return null;
}
