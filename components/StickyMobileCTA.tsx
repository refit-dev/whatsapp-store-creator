/**
 * StickyMobileCTA Component
 * Fixed bottom CTA bar for mobile devices with scroll-based visibility
 * Appears after user scrolls past hero, hides when footer is visible
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackConversion, getScrollDepth } from "@/lib/analytics";

interface StickyMobileCTAProps {
  userStatus: "logged_in" | "logged_out";
  onCtaClick?: () => void;
}

export function StickyMobileCTA({
  userStatus,
  onCtaClick,
}: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set up intersection observers for hero and footer sections
    const heroSection = document.querySelector('[data-section="hero"]');
    const footerSection = document.querySelector('[data-section="footer"]');

    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Show sticky CTA when hero section is scrolled past
          if (!entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Hide sticky CTA when footer is visible to avoid redundancy
          if (entry.isIntersecting) {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroSection) {
      heroObserver.observe(heroSection);
    }

    if (footerSection) {
      footerObserver.observe(footerSection);
    }

    return () => {
      heroObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  const handleClick = () => {
    // Track click with scroll depth
    trackConversion("sticky_cta_click", {
      button_location: "sticky",
      user_status: userStatus,
      scroll_depth: getScrollDepth(),
    });

    if (onCtaClick) {
      onCtaClick();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-sm bg-white/95 border-t border-gray-200 shadow-lg animate-slide-up"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="px-4 py-3">
        <Link
          href={userStatus === "logged_in" ? "/dashboard" : "/auth"}
          onClick={handleClick}
          className="block w-full text-center px-6 py-4 bg-[#FF7A00] text-white rounded-xl font-semibold hover:bg-[#E66D00] transition-all shadow-md hover:shadow-lg text-base touch-target"
          style={{ minHeight: "56px" }}
        >
          {userStatus === "logged_in"
            ? "Go to Dashboard →"
            : "Create My Free WhatsApp Store"}
        </Link>
      </div>
    </div>
  );
}
