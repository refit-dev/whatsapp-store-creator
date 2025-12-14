"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  nextStep: () => void;
  setStep: (step: number) => void;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/onboarding/status");
      if (response.ok) {
        const data = await response.json();
        // Start onboarding if not completed and not skipped
        if (!data.onboarding_completed && !data.onboarding_skipped) {
          setIsOnboardingActive(true);
          setCurrentStep(data.last_onboarding_step || 0);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStep(0);
  };

  const nextStep = async () => {
    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    // Save progress to backend
    try {
      await fetch("/api/onboarding/update-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: newStep }),
      });
    } catch (error) {
      console.error("Error updating onboarding step:", error);
    }
  };

  const setStep = async (step: number) => {
    setCurrentStep(step);

    // Save progress to backend
    try {
      await fetch("/api/onboarding/update-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
    } catch (error) {
      console.error("Error updating onboarding step:", error);
    }
  };

  const completeOnboarding = async () => {
    setIsOnboardingActive(false);
    setCurrentStep(0);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const skipOnboarding = async () => {
    setIsOnboardingActive(false);
    setCurrentStep(0);
    try {
      await fetch("/api/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        currentStep,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
        nextStep,
        setStep,
        isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
