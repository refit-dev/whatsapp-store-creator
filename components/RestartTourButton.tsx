"use client";

import { useState } from "react";
import { useOnboarding } from "./OnboardingProvider";

export function RestartTourButton() {
  const { startOnboarding } = useOnboarding();
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestartTour = async () => {
    setIsRestarting(true);
    try {
      const response = await fetch("/api/onboarding/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Reload the page to restart the tour
        window.location.href = "/dashboard";
      } else {
        alert("Failed to restart tour. Please try again.");
      }
    } catch (error) {
      console.error("Error restarting tour:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <button
      onClick={handleRestartTour}
      disabled={isRestarting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors font-medium text-sm disabled:opacity-50"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isRestarting ? "Restarting..." : "Restart Platform Tour"}
    </button>
  );
}
