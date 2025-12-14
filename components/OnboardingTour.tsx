"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "../styles/driver-override.css";

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({
  run,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  useEffect(() => {
    if (!run) return;

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "body",
          popover: {
            title: "Welcome to Watzy! 🎉",
            description:
              "Let's take a quick tour to help you set up your WhatsApp store in just a few minutes. This will only take 2-3 minutes. You can skip anytime!",
            side: "over",
          },
        },
        {
          element: '[data-tour="store-settings-link"]',
          popover: {
            title: "Step 1: Store Settings",
            description:
              "First, let's set up your store details like name, WhatsApp number, and customize your store appearance.",
            side: "bottom",
          },
        },
        {
          element: '[data-tour="store-name-input"]',
          popover: {
            title: "Store Name & Handle",
            description:
              "Choose a unique name and handle for your store. Your handle will be part of your store URL. Example: watzy.app/yourhandle",
            side: "right",
          },
        },
        {
          element: '[data-tour="whatsapp-number"]',
          popover: {
            title: "WhatsApp Number",
            description:
              "Add your business WhatsApp number. Customers will send orders directly to this number. ⚠️ Make sure this number is active!",
            side: "right",
          },
        },
        {
          element: '[data-tour="currency-selector"]',
          popover: {
            title: "Currency Settings",
            description:
              "Select your preferred currency. This will be used for all product prices.",
            side: "right",
          },
        },
        {
          element: '[data-tour="save-store-button"]',
          popover: {
            title: "Save Your Settings",
            description:
              "Don't forget to save your changes! Click this button whenever you update store settings.",
            side: "top",
          },
        },
        {
          element: '[data-tour="products-link"]',
          popover: {
            title: "Step 2: Add Products",
            description:
              "Now let's add your first product! Click here to go to the products page.",
            side: "bottom",
          },
        },
        {
          element: '[data-tour="add-product-button"]',
          popover: {
            title: "Create Your First Product",
            description:
              "Click this button to add a new product with images, price, and description.",
            side: "bottom",
          },
        },
        {
          element: '[data-tour="product-form"]',
          popover: {
            title: "Product Details",
            description:
              "Add product name and price • Upload attractive product images • Write a clear description • Set stock quantity (optional)",
            side: "left",
          },
        },
        {
          element: '[data-tour="share-store-button"]',
          popover: {
            title: "Step 3: Share Your Store",
            description:
              "Once you've added products, share your store link with customers! You can copy the link or share directly on WhatsApp.",
            side: "bottom",
          },
        },
        {
          element: '[data-tour="orders-link"]',
          popover: {
            title: "Track Your Orders",
            description:
              "All customer orders will appear here. You can view details, mark as paid, and track analytics.",
            side: "bottom",
          },
        },
        {
          element: "body",
          popover: {
            title: "You're All Set! 🎊",
            description:
              "Congratulations! You now know how to: ✅ Set up your store settings ✅ Add products with images ✅ Share your store with customers ✅ Track orders and analytics. Need help? Contact us from the dashboard anytime!",
            side: "over",
          },
        },
      ],
      onDestroyStarted: () => {
        if (
          driverObj.getActiveIndex() ===
          driverObj.getConfig().steps?.length! - 1
        ) {
          onComplete();
        } else {
          onSkip();
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();

    return () => {
      driverObj.destroy();
    };
  }, [run, onComplete, onSkip]);

  return null;
}
