"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "./OnboardingProvider";
import { usePathname } from "next/navigation";

const ONBOARDING_STEPS = [
  {
    id: 0,
    title: "Welcome to Watzy! 🎉",
    description:
      "Let's set up your WhatsApp store in just a few steps. Click 'Next' to begin!",
    action: null,
    element: null,
  },
  {
    id: 1,
    title: "Click on Store Settings",
    description:
      "First, let's configure your store. Click on the 'Store Settings' link in the sidebar.",
    action: "navigate",
    element: '[data-tour="store-settings-link"]',
    targetPath: "/dashboard/store",
  },
  {
    id: 2,
    title: "Enter Your Store Name",
    description:
      "Give your store a unique name. This will be visible to your customers.",
    action: "fill",
    element: '[data-tour="store-name-input"]',
  },
  {
    id: 3,
    title: "Add WhatsApp Number",
    description:
      "Enter your business WhatsApp number where customers can reach you.",
    action: "fill",
    element: '[data-tour="whatsapp-number"]',
  },
  {
    id: 4,
    title: "Save Your Settings",
    description:
      "Great! Now click the 'Save Changes' button to save your store settings.",
    action: "click",
    element: '[data-tour="save-store-button"]',
  },
  {
    id: 5,
    title: "Go to Products",
    description:
      "Perfect! Now let's add your first product. Click on 'Products' in the sidebar.",
    action: "navigate",
    element: '[data-tour="products-link"]',
    targetPath: "/dashboard/products",
  },
  {
    id: 6,
    title: "Add Your First Product",
    description:
      "Click the 'Add Product' button to create your first product listing.",
    action: "click",
    element: '[data-tour="add-product-button"]',
  },
  {
    id: 7,
    title: "You're All Set! 🎊",
    description:
      "Great work! Please verify your WhatsApp number and share your store link on WhatsApp to start receiving orders from customers.",
    action: null,
    element: null,
  },
];

export function AdaptiveOnboardingTour() {
  const {
    isOnboardingActive,
    currentStep,
    nextStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  const step = ONBOARDING_STEPS[currentStep];

  useEffect(() => {
    if (!isOnboardingActive || !step) return;

    // Wait a bit for page to render
    const timer = setTimeout(() => {
      if (step.element) {
        const element = document.querySelector(step.element);
        if (element) {
          const rect = element.getBoundingClientRect();

          // Calculate position - prefer below element, but adjust if off-screen
          let top = rect.bottom + 10;
          let left = 10; // Default mobile padding

          // Get tooltip width based on viewport
          const isMobile = window.innerWidth < 768;
          const tooltipWidth = isMobile ? window.innerWidth - 20 : 400;

          if (!isMobile) {
            left = rect.left;
            // Ensure tooltip stays within viewport horizontally
            if (left + tooltipWidth > window.innerWidth) {
              left = window.innerWidth - tooltipWidth - 20;
            }
            if (left < 20) {
              left = 20;
            }
          }

          // If tooltip would go below viewport, place it above the element
          const tooltipHeight = isMobile ? 250 : 300;
          if (top + tooltipHeight > window.innerHeight) {
            top = Math.max(10, rect.top - tooltipHeight - 10);
          }

          // Ensure top doesn't go negative
          if (top < 10) {
            top = 10;
          }

          setPosition({ top, left });
          setShow(true);

          // Highlight the element
          element.classList.add("onboarding-highlight");

          return () => {
            element.classList.remove("onboarding-highlight");
          };
        } else {
          setShow(false);
        }
      } else {
        // For steps without specific elements, show in center
        setShow(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isOnboardingActive, currentStep, step, pathname]);

  // Listen for user actions
  useEffect(() => {
    if (!isOnboardingActive || !step || !step.element) return;

    const element = document.querySelector(step.element);
    if (!element) return;

    const handleAction = (e: Event) => {
      if (step.action === "click") {
        nextStep();
      } else if (step.action === "fill") {
        const target = e.target as HTMLInputElement;
        if (target.value && target.value.trim().length > 0) {
          setTimeout(() => nextStep(), 500);
        }
      } else if (step.action === "select") {
        setTimeout(() => nextStep(), 500);
      } else if (step.action === "navigate") {
        // Will be handled by path change
      }
    };

    if (step.action === "click") {
      element.addEventListener("click", handleAction);
    } else if (step.action === "fill") {
      element.addEventListener("blur", handleAction);
    } else if (step.action === "select") {
      element.addEventListener("change", handleAction);
    }

    return () => {
      if (step.action === "click") {
        element.removeEventListener("click", handleAction);
      } else if (step.action === "fill") {
        element.removeEventListener("blur", handleAction);
      } else if (step.action === "select") {
        element.removeEventListener("change", handleAction);
      }
    };
  }, [isOnboardingActive, currentStep, step, nextStep]);

  // Handle navigation
  useEffect(() => {
    if (
      step?.action === "navigate" &&
      step.targetPath &&
      pathname === step.targetPath
    ) {
      setTimeout(() => nextStep(), 1000);
    }
  }, [pathname, step, nextStep]);

  if (!isOnboardingActive || !show) return null;

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <>
      {/* Overlay - blocks everything except highlighted element */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998]"
        style={{ pointerEvents: "none" }}
      />

      {/* Tooltip */}
      <div
        className={`fixed z-[9999] ${
          !step.element
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md mx-auto"
            : "left-2.5 right-2.5 md:left-auto md:right-auto md:w-full md:max-w-md"
        }`}
        style={
          step.element
            ? { top: `${position.top}px`, left: `${position.left}px` }
            : {}
        }
      >
        <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border-2 border-blue-500">
          {/* Progress bar */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>
                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            {step.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={skipOnboarding}
              className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium"
            >
              Skip Tour
            </button>
            <div className="flex gap-2">
              {!step.action && currentStep < ONBOARDING_STEPS.length - 1 && (
                <button
                  onClick={nextStep}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  Next
                </button>
              )}
              {currentStep === ONBOARDING_STEPS.length - 1 && (
                <button
                  onClick={completeOnboarding}
                  className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Arrow pointing to element - hide on mobile for better visibility */}
        {step.element && (
          <div className="hidden md:block absolute -top-2 left-4 w-4 h-4 bg-white border-t-2 border-l-2 border-blue-500 transform rotate-45" />
        )}
      </div>

      {/* CSS for highlighting */}
      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 9999 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          border-radius: 8px;
          pointer-events: auto !important;
        }

        .onboarding-highlight::before {
          content: "";
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: -1;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}
